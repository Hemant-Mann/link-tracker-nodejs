var express = require('express');
var router = express.Router();
var geoip = require('geoip-lite');
var uri = require('url');
var UAParser = require('ua-parser-js');

// inlcude Models
var AdUnit = require('../models/adunit'),
    User = require('../models/user'),
    ClickTrack = require('../models/clicktrack'),
    Ad = require('../models/ad'),
    Impression = require('../models/impression');

var getClientIP = function (req) {
    var ip = req.headers['x-forwarded-for'] ||
        req.headers['cf-connecting-ip'];

    ip = ip.split(",")[0];
    return ip;
}

var findCountry = function (opts) {
    var req = opts.req,
        lookup,
        ip, country = "IN";

    return req.headers['cf-ipcountry'] || country;

    /*ip = getClientIP(req);
    lookup = opts.geoip.lookup(ip);
    if (lookup) {
        country = lookup.country;
    }
    return country;*/
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
            var e = new Error('Caution!! This page is trying to send you to ' + loc);
            return next(e);
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

            // referer = getReferer({ r: referer, uri: uri });

            User.process({
                aduid: aduid,
                cid: cid,
                cookie: cookie,
                lastTime: ti
            }, function (err, user) {
                if (err) { // user doing something fishy
                    return false;
                }

                ClickTrack.process({
                    aduid: aduid,
                    cid: cid,
                    ipaddr: ip,
                    cookie: cookie,
                    ua: req.headers['user-agent'],
                    referer: referer
                }, country, function () {
                    // process complete
                });
                
            });
            loc += '?utm_source=vnative';
            loc += '&utm_medium=' + pid;
            loc += '&utm_content=' + aduid;
            loc += '&utm_campaign=' + cid;
            
            res.redirect(loc);
        });
    });
});

router.get('/impression', function (req, res, next) {
    var params = req.query,
        aduid = params.aduid,
        cid = params.cid,
        dom = params.loc, // referer and domain should be the same
        ua = req.headers['user-agent'],
        screen = params.screen,    // width, height
        device = params.device,    // browser, os, model
        referer = req.get('Referrer') || '',
        parser = new UAParser(),
        country = findCountry({ req: req, geoip: geoip }),
        callback = params.callback;

    var uaResult = parser.setUA(ua).getResult();
    var obj = {
        browser: uaResult.browser.name,
        os: uaResult.os.name,
        model: uaResult.device.model || 'Desktop'
    };

    dom = (new Buffer(dom, 'base64')).toString('ascii');;
    referer = getReferer({ r: referer, uri: uri });

    var output = { success: true };
    output = callback + "(" + JSON.stringify(output) + ")";
    if (dom != referer || !screen) {
        return res.send(output);
    }

    // compare user agent on server with the details sent by the request
    if (JSON.stringify(obj) != JSON.stringify(device)) {
        return res.send(output);
    }


    Ad.findOne({ id: cid }, function (err, ad) {
        if (err || !ad) {
            return res.send(output);
        }

        AdUnit.findOne({ _id: aduid }, function (err, adunit) {
            if (err || !adunit) {
                return res.send(output);
            }

            Impression.process({
                aduid: aduid,
                cid: cid,
                domain: dom,
                ua: device.browser,
                device: device.model,
                country: country
            }, function (err, imp) {
            });
            res.send(output);
        });
    });
});

module.exports = router;
