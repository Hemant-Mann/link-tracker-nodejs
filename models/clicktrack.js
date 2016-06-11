var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uri = require('url');

// create a schema
var tSchema = new Schema({
    aduid: Schema.Types.ObjectId,
    pid: { type: Number, required: true },
    cid: { type: Number, required: true },
    hits: { type: Number, default: 1 },
    referer: [String],
    country: String,
    modified: { type: Date, default: Date.now }
}, { collection: 'clicktracks' });

tSchema.statics.process = function (opts, cb) {
    var self = this;
    self.findOne({ aduid: opts.aduid, country: opts.country, cid: opts.cid }, function (err, clickDoc) {
        if (err) {
        	return cb(err, null);
        }

        if (clickDoc) {
        	clickDoc.hits += 1;

        	if (clickDoc.referer.indexOf(opts.referer) === -1) {
        		clickDoc.referer.push(opts.referer);
        	}
        } else {
            clickDoc = new self(opts);
        }

        if (!clickDoc.referer) {
            clickDoc.referer = [];
        }
        
        clickDoc.save();
        cb();
    });
};

var ClickTrack = mongoose.model('ClickTrack', tSchema);

module.exports = ClickTrack;
