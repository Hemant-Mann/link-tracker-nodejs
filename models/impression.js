var mongoose = require('mongoose');
var Utils = require('../utils');
var Schema = mongoose.Schema;

// create a schema
var impSchema = new Schema({
    adid: Schema.Types.ObjectId,
    pid: Schema.Types.ObjectId,
    domain: String,
    ua: String,
    device: String,
    country: String,
    hits: { type: Number, default: 1 },
    modified: { type: Date, default: Date.now },
    created: Date
}, { collection: 'impressions' });

impSchema.index({ adid: 1, pid: 1, domain: 1, ua: 1, device: 1, country: 1, modified: 1 });

impSchema.statics.process = function (opts) {
	var self = this,
		dateQuery = Utils.dateQuery();

	var search = Utils.copyObj(opts);
	search.created = { $gte: dateQuery.start, $lte: dateQuery.end };
	
	self.findOne(search, function (err, imp) {
		if (err) { return; }

		if (!imp) {
			imp = new self(opts);
			imp.created = Date.now();
		} else {
			imp.hits += 1;
		}

		imp.modified = Date.now();
		imp.save();
	});
};

var Impression = mongoose.model('Impression', impSchema);

module.exports = Impression;
