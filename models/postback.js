var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var postbSchema = new Schema({
    event: String,
    data: String,
    type: String,
    user_id: Schema.Types.ObjectId,
    org_id: Schema.Types.ObjectId,
    ad_id: Schema.Types.ObjectId,
    created: Date,
    modified: Date,
    live: Boolean
}, { collection: 'postbacks' });

var PostBack = mongoose.model('PostBack', postbSchema);
module.exports = PostBack;
