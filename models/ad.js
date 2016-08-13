var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var adSchema = new Schema({
    user_id: Schema.Types.ObjectId,
    org_id: Schema.Types.ObjectId,
    title: String,
    description: String,
    url: String,
    image: String,
    category: [Schema.Types.ObjectId],
    type: String,
    category: [],
    created: Date,
    live: Boolean,
    modified: { type: Date, default: Date.now }
}, { collection: 'ads' });

var Ad = mongoose.model('Ad', adSchema);

module.exports = Ad;
