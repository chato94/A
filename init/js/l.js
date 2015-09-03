/**
 * Taken from https://github.com/jfriend00/docReady/blob/master/docready.js
 *
 * Copies jQuery's 'ready' function without the entire library breathing down
 * the website's neck as the loading icon is working.
 */
(function (func, obj) {
    'use strict';
    func = func || 'domReady';
    obj = obj || window;
    var readyList = [], readyFired = false, installed = false;

    function ready () {
        if (!readyFired) {
            readyFired = true;
            for (var i = 0; i < readyList.length; i++) readyList[i].fn.call (window, readyList[i].ctx);
        }
        readyList = [];
    }

    function readyStateChange () {
        if (document.readyStat === 'complete') ready ();
    }

    obj[func] = function (callback, context) {
        if (readyFired) {
            setTimeout (function () {callback (context);}, 1);
            return;
        } else {
            readyList.push ({fn: callback, ctx: context});
        }

        if (document.readyState === 'complete' || (!document.attachEvent && document.readyState === 'interactive')) {
            setTimeout (ready, 1);
        } else if (!installed) {
            if (document.addEventListener) {
                document.addEventListener ('DOMContentLoaded', ready, false);
                window.addEventListener ('load', ready, false);
            } else {
                document.attachEvent ('onreadystatechange', readyStateChange);
                window.attachEvent ('onload', ready);
            }
            installed = true;
        }
    };
})('ready', window);

/**
 * Cross-browser solution to adding an event to an object.
 * Credit to Alex V at http://stackoverflow.com/questions/641857/javascript-window-resize-event
 *
 * Arguments:
 *     object - any non-null, non-undefined object: object that will have an event listener attached to it
 *     type   - 'event': name of the event to be listened for
 */
function addEvent (object, type, callback) {
    if (!object) return;
    
    if (object.addEventListener) {
        object.addEventListener (type, callback, false);
    } else if (object.attachEvent) {
        object.attachEvent ('on' + type, callback);
    } else {
        object['on' + type] = callback;
    }
}

/**
 * Borrowed from Michael Zaporozhets at
 * http://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
 *
 * Uses a comprehensive regular expression to match against the navigator of major mobile hardwares to calculate
 * whether the client is on a mobile device or not. However, this does not match for Apple iPads.
 */
function isMobile(){var i=!1;return function(a){(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))&&(i=!0)}(navigator.userAgent||navigator.vendor||window.opera),i}


/**
 * Creates a loading icon like the one at http://reddit.com/r/loadingicon/comments/293lqt/bored_at_work_so_look_what_i_made/
 *
 * Arguments:
 *     canvas - document.getElementById ('canvasid'): canvas to draw the animation on. Note that the context is cleared when drawing a frame of the loading icon
 *     opt - {opt0: val0, ...}: options for the properties of the loading icon
 *       Options for opt:
 *           radius     - [0, inf): specifies the radius of the outer circle of the loading icon
 *           pRWidth    - [0, 1]: specifies the percentage of the radius that will be dedicated to loadColor (thickness of outer donut)
 *           outerColor - 'rgb([0, 255], [0, 255], [0, 255])': marks the color of the loading circumference
 *           loadColor  - 'rgb([0, 255], [0, 255], [0, 255])': marks the color of the loading circumference when marking progress
 *           glowColor  - 'rgb([0, 255], [0, 255], [0, 255])': marks the color of the loading circumference when glowing
 *           glowFrames - [0, inf): specifies the number of frames to make each section glow when they hit the edge (completion is twice as long)
 *           numTravelingFrames - [0, inf): the number of frames to animate each section that travels to the circumference of the donut
 *           numRadiatingFrames - [0, inf): the number of frames to animate each section that radiates from the circumference after each section
 *           radianDisplacement - [0, TAU): radian value added to the starting point of the loading animation along the circumference (mod TAU)
 *           tFrames    - [0, inf): specifies the number of frames to animate the traveling sections
 *           pEmTravFrames - [0, 1]: the percent of tFrames that are spent emerging from the center circle
 */
function SimpleLoadingIcon (canvas, opt) {
    if (arguments.length === 1) opt = {};
    var TAU = 2 * Math.PI,
        can = canvas,
        ctx = canvas.getContext ('2d'),
        r0 = opt.radius || 0.35 * Math.min(can.width, can.height),
        r0x = opt.pRWidth || 1 - 0.125,
        oColor = opt.outerColor || 'rgb(220, 220, 220)',
        lColor = opt.loadColor || 'rgb(0, 153, 0)',
        gColor = opt.glowColor || 'rgb(128, 255, 0)',
        twF = 35,
        tw0 = new ColorTweener (lColor, gColor, twF),
        tw1 = new ColorTweener (gColor, lColor, twF),
        twC = tw0;
        rot = opt.radianDisplacement || -TAU / 4,
        rRP = opt.radiatingRadiusPercentage || 0.5,
        nRF = opt.numRadiatingFrames || 15,
        glowing = true;

    var pPrev = 0, pCurr = 0, pDone = 0;

    this.draw = function (x, y) {
        if (arguments.length === 1) y = can.height / 2;
        else if (arguments.length === 0) {x = can.width / 2; y = can.height / 2;}

        ctx.clearRect (0, 0, can.width, can.height);

        // Draw the containing donut shape
        draw (r0, r0 * r0x, oColor, 0, TAU, x, y);

        // Draw the radiating segment
        var s = rRP, n = nRF, rx = 1.155 * r0x;
        if (pDone === 100) {
            draw (r0 + r0 * s * (i / n), r0 * rx * (i / n * (1 / rx - 1) + 1) + r0 * s * (i / n), lColor, 0, TAU, x, y);
        }

        // Draw the current progress (add h to fix mod issue)
        var h = 0.0000003;
        draw (r0, r0 * r0x, twC.color (), mod (rot, TAU + h), mod (pToR (pDone) + rot, TAU + h), x, y);

        // Draw the center circle
        draw (r0 * (1 - r0x), 0, oColor, 0, TAU, x, y);

        // Draw the percent text in the center of the circle
        ctx.font = '' + Math.round(0.65 * r0 * (1 - r0x)) + 'px Open Sans';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = lColor;
        ctx.fillText (pCurr < 100? Math.floor(pCurr) + '%' : 'done', x, y);

        return this;
    };

    var i = 0, nRF = 25;
    this.tick = function (quantity) {
        if (arguments.length === 1) {
            pPrev = pCurr;
            pCurr += Math.abs(+quantity);
            if (pCurr > 100) pCurr = 100;
            pDone = pCurr;
        }

        if (pDone === 100) {
            twC.step ()
            if (twC.done ()) twC = tw1;
            i++;
            if (i > nRF) i = nRF;
        }

        return this;
    };

    this.done = function () {return i >= nRF && twC.done ();};

    // Updates r0 to resize the loading icon
    this.updateRadius = function (val) {
        if (!arguments.length) val = 0.35 * Math.min(can.width, can.height);
        r0 = val;

    }

    // Returns the percent value of the loading icon as avalue from 0 to 100
    this.percentage = function () {return pDone;};

    function draw (bigR, littleR, color, theta0, theta1, x, y) {
        ctx.fillStyle = color;
        ctx.beginPath ();
        ctx.arc (x, y, bigR, theta0, theta1, false);
        ctx.arc (x, y, littleR, theta1, theta0, true);
        ctx.fill ();
    }

    function pToR (percentage) {return TAU * percentage / 100;}

    function mod (x, y) {return x < 0? y - (-x % y) : x % y;}
}

/**
 * Tweening object to handle transitioning from one color to another in a specified number of steps. Uses
 * linear interpolation on the CIE-L*ab color space for an overall better fade while not introducing additional
 * hues.
 *
 * Arguments:
 *     rgb0   - 'rgb([0, 255], [0, 255], [0, 255])': starting color
 *     rgb1   - 'rgb([0, 255], [0, 255], [0, 255])': ending color
 *     nSteps - [0, inf): the number of steps to take fading from rgb0 to rgb1
 */
function ColorTweener (rgb0, rgb1, nSteps) {

    var cRGB = parse (rgb0), sLab = rgbToLab (cRGB), eLab = rgbToLab (parse (rgb1)), n = nSteps, i = 0;

    // Marks whether the color was completely faded through the first time
    this.done = function () {
        return i >= (n + 1);
    };

    // Returns whether the animation is at the starting point or not
    this.atStart = function () {
        return i <= 0;
    };

    // Fades the current RGB one step (over n steps) closer to the ending RGB
    this.step = function () {
        if (i < 0) i = 0;
        if (i++ <= n) cRGB = labToRGB (interpolate (rgbToLab (cRGB), eLab, i / n));

        return this;
    };

    this.undo = function () {
        if (i > n) i = n;
        if (i-- >= 0) cRGB = labToRGB (interpolate (rgbToLab (cRGB), sLab, i / n));

        return this;
    };

    // Same as toString ()
    this.color = function () {
        return this.toString ();
    };

    // Linearly interpolates two arrays of 3 values
    function interpolate (arr0, arr1, p) {
        var q = 1 - p;
        return [q * arr0[0] + p * arr1[0], q * arr0[1] + p * arr1[1], q * arr0[2] + p * arr1[2]];
    }

    // Wrapper function for the chain that's required to convert an RGB array to a CIE-L*ch array
    function rgbToLab (rgb) {
        return xyzToLab (rgbToXYZ (rgb));
    }

    // Wrapper function for the chan that's required to convert a CIE-L*ch array to an RGB array
    function labToRGB (lab) {
        return xyztoRGB (labToXYZ (lab));
    }

    // Converts an XYZ array to an RGB array
    function xyztoRGB (xyz) {
        var X = xyz[0] / 100, Y = xyz[1] / 100, Z = xyz[2] / 100;

        var R = X *  3.2406 + Y * -1.5372 + Z * -0.4986,
            G = X * -0.9689 + Y *  1.8758 + Z *  0.0415,
            B = X *  0.0557 + Y * -0.2040 + Z *  1.0570;

        R = R > 0.0031308? 1.055 * Math.pow(R, 1 / 2.4) - 0.055 : 12.92 * R,
        G = G > 0.0031308? 1.055 * Math.pow(G, 1 / 2.4) - 0.055 : 12.92 * G,
        B = B > 0.0031308? 1.055 * Math.pow(B, 1 / 2.4) - 0.055 : 12.92 * B;

        R *= 255;
        G *= 255;
        B *= 255;

        return [R, G, B];
    }

    // Converts an RGB array to an XYZ array
    function rgbToXYZ (rgb) {
        var R = rgb[0] / 255, G = rgb[1] / 255, B = rgb[2] / 255;

        R = R > 0.04045? Math.pow((R + 0.055) / 1.055, 2.4) : R / 12.92;
        G = G > 0.04045? Math.pow((G + 0.055) / 1.055, 2.4) : G / 12.92;
        B = B > 0.04045? Math.pow((B + 0.055) / 1.055, 2.4) : B / 12.92;

        R *= 100;
        G *= 100;
        B *= 100;

        var X = R * 0.4124 + G * 0.3576 + B * 0.1805,
            Y = R * 0.2126 + G * 0.7152 + B * 0.0722,
            Z = R * 0.0193 + G * 0.1192 + B * 0.9505;

        return [X, Y, Z];
    }

    // Converts a CIE-L*ab array to an XYZ array
    function labToXYZ (lab) {
        var Y = (lab[0] + 16) / 116, X = lab[1] / 500 + Y, Z = Y - lab[2] / 200;

        X = Math.pow(X, 3) > 0.008856? Math.pow(X, 3) : (X - (16 / 116)) / 7.787;
        Y = Math.pow(Y, 3) > 0.008856? Math.pow(Y, 3) : (Y - (16 / 116)) / 7.787;
        Z = Math.pow(Z, 3) > 0.008856? Math.pow(Z, 3) : (Z - (16 / 116)) / 7.787;

        X *= 95.047;
        Y *= 100;
        Z *= 108.883;

        return [X, Y, Z];
    }

    // Converts an XYZ array to a CIE-L*ab array
    function xyzToLab (xyz) {
        var X = xyz[0] / 95.047, Y = xyz[1] / 100, Z = xyz[2] / 108.883;

        X = X > 0.008856? Math.pow(X, 1 / 3) : (7.787 * X) + (16 / 116);
        Y = Y > 0.008856? Math.pow(Y, 1 / 3) : (7.787 * Y) + (16 / 116);
        Z = Z > 0.008856? Math.pow(Z, 1 / 3) : (7.787 * Z) + (16 / 116);

        var L = (116 * Y) - 16,
            a = 500 * (X - Y);
            b = 200 * (Y - Z);

        return [L, a, b];
    }

    // Returns an array of 3 numeric values from an 'rgb(val1, val2, val3)' string
    function parse (rgbStr) {
        var strs = rgbStr.match (/\d+/g);
        return [+strs[0], +strs[1], +strs[2]];
    }

    // Returns the 'rgb()' string of the current state of the tweener
    this.toString = function () {
        return 'rgb(' + Math.floor (cRGB[0]) + ', ' + Math.floor (cRGB[1]) + ', ' + Math.floor (cRGB[2]) + ')';
    };
}