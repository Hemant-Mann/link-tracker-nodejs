var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var userSchema = new Schema({
    cookie: String,
    cid: Schema.Types.ObjectId,
    aduid: Schema.Types.ObjectId,
    lastTime: Number
}, { collection: 'tkusers' });

userSchema.statics.process = function (opts, cb) {
    var self = this;
    self.findOne({ cookie: opts.cookie, aduid: opts.aduid, cid: opts.cid }, function (err, user) {
        if (err) { // err in finding
            return cb(null, null);
        }

        if (!user) {
            user = new self(opts);
            user.save();
        } else {
            if (user.lastTime >= opts.lastTime) {
                var e = new Error('Invalid Request');
                return cb(e, null);
            }
        }
        cb(null, user);
    });
};

var User = mongoose.model('User', userSchema);
module.exports = User;
