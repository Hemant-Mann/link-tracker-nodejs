var mongoose = require('mongoose');
var Utils = require('../utils');
var urlParser = require('url');
var Schema = mongoose.Schema;

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

ckSchema.index({ adid: 1, pid: 1, ipaddr: 1, cookie: 1 });

ckSchema.statics.process = function (opts, extra, cb) {
    var self = this,
        dateQuery = Utils.dateQuery();

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
        }

        cb(newDoc);
    });
};

ckSchema.statics.utmString = function (loc, opts) {
    var qs = Utils.getSearchQuery(loc);
    qs['utm_source'] = opts.user_id;
    qs['utm_medium'] = 'affiliate';
    qs['utm_term'] = opts.ref;
    qs['utm_content'] = opts.ad.title;  // enocde this?
    qs['utm_campaign'] = opts.ad._id;

    var arr = [];
    for (var key in qs) {
        arr.push(key + '=' + qs[key]);
    }
    var str = arr.join('&');
    var parsedUrl = urlParser.parse(loc);

    return parsedUrl.protocol + '//' + parsedUrl.host + parsedUrl.pathname + '?' + str + parsedUrl.hash;
};

var ClickTrack = mongoose.model('ClickTrack', ckSchema);

module.exports = ClickTrack;
