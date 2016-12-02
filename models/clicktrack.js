var mongoose = require('mongoose');
var Utils = require('../utils');
var Http = require('../scripts/http');
var urlParser = require('url');
var Schema = mongoose.Schema;
var Callback = require('../scripts/callback');

// create a schema
var ckSchema = new Schema({
    adid: { type: Schema.Types.ObjectId, required: true },
    pid: Schema.Types.ObjectId,
    ipaddr: String,
    cookie: { type: String, required: true },
    is_bot: { type: Boolean, default: false },
    device: String,
    browser: String,
    os: String,
    referer: String,
    country: String,
    created: { type: Date, default: Date.now }
}, { collection: 'clicks' });

ckSchema.statics.process = function (opts, extra, cb) {
    var self = this,
        dateQuery = Utils.dateQuery();

    var req = opts.req; delete opts.req;
    var search = Utils.copyObj(opts);

    self.findOne(search, function (err, clickDoc) {
        if (err) {
            return cb(true);
        }

        var newDoc = false,
            extraKeys = Object.keys(extra);
        if (!clickDoc) {
            newDoc = true;
            clickDoc = new self(opts);
            extraKeys.forEach(function (k) {
                clickDoc[k] = extra[k];
            });

            // Save only hostname instead of full URL
            var parsedUrl = urlParser.parse(clickDoc.referer);
            clickDoc.referer = parsedUrl.host;
            clickDoc.save();

            Callback.fire('click', {obj: clickDoc, req: req});
        }

        cb(newDoc);
    });
};

ckSchema.statics.utmString = function (loc, opts) {
    var parser = Http.parseUrl(loc);
    var qs = parser.query;

    qs['utm_source'] = opts.user_id;
    qs['utm_medium'] = 'affiliate';
    qs['utm_term'] = opts.ref;
    qs['utm_content'] = opts.ad.title;  // enocde this?
    qs['utm_campaign'] = opts.ad._id;

    return Http.makeUrl(parser, query);
};

var ClickTrack = mongoose.model('ClickTrack', ckSchema);
module.exports = ClickTrack;
