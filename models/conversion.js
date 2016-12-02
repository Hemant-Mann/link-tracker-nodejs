var mongoose = require('mongoose');
var Utils = require('../utils');
var Schema = mongoose.Schema;
var Callback = require('../scripts/callback');
var Click = require('./click');

// create a schema
var convSchema = new Schema({
    adid: { type: Schema.Types.ObjectId, required: true },
    pid: { type: Schema.Types.ObjectId, required: true },
    cid: { type: Schema.Types.ObjectId, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    created: { type: Date, default: Date.now }
}, { collection: 'conversions' });

convSchema.index({ cid: 1 });

convSchema.statics.process = function (find, req, callback) {
	var self = this;
	var extra = find.extra; delete find.extra;
	Click.findOne(find, function (err, c) {
	    if (err || !c || c.is_bot) {
	        return callback(true, null);
	    }

	    self.findOne({ cid: c._id }, function (err, doc) {
	        if (err || !doc) {
	            var conv = new self({
	                cid: c._id, adid: c.adid,
	                pid: c.pid, created: Date.now()
	            });
	            conv.meta = extra;
	            conv.save(function (err) {
	            });

	            // check for callback request
	            Callback.fire('conversion', {obj: c, req: req});
	        }

	        callback(null, true);
	    });
	});
}

var Conversion = mongoose.model('Conversion', convSchema);
module.exports = Conversion;
