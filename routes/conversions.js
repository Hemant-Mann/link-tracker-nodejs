var express = require('express');
var router = express.Router();
var Utils = require('../utils');
var UAParser = require('ua-parser-js');
var path = require('path');

// inlcude Models
var Click = require('../models/clicktrack');
var Ad = require('../models/ad');
var Conversion = require('../models/conversion');

var getClientIP = function (req) {
    var ip = req.headers['x-forwarded-for'] ||
        req.headers['cf-connecting-ip'];

    ip = ip.split(",")[0];
    return ip;
};

function processConv(find, callback) {
    Click.findOne(find, 'adid pid _id', function (err, c) {
        if (err || !c) {
            return callback(true, null);
        }

        Conversion.findOne({ cid: c._id }, function (err, doc) {
            if (err || !doc) {
                var conv = new Conversion({
                    cid: c._id, adid: c.adid,
                    pid: c.pid, created: Date.now()
                });
                conv.save();
            }

            callback(null, true);
        });
    });
}

// Capture tracking request
router.get('/acquisition', function (req, res, next) {
    var cid = req.query.click_id,
        callback = req.query.callback || 'callback';

    var msg = { success: true };
    var output = callback + "(" + JSON.stringify(msg) + ")";
    processConv({_id: cid}, function (err, success) {
        res.send(output);
    });
});

router.get('/pixel', function (req, res, next) {
    var ckid = req.cookies.__vmtraffictracking;
    var adid = req.query.adid;

    if (!ckid && !adid) {
        if (req.query.ckid) {
            res.cookie('__vmtraffictracking', req.query.ckid, {path: '/', domain: req.headers['host'], httpOnly: true});
        }
        res.sendFile(path.join(__dirname, '../public/_blue.gif'));
    } else {
        processConv({cookie: ckid, adid: adid}, function (err, success) {
            // send an image
            res.sendFile(path.join(__dirname, '../public/_blue.gif'));
        });
    }
});

// https://play.google.com/store/apps/details?id=com.swiftintern&referrer=utm_source%3Duser_id%26utm_medium%3Daffiliate%26utm_term%3Dreferer%26utm_content%3Dclick_id%26utm_campaign%3Dad_id
// request will be containing the part from referrer={url_encoded}
router.get('/app', function (req, res, next) {
    var params = req.query;

    var errObj = { success: false, error: "Invalid Request" };
    if (params.utm_medium !== 'affiliate') {
        return res.json(errObj);
    }

    Click.findOne({ _id: params.utm_content }, 'adid pid _id', function (err, c) {
        if (err || !c || (c.pid != params.utm_source || c.adid != params.utm_campaign)) {
            return res.json(errObj);
        }

        Conversion.findOne({ cid: c._id }, function (err, doc) {
            if (err) {
                return res.json({ success: false, error: "Internal Server Error" });
            }

            if (!doc) {
                var conv = new Conversion({
                    cid: c._id, adid: c.adid,
                    pid: c.pid, created: Date.now(),
                    meta: { referer: params.utm_term }
                });
                conv.save();
            }
            return res.json({ success: true });
        });
    });

    res.json(params);
});

// When click is send by the JS added on advertiser website because we are
// not using proxy domain directly redirecting to the Final Website
router.get('/track/click', function (req, res, next) {
    var parser = new UAParser(req.headers['user-agent']);
    var adid = req.query.adid,
        pid = req.query.pid,
        callback = req.query.callback || 'callback',
        output = callback + "(" + JSON.stringify({ success: true }) + ")",
        referer = req.get('Referrer'),
        navigator = Boolean(Number(req.query.u || "0")),
        userAgent = req.query.ua || "";

    var ua = (new Buffer(dom, 'base64')).toString('ascii');
    var ti = Number(req.query.ti || "NaN");
    // some basic checks
    if (!referer || !navigator || ua !== req.headers['user-agent'] || isNaN(ti)) {
        return res.send(output);
    }

    Ad.findOne({ _id: adid }, '_id', function (err, ad) {
        if (!ad) {
            return res.send(output);
        }

        var device = Utils.device(req);
        var parser = new UAParser(req.headers['user-agent']);
        var uaResult = parser.getResult();
        var extra = { browser: uaResult.browser.name, country: Utils.findCountry(req), referer: referer, device: device };
        if (uaResult.os.name) {
            extra['os'] = uaResult.os.name;
        }
        
        Click.process({
            adid: adid, ipaddr: getClientIP(req),
            pid: pid, cookie: req.query.ckid
        }, extra, function () {

        });
        res.send(output);
    });

    res.json({ success: true });
});

module.exports = router;
