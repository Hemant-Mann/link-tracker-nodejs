var mongoose = require('mongoose');
var Utils = require('../utils');
var urlParser = require('url');
var Schema = mongoose.Schema;

// create a schema
var convSchema = new Schema({
    adid: { type: Schema.Types.ObjectId, required: true },
    pid: { type: Schema.Types.ObjectId, required: true },
    cid: { type: Schema.Types.ObjectId, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    created: { type: Date, default: Date.now }
}, { collection: 'conversions' });

convSchema.index({ cid: 1 });

var Conversion = mongoose.model('Conversion', convSchema);

module.exports = Conversion;
