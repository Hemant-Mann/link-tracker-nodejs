var mongoose = require('mongoose');
var Utils = require('../utils');
var Schema = mongoose.Schema;

// create a schema
var ckSchema = new Schema({
    cid: { type: Schema.Types.ObjectId, required: true },
    pid: Schema.Types.ObjectId,
    ipaddr: String,
    cookie: String,
    ua: String,
    referer: String,
    country: String,
    created: { type: Date, default: Date.now }
}, { collection: 'clicktracks' });

ckSchema.index({ cid: 1, pid: 1, ipaddr: 1, cookie: 1, referer: 1, created: 1 });

ckSchema.statics.process = function (opts, ua, country, cb) {
    var self = this,
        dateQuery = Utils.dateQuery();

    var search = Utils.copyObj(opts);
    search.created = { $gte: dateQuery.start, $lte: dateQuery.end };

    self.findOne(search, function (err, clickDoc) {
        if (err) {
            return cb(true);
        }

        var newDoc = false;
        if (!clickDoc) {
            newDoc = true;
            clickDoc = new self(opts);
            clickDoc.country = country;
            clickDoc.ua = ua;
            clickDoc.save();
        }

        cb(newDoc);
    });
};

var ClickTrack = mongoose.model('ClickTrack', ckSchema);

module.exports = ClickTrack;
