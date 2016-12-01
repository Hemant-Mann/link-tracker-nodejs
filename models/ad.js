var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Utils = require('../utils');
var Http = require('../scripts/http');

// create a schema
var adSchema = new Schema({
    user_id: Schema.Types.ObjectId,
    org_id: Schema.Types.ObjectId,
    title: String,
    description: String,
    url: String,
    image: String,
    meta: { type: Schema.Types.Mixed },
    category: [Schema.Types.ObjectId],
    type: String,
    category: [],
    created: Date,
    live: Boolean,
    modified: { type: Date, default: Date.now }
}, { collection: 'ads' });

adSchema.statics.convCallback = function (req, click) {
    // find ad from click id
    var self = this;
    self.findOne({ _id: click.adid }, 'meta', function (err, ad) {
        if (err || !ad || !ad.meta || !ad.meta.callback) {
            return false;
        }

        var callback = ad.meta.callback;
        if (!callback.data || !callback.live) {
            return false;
        }

        var finalUrl = null;
        switch (callback.type) {
            case 'url':
            default:
                var parser = Http.parseUrl(callback.data);
                var allowedParams = Http.getTrackingParams(ad, req, click);

                qs = Http.queryParams(parser.query, allowedParams);
                finalUrl = Http.makeUrl(parser, qs);
                break;
        }

        if (!finalUrl) { return false; }

        Http.get(finalUrl, {ua: click.browser}, function (err, response, body) {
            // optional do something
        });
    });
}

var Ad = mongoose.model('Ad', adSchema);

module.exports = Ad;
