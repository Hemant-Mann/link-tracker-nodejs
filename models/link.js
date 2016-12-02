var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var linkSchema = new Schema({
    domain: String,
    meta: { type: Schema.Types.Mixed },
    user_id: Schema.Types.ObjectId,
    ad_id: Schema.Types.ObjectId,
    created: Date,
    modified: Date,
    live: Boolean
}, { collection: 'links' });

var Link = mongoose.model('Link', linkSchema);
module.exports = Link;
