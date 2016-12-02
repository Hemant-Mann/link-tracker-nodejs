var Ad = require('../models/ad');
var PostBack = require('../models/postback');
var async = require('async');
var Http = require('./http');

var Callback = (function () {
	function Callback() {}

	Callback.prototype = {
		_getQuery: function (type, opts) {
			var query = {live: true, event: opts.opts.type};
			switch (type) {
				case 'publisher':
					query.user_id = opts.obj.pid;
					break;

				case 'advertiser':
					query.user_id = opts.ad.user_id;
					break;
			}
			return query;
		},
		_check: function (query, opts, cb) {
			PostBack.findOne(query, function (err, p) {
				if (err || p.type !== "url") {
					return cb(false);
				}

				// make request
				var finalUrl = Http.redirectUrl(opts.ad, opts.opts, opts.obj);
                Http.get(finalUrl);
                return cb(true);
			});
		},
		_local: function (type, opts, cb) {
			var query = this._getQuery(type, opts);
			query.ad_id = opts.ad._id;
			this._check(query, opts, cb);
		},
		_global: function (type, opts, cb) {
			var query = this._getQuery(type, opts);
			this._check(query, opts, cb);
		},
		_fire: function (event, obj, req) {
			var self = this;
			async.waterfall([
				function (cb) {
					Ad.findOne({ _id: obj.adid }, '_id user_id url', cb);
				},
				function (ad, cb) {
					if (!ad) {
						return cb({error: "Something fishy is going on"});
					}
					var opts = {obj: obj, ad: ad, opts: {headers: req.headers, type: event}};
					var reqList = ['publisher', 'advertiser'];
					var init = 0, total = reqList.length;

					// pub + adv - check local callback if not exists then execute global
					reqList.forEach(function (type) {
						self._local(type, opts, function (done) {
							init++;

							if (done === false) {
								self._global(type, opts, function (d) {});
							}

							if (init >= total) {
								cb(null, opts);
							}
						});
					});
				},
				// check if any global campaign callback exists
				function (opts) {
					var query = self._query(null, opts);
					query.user_id = {$exists: false};
					self._check(query, opts)
				}
			], function (err) {
				// something went wrong
			});
		},
		fire: function (event, opts) {
			var self = this;
			switch (event) {
				case 'click':
				case 'conversion':
				case 'impression':
					self._fire(event, opts.obj, opts.req);
					break;
			}
		}
	};

	return new Callback;
}());

module.exports = Callback;