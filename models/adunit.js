var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var aduSchema = new Schema({
    user_id: Number,
    category: String,
    name: String,
    type: String,
    created: Date,
    modified: { type: Date, default: Date.now }
}, { collection: 'adunits' });

var AdUnit = mongoose.model('AdUnit', aduSchema);

module.exports = AdUnit;
