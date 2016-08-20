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
    ua: String,
    referer: String,
    country: String,
    created: { type: Date, default: Date.now }
}, { collection: 'clicks' });

ckSchema.index({ adid: 1, pid: 1, ipaddr: 1, cookie: 1 });

ckSchema.statics.process = function (opts, extra, cb) {
    var self = this,
        dateQuery = Utils.dateQuery();

    var search = Utils.copyObj(opts);
    // search.created = { $gte: dateQuery.start, $lte: dateQuery.end };

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
            clickDoc.save();
        }

        cb(newDoc);
    });
};

ckSchema.statics.utmString = function (loc, cid, pid) {
    var qs = Utils.getSearchQuery(loc);
    qs['utm_source'] = 'vnative';
    qs['utm_medium'] = pid;
    qs['utm_campaign'] = cid;

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
