var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var impSchema = new Schema({
    aduid: Schema.Types.ObjectId,
    cid: Number,
    domain: String,
    ua: String,
    device: String,
    country: String,
    hits: { type: Number, default: 1 },
    modified: { type: Date, default: Date.now }
}, { collection: 'impressions' });

impSchema.statics.process = function (opts, cb) {
	var self = this;
	self.findOne(opts, function (err, imp) {
		if (err) {
			return cb(err, null);
		}

		if (!imp) {
			imp = new self(opts);
		} else {
			imp.hits += 1;
		}

		imp.save();
		cb(null, imp);
	});
};

var Impression = mongoose.model('Impression', impSchema);

module.exports = Impression;
