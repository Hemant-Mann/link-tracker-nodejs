var Ad = require('../models/ad');
var PostBack = require('../models/postback');
var async = require('async');
var Http = require('./http');

var Callback = (function () {
	function Callback() {}

	Callback.prototype = {
		_getQuery: function (type, opts) {
			var query = {live: true, event: opts.event};
			switch (type) {
				case 'publisher':
					query.user_id = opts.click.pid;
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
				var finalUrl = Http.redirectUrl(opts.ad, opts.req, opts.click);
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
		_campaignOnly: function (type, opts, cb) {
			var query = this._getQuery(type, opts);
			this._check(query, opts, cb);
		},
		_fire: function (event, click, req) {
			var self = this;
			async.waterfall([
				function (cb) {
					Ad.findOne({ _id: click.adid }, '_id user_id url', cb);
				},
				function (ad, cb) {
					var opts = {click: click, ad: ad, req: req, event: event};
					var reqList = ['publisher', 'advertiser'];
					var init = 0, total = reqList.length;

					reqList.forEach(function (type) {
						self._local(type, opts, function (done) {
							init++;

							if (done === false) {
								self._global(type, opts, function (d) {});
							}

							if (init >= total) {
								cb(opts);
							}
						});
					});
				},
				function (opts) {
					var query = self._query(null, opts);
					query.user_id = {$exists: false};
					self._check(query, opts)
				}
			], function (err) {
				// something went wrong
			});
		},
		_fireImp: function () {

		},
		fire: function (event, opts) {
			var self = this;
			switch (event) {
				case 'click':
				case 'conversion':
					self._fire(event, opts.click, opts.req);
					break;

				case 'impression':
					self._fireImp(opts.impression, opts.req);
					break;
			}
		}
	};

	return new Callback;
}());

module.exports = Callback;