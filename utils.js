/**
 * Contains Utility functions
 */
var UAParser = require('ua-parser-js');

var Utils = {
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
    },
    isMobile: function (ua) {
        var isMobile = false;
        if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(ua) 
            || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0,4))) isMobile = true;

            return isMobile;
    },
    isTablet: function (ua) {
        return Boolean(ua.match(/(iPad|SCH-I800|xoom|kindle)/i));
    },
    device: function (req) {
        var ua = req.headers['user-agent'],
            parser = new UAParser(ua),
            uaResult = parser.getResult(),
            browser = uaResult.browser.name,
            device = 'desktop';

        if (this.isTablet(ua)) {
            device = 'tablet';
        } else if (this.isMobile(ua)) {
            device = 'mobile';
        } else if (browser.match(/mobile/i)) {
            device = 'mobile';
        }
        return device;
    },
    getClientIP: function (req) {
        var last = false;
        var ip = req.headers['cf-connecting-ip'] || req.headers['x-real-ip'] || req.headers['x-forwarded-for'];
        if (!req.headers['cf-connecting-ip'] && req.headers['x-forwarded-for']) {
            last = true;
        }

        var arr = ip.split(",");
        arr = arr.map(function (el) {
            return el.trim();
        });

        if (last) {
            return arr.pop();            
        }

        return arr[0];
    }
};

module.exports = Utils;