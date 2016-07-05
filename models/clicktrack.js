var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var ckSchema = new Schema({
    aduid: Schema.Types.ObjectId,
    cid: { type: Schema.Types.ObjectId, required: true },
    ipaddr: String,
    cookie: String,
    ua: String,
    referer: String,
    country: String,
    created: { type: Date, default: Date.now }
}, { collection: 'clicktracks' });

ckSchema.index({ aduid: 1, cid: 1, ipaddr: 1, cookie: 1, referer: 1, created: 1 });

ckSchema.statics.process = function (opts, ua, country, cb) {
    var self = this,
        start = new Date(),
        end = new Date();

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    opts.created = {
        $gte: start,
        $lte: end
    };

    self.findOne(opts, function (err, clickDoc) {
        if (err) {
            return cb(err, null);
        }

        if (!clickDoc) {
            clickDoc = new self(opts);
            clickDoc.country = country;
            clickDoc.ua = ua;
            clickDoc.save();
        }

        cb();
    });
};

var ClickTrack = mongoose.model('ClickTrack', ckSchema);

module.exports = ClickTrack;
