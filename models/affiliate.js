var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var affSchema = new Schema({
    name: String,
    email: String,
    meta: { type: Schema.Types.Mixed },
    org_id: Schema.Types.ObjectId,
    password: String,
    phone: String,
    country: String,
    currency: String,
    type: String,
    login: Date,
    created: Date,
    modified: Date,
    live: Boolean
}, { collection: 'users' });

var Affiliate = mongoose.model('Affiliate', affSchema);
module.exports = Affiliate;
