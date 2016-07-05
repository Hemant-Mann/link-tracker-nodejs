var express = require('express');
var router = express.Router();
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
        aduid = params.slot,
        pid = params.pid,
        cid = params.cid,
        cookie = params.ckid,
        ti = Number(params.ti),
        dest = params.dest;

    // @todo handle these multi-level callbacks
    var loc = new Buffer(dest, 'base64');
    if (isNaN(ti) || cookie.length < 15) {
        return res.redirect(loc);
    }

    Ad.findOne({ _id: cid }, function (err, ad) {
        if (err || !ad || ad.url != loc) {
            return res.status(400).json({ error: "Caution!! This page is trying to send you to " + loc });
        }

        // find Adunit from the Database
        AdUnit.findOne({ _id: aduid }, function (err, adunit) {
            // some url validations to check for best practises
            if (err || !adunit || adunit.user_id != pid) {
                return res.status(400).json({ error: "Error processing your request!" });
            }

            var country = findCountry(req);
            var ip = getClientIP(req),
                referer = req.get('Referrer') || '';

            User.process({
                aduid: aduid,
                cid: cid,
                cookie: cookie,
                lastTime: ti
            }, function (err, user) {
                if (err) { // user doing something fishy
                    return res.redirect(loc);
                }

                loc += '?utm_source=vnative';
                loc += '&utm_medium=' + pid;
                loc += '&utm_content=' + aduid;
                loc += '&utm_campaign=' + cid;
                res.redirect(loc);

                ClickTrack.process({
                    aduid: aduid,
                    cid: cid,
                    ipaddr: ip,
                    cookie: cookie,
                    referer: referer
                }, ua, country, function () {
                    // process complete
                });
                
            });
        });
    });
});

/**
 * Tracking the impressions
 */
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
        platform = "Mobile";
    } else {
        platform = "Desktop";
    }

    Ad.findOne({ _id: cid }, function (err, ad) {
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
                device: platform,
                country: country
            });
        });

        res.send(output);
    });
});

module.exports = router;
