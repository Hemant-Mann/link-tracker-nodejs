var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var aduSchema = new Schema({
    user_id: Schema.Types.ObjectId,
    category: String,
    name: String,
    type: String,
    created: Date,
    privacy: String,
    modified: { type: Date, default: Date.now }
}, { collection: 'adunits' });

var AdUnit = mongoose.model('AdUnit', aduSchema);

module.exports = AdUnit;
