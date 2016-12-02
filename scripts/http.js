var req = require('request');
var queryString = require('querystring');
var urlParser = require('url');

var httpModule = {
    searchQuery: function (location) {
        var parsedUrl = urlParser.parse(location);

        return queryString.parse(parsedUrl.query) || {};
    },
    getClientIP: function (req) {
        var last = false;
        var ip = req.headers['cf-connecting-ip'] || req.headers['x-real-ip'] || req.headers['x-forwarded-for'];
        if (!req.headers['cf-connecting-ip'] && req.headers['x-forwarded-for']) {
            last = true;
        }

        var arr = ip.split(",");
        arr = arr.map(function (el) {
            return el.trim();
        });

        if (last) {
            return arr.pop();            
        }

        return arr[0];
    },
    queryParams: function (arr, allowedParams) {
        var result = arr;
        for (var prop in arr) {
            var matches = arr[prop].match(/\{([a-z_0-9]+)\}/);

            if (!matches) { continue; }

            var key = matches[1] || null;
            if (key) {
                if (typeof allowedParams[key] === "undefined" && !allowedParams[key]) {
                    delete result[prop];
                } else {
                    result[prop] = allowedParams[key];
                }
            }
        }
        return result;
    },
    getTrackingParams: function (ad, opts, obj) {
        var allowedParams = {
            aff_id: obj.pid,
            adv_id: ad.user_id,
            ad_id: ad._id,
            tdomain: opts.headers.host
        };

        if (typeof(obj) === "object") {
            allowedParams.agent = obj.browser;
            allowedParams.referer = obj.referer;
            switch (opts.type) {
                case 'impression':
                    allowedParams.hits = obj.hits;
                    break;

                case 'click':
                case 'conversion':
                default:
                    allowedParams.click_id = obj._id;
                    allowedParams.click_time = obj.created;
                    allowedParams.ip = obj.ipaddr;
                    allowedParams.aff_sub1 = obj.p1 || null;
                    allowedParams.aff_sub2 = obj.p2 || null;
                    break;
            }
        }
    },
    redirectUrl: function (ad, opts, obj) {
        var self = this, parser = self.parseUrl(ad.url);
        var allowedParams = self.getTrackingParams(ad, opts, obj);

        qs = self.queryParams(parser.query, allowedParams);
        finalUrl = self.makeUrl(parser, qs);
        return finalUrl;
    },
    makeUrl: function (parser, query) {
        var str = parser.protocol + '//' + parser.host + parser.pathname;

        if (query && parser.query) {
            str += '?' + queryString.stringify(query);
        }

        if (parser.hash) {
            str += "#" + parser.hash;
        }
        return str;
    },
    parseUrl: function (uri) {
    	var parsed = urlParser(uri);
    	var self = this, qs = {};

    	if (typeof(parsed.query) === "string" && parsed.query.length > 1) {
    		qs = self.searchQuery(uri);
    	}
    	parsed.query = qs;
    	return parsed;
    },
    get: function (uri, opts, callback) {
    	this._request('GET', uri, opts, callback);
    },
    post: function (uri, opts, callback) {
    	this._request('POST', uri, opts, callback);
    },
    delete: function (uri, opts, callback) {
    	this._request('DELETE', uri, opts, callback);
    },
    _request: function (method, uri, opts, callback) {
    	request({
	        url: uri,
	        method: method,
	        qs: opts.qs || {},
	        headers: {
	        	'User-Agent': opts.ua || "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36"
	        }
    	}, callback);
    }
};

module.exports = httpModule;