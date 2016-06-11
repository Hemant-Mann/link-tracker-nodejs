var express = require('express');
var router = express.Router();
var geoip = require('geoip-lite');
var uri = require('url');

// inlcude Models
var AdUnit = require('../models/adunit'),
    User = require('../models/user'),
    ClickTrack = require('../models/clicktrack'),
    Ad = require('../models/ad');

var getClientIP = function (req) {
    var ip;
    // else process the request
    ip = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

    return ip;
}

var findCountry = function (opts) {
    var req = opts.req,
        lookup,
        ip, country = "IN";

    ip = getClientIP(req);

    lookup = opts.geoip.lookup(ip);
    if (lookup) {
        country = lookup.country;
    }
    return country;
};

var getReferer = function (opts) {
    var hostn = opts.uri.parse(opts.r).hostname;
    return hostn;
};

// Capture tracking request
router.get('/click', function (req, res, next) {
    var params = req.query,
        aduid = params.slot,
        pid = Number(params.pid),
        cid = params.cid,
        cookie = params.ckid,
        ti = Number(params.ti),
        dest = params.dest;

    
    // @todo handle these multi-level callbacks
    var loc = new Buffer(dest, 'base64');
    if (isNaN(ti) || isNaN(pid) || cookie.length < 15) {
        return res.redirect(loc);
    }
    Ad.findOne({ id: cid }, function (err, ad) {
        if (err || !ad || ad.url != loc) {
            // var e = new Error('Caution!! This page is trying to send you to ' + loc);
            // return next(e);
        }

        // find Adunit from the Database
        AdUnit.findOne({ _id: aduid }, function (err, adunit) {
            // some url validations to check for best practises
            if (err || !adunit || adunit.user_id !== pid) {
                return next(new Error('Something went wrong!!'));
            }

            var country = findCountry({ req: req, geoip: geoip });
            var ip = getClientIP(req),
                referer = req.get('Referrer') || '';

            referer = getReferer({ r: referer, uri: uri });

            User.process({
                ipaddr: ip,
                country: country,
                campaign: cid,
                cookie: cookie,
                referer: referer,
                lastTime: ti,
                ua: req.headers['user-agent']
            }, function (err, user) {
                if (err) { // user doing something fishy
                    return false;
                }

                ClickTrack.process({
                    aduid: aduid,
                    pid: pid,
                    cid: cid,
                    referer: referer,
                    country: country,
                }, function () {
                    // process complete
                });
                
            });
            res.redirect(loc);
        });
    });
});

module.exports = router;
