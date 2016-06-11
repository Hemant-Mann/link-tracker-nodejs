var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var userSchema = new Schema({
    cookie: String,
    ipaddr: [String],
    referer: { type: [String], default: [] },
    campaign: [Number],
    ua: [String],
    country: [String],
    lastTime: Number,
    visits: { type: Number, default: 1 },
    modified: { type: Date, default: Date.now }
}, { collection: 'users' });

userSchema.statics.process = function (opts, cb) {
    var self = this;
    self.findOne({ cookie: opts.cookie }, function (err, user) {
        if (err) { // err in finding
            return cb(null, null);
        }

        // check user details
        var multi = ['ipaddr', 'referer', 'ua', 'country', 'campaign'];
        if (user) {
            if (user.lastTime >= opts.lastTime) {
                var e = new Error('Invalid Request');
                return cb(e, null); // don't update clicks stats
            } else {
                user.lastTime = opts.lastTime;
            }

            multi.forEach(function (el) {
                if (opts[el] && user[el].indexOf(opts[el]) === -1) {
                    user[el].push(opts[el]);
                }
            });

            user.visits += 1;
        } else {
            user = new self(opts);
        }

        multi.forEach(function (el) {
            if (!user[el]) {
                user[el] = [];
            }
        });
        user.save();
        cb(null, user);
    });
};

var User = mongoose.model('User', userSchema);
module.exports = User;
