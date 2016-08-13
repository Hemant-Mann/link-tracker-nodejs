/**
 * Contains Utility functions
 */
var utils = {
    copyObj: function (obj) {
        var o = {}, prop;

        for (prop in obj) {
            o[prop] = obj[prop];
        }
        return o;
    },
    dateQuery: function (obj) {
        if (!obj) obj = {};
        var start, end, tmp;

        start = new Date(); end = new Date();

        if (obj.start) {
            tmp = new Date(obj.start);

            if (tmp !== "Invalid Date") {
                start = tmp;
            }
        }
        start.setHours(0, 0, 0, 0);

        if (obj.end) {
            tmp = new Date(obj.end);

            if (tmp !== "Invalid Date") {
                end = tmp;
            }
        }
        end.setHours(23, 59, 59, 999);

        return {
            start: start,
            end: end
        };
    },
    today: function (d) {
        if (d) {
            var today = d;
        } else {
            var today = new Date();
        }
        var dd = today.getDate(),
            mm = today.getMonth() + 1, //January is 0!
            yyyy = today.getFullYear();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;
        today = yyyy + '-' + mm + '-' + dd;
        return today;
    },
    findCountry: function (req) {
        var country = "IN";

        return req.headers['cf-ipcountry'] || country;
    },
    setObj: function (obj, properties) {
        for (var prop in properties) {
            obj[prop] = properties[prop];
        }
        return obj;
    },
    inherit: function (parent, child) {
        var func = new Function('return function ' + child + ' () {}');
        var c = func();
        c.prototype = new parent;
        c.prototype.parent = parent.prototype;

        var obj = new c;
        obj.__class = c.name.toLowerCase();
        return obj;
    },
    ucfirst: function (s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
};

module.exports = utils;