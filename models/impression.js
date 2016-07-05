var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var impSchema = new Schema({
    aduid: Schema.Types.ObjectId,
    cid: Schema.Types.ObjectId,
    domain: String,
    ua: String,
    device: String,
    country: String,
    hits: { type: Number, default: 1 },
    modified: { type: Date, default: Date.now }
}, { collection: 'impressions' });

impSchema.index({ aduid: 1, cid: 1, domain: 1, ua: 1, device: 1, country: 1, modified: 1 });

impSchema.statics.process = function (opts) {
	var self = this,
		start = new Date(),
		end = new Date();

	start.setHours(0, 0, 0, 0);
	end.setHours(23, 59, 59, 999);

	opts.modified = {
		$gte: start,
		$lte: end
	};
	self.findOne(opts, function (err, imp) {
		if (err) {
			return;
		}

		if (!imp) {
			imp = new self(opts);
		} else {
			imp.hits += 1;
		}

		imp.modified = Date.now();
		imp.save();
	});
};

var Impression = mongoose.model('Impression', impSchema);

module.exports = Impression;
