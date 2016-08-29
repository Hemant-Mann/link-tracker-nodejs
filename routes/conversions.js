var express = require('express');
var router = express.Router();
var Utils = require('../utils');

// inlcude Models
var Click = require('../models/clicktrack');
var Conversion = require('../models/conversion');

// Capture tracking request
router.get('/acquisition', function (req, res, next) {
    var params = req.query,
        cid = params.cid;

    Click.findOne({ _id: cid }, 'adid pid _id', function (err, c) {
        if (err) {
            return res.json({ success: false, error: "Internal Server Error" });
        }

        if (!c) {
            return res.json({ success: false, error: "Invalid Request" });
        }

        Conversion.findOne({ cid: c._id }, function (err, doc) {
            if (err || !doc) {
                var conv = new Conversion({
                    cid: c._id, adid: c.adid,
                    pid: c.pid, created: Date.now()
                });
                conv.save();
            }
            res.json({ success: true });
        })
    });
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

module.exports = router;
