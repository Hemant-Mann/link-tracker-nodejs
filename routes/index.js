var express = require('express');
var router = express.Router();
var uri = require('url');
var UAParser = require('ua-parser-js');

// inlcude Models
var User = require('../models/user'),
    ClickTrack = require('../models/clicktrack'),
    Ad = require('../models/ad'),
    Impression = require('../models/impression');

var getClientIP = function (req) {
    var ip = req.headers['x-forwarded-for'] ||
        req.headers['cf-connecting-ip'];

    ip = ip.split(",")[0];
    return ip;
}

var findCountry = function (req) {
    var country = "IN";

    return req.headers['cf-ipcountry'] || country;
};

var getReferer = function (opts) {
    var hostn = opts.uri.parse(opts.r).hostname;
    return hostn;
};

// Capture tracking request
router.get('/click', function (req, res, next) {
    var params = req.query,
        pid = params.pid,
        cid = params.cid,
        ua = req.headers['user-agent'],
        cookie = params.ckid,
        ti = Number(params.ti),
        dest = params.dest;

    // @todo handle these multi-level callbacks
    var loc = new Buffer(dest, 'base64');
    if (isNaN(ti) || cookie.length < 15) {
        return res.redirect(loc);
    }

    Ad.findOne({ _id: cid }, '_id url', function (err, ad) {
        if (err || !ad || ad.url != loc) {
            return res.status(400).json({ error: "Caution!! This page is trying to send you to " + loc });
        }

        var country = findCountry(req);
        var ip = getClientIP(req),
            referer = req.get('Referrer') || '';

        User.process({
            cid: cid,
            pid: pid,
            cookie: cookie,
            lastTime: ti
        }, function (err, user) {
            if (err) { // user doing something fishy
                return res.redirect(loc);
            }

            ClickTrack.process({
                cid: cid,
                pid: pid,
                ipaddr: ip,
                cookie: cookie,
                referer: referer
            }, ua, country, function (newDoc) {
                if (!newDoc) {
                    return res.redirect(loc);
                }

                loc += '?utm_source=vnative';
                loc += '&utm_medium=' + pid;
                loc += '&utm_campaign=' + cid;
                res.redirect(loc);
            });
            
        });
    });
});

/**
 * Tracking the impressions
 */
router.get('/impression', function (req, res, next) {
    var params = req.query,
        pid = params.pid,
        cid = params.cid,
        dom = params.loc, // referer and domain should be the same
        ua = req.headers['user-agent'],
        screen = params.screen,    // width, height
        device = params.device,    // browser, os, model
        referer = req.get('Referrer') || '',
        parser = new UAParser(),
        country = findCountry(req),
        callback = params.callback;

    var uaResult = parser.setUA(ua).getResult();
    var obj = {
        browser: uaResult.browser.name,
        os: uaResult.os.name
    };

    dom = (new Buffer(dom, 'base64')).toString('ascii');
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

    var mobile = Boolean(Number(params.mobile));
    var platform = null;
    if (mobile) {
        platform = "mobile";
    } else if (Boolean(ua.match(/(iPad|SCH-I800|xoom|kindle)/i))) {
        platform = "tablet";
    } else {
        platform = "desktop";
    }

    Ad.findOne({ _id: cid }, function (err, ad) {
        if (err || !ad) {
            return res.send(output);
        }

        Impression.process({
            cid: cid,
            pid: pid,
            domain: dom,
            ua: device.browser,
            device: platform,
            country: country
        });

        res.send(output);
    });
});

module.exports = router;
