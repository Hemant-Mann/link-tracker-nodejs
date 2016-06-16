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

ckSchema.statics.process = function (opts, country, cb) {
    var self = this;
    self.findOne(opts, function (err, clickDoc) {
        if (err) {
            return cb(err, null);
        }

        if (!clickDoc) {
            clickDoc = new self(opts);
            clickDoc.country = country;
            clickDoc.save();
        }

        cb();
    });
};

var ClickTrack = mongoose.model('ClickTrack', ckSchema);

module.exports = ClickTrack;
