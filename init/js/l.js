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
})('domReady', window);

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

var loadingIcon;
domReady (function () {
    var can = document.getElementById ('loading');
    can.width = window.innerWidth;
    can.height = window.innerHeight;

    loadingIcon = new SimpleLoadingIcon (can);
    (function load () {
        loadingIcon.tick (0.75).draw ();
        requestAnimationFrame (load);
    })();
});

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
function LoadingIcon (canvas, opt) {
    if (arguments.length === 1) opt = {};
    var TAU = 2 * Math.PI,
        can = canvas,
        ctx = can.getContext ('2d'),
        r0 = opt.radius || 0.25 * Math.min (can.width, can.height),
        r0x = opt.pRWidth || 1 - 0.125,
        oColor = opt.outerColor || 'rgb(200, 200, 200)',
        lColor = opt.loadColor || 'rgb(0, 153, 0)',
        gColor = opt.glowColor || 'rgb(128, 255, 0)',
        gFrames = opt.glowFrames || 24,
        pETF = opt.pEmTravFrames || 0.2,
        numTravFrames = opt.numTravelingFrames || 40,
        numRadFrames = opt.numRadiatingFrames || 30,
        rot = opt.radianDisplacement || -TAU / 4,

        // Variables used when all traveling sections have finished going to the edge
        globalColorTweener = new ColorTweener (lColor, gColor, gFrames * 2),

        globalRadiator = new RadiatingSection ({
            theta0: 0,
            theta1: TAU,
            numRadiatingFrames: opt.globalNumRadiatingFrames || 20,
            radiatingThicknessPercentage: opt.globalRadiatingThickness || 0.125,
            radiatingThicknessEasing: function (z) {return 1 - Math.sqrt(z * (2 - z));}
        });

    // Section holders and animation flags
    var sects = [], pPrev = 0, pCurr = 0, pDone = 0, finishedGlobalRadiation = false, globalAnimatingToGlow = true;

    /******************************
     * Public LoadingIcon methods *
     ******************************/
    // Returns whether this LoadingIcon is finished completely with its animation
    this.done = function () {return finishedGlobalRadiation;};
    
    // 
    this.tick = function (quantity) {
        // Add the absolute value of the quantity of percent, if any, to pCurr
        if (arguments.length === 1) {
            pPrev = pCurr;
            pCurr += Math.abs(+quantity);
            if (pCurr > 100) pCurr = 100;

            // Add a new transitioning segment based on the difference between pCurr and pPrev
            sects.push (new TravelingSection ({
                theta0: pToR (pPrev),
                theta1: pToR (pCurr),
                numFrames: numTravFrames,
                percentEmerging: pETF,
                numRadiatingFrames: numRadFrames
            }));
        }

        // Update each traveling section's animation, or mark it as false if it is done in order to be removed
        for (var i = 0; i < sects.length; i++) {
            if (sects[i] && sects[i].done ()) {
                pDone = sects[i].pValue ();
                sects[i] = false;
            } else if (sects[i]) sects[i].tick ();
        }

        // Remove all finished sections
        while (sects.length) {
            if (!sects[0]) sects.splice (0, 1);
            else break;
        }

        // Start ticking the final global animation if pDone is at 100
        if (pDone === 100) {
            if (globalAnimatingToGlow) globalColorTweener.step ();
            else globalColorTweener.undo ();

            globalRadiator.tick ();
            if (globalRadiator.done ()) finishedGlobalRadiation = true;
            if (globalColorTweener.done ()) globalAnimatingToGlow = false;
        }

        return this;
    };
    
    // Draws the current state of the loading icon to the canvas centered at the point (x, y)
    this.draw = function (x, y) {
        // Set the x and y variables if none are provided. WIll default to half of the canvas width/height, respectively
        if (arguments.length === 1) y = can.height / 2;
        else if (arguments.length === 0) {x = can.width / 2; y = can.height / 2;}

        // Clear the screen to prevent trailing
        ctx.clearRect (0, 0, can.width, can.height);

        // Draw the outer fill/container ring
        /*bigR, littleR, color, theta0, theta1, x, y*/
        //draw (1, oColor, 0, TAU, x, y);
        draw (r0, r0 * r0x, oColor, 0, TAU, x, y);

        // Draw the section on the outer fill/container ring that should just be one solid piece
        //draw (1, globalColorTweener.color (), mod (rot, TAU), mod (pToR (pDone) + rot, TAU), x, y);
        draw (r0, r0 * r0x, globalColorTweener.color (), mod (rot, TAU), mod (pToR (pDone) + rot, TAU), x, y);

        // Draw the traveling sections, if any
        if (sects.length) {
            for (var i = 0; i < sects.length; i++) {
                if (sects[i]) sects[i].draw (x, y);
            }
        }

        // Draw the global radiator if pDone is 100
        else if (pDone === 100) {
            globalRadiator.draw (x, y);
        }

        // Draw the center circle and the text wit hthe percent status
        //draw (0, oColor, 0, TAU, x, y);
        draw (r0 * (1 - r0x), 0, oColor, 0, TAU, x, y);

        // Draw the floored percentage at the center of the circle
        ctx.font = '' + Math.round(0.75 * r0 * (1 - r0x)) + 'px Tahoma';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fontStyle = globalColorTweener.color ();
        ctx.fillText (Math.floor(pCurr), x, y);

        return this;
    };

    /**************************************
     * Helper functions and child objects *
     **************************************/
    /**
     * Handles the properties of the section of the donut that animates toward the outer edge
     *
     * Arguments:
     *     opts - {opt0: val0, ...}: options for setting the internal properties of this TravelingSection
     *       theta0             - [0, TAU]: radian defining the starting boundary of the section
     *       theta1             - [0, TAU]: radian defining the ending boundary of the section
     *       numFrames          - [0, inf): the number of frames that this traveling section will be animating
     *       percentEmerging    - [0, 1]: the percentage of the frames that will be used to "emerge" from the center
     *       numRadiatingFrames - [0, inf): the number of frames that the radiating section will be animating
     */
    function TravelingSection (opts) {
        if (!arguments.length) opts = {};
        var t0 = opts.theta0 || 0,
            t1 = opts.theta1 || TAU,
            n = opts.numFrames || 60,
            kF = Math.floor((opts.percentEmerging || 0.2) * n),
            nRF = opts.numRadiatingFrames || 40,
            tw = opts.colorTweener || new ColorTweener (lColor, gColor, gFrames);
            tweeningToGlow = true,
            radiator = new RadiatingSection ({
                theta0: t0,
                theta1: t1,
                numRadiatingFrames: nRF,
                radiatingThicknessEasing: function (z) {return 1 - Math.sqrt(z * (2 - z));}
            }),

            k = kF / n, // variable caching
            i = 0,      // index holder
            p = 0;      // percentage of radius after cosine/exponential transformation

        // Returns whether this section is fully finished animating on the canvas or not
        this.done = function () {return radiator.done ()};

        // Advances this TravelingSection one unit forward in animation time
        this.tick = function () {
            // Emerge from the center if i is less than kF (key frame)
            if (i++ < kF) p = c (normalizeEm (i / n)) * (kF - 1) / n;

            // Apply exponential transformation to p to cover the remaining precentage left to travel
            else {
                p = e (normalize (i / n));

                // Begin the glowing and radiating animation if done traveling
                if (i >= n) {
                    if (tweeningToGlow) {
                        tw.step ();
                        if (tw.done ()) tweeningToGlow = false;
                    } else tw.undo ();

                    // Tick the radiating edge because the section is done traveling
                    radiator.tick ();
                }
            }

            // Normalization of percentage values that fall in [0, (kF - 1) / n]
            function normalizeEm (z) {console.log ('emP: ' + (z / (kF - 1))); return z / (kF - 1);}

            // Normalization of percentage values that fall in [k, 1]
            function normalize (z) {console.log ('p: ' + ((z - k) / (1 - k))); if (z > 1) z = 1; return (z - k) / (1 - k);}
        
            // Normalize z between the domain [a, b]
            function norm (z, a) {return (z - a) / (b - a)}
        };

        // Draws the current state of this TravelingSection to the canvas centered at the point (x, y)
        this.draw = function (x, y) {
            //draw (p, tw.color (), t0, t1, x, y);
            var rSmall = (r0 * r0x) - (r0 * (1 - p));
            if (rSmall < 0) rSmall = 0;
            draw (p * r0, rSmall, tw.color (), t0, t1, x, y);
            if (i >= n) radiator.draw (x, y);
            return this;
        };

        // Returns the values that will be assigned to pDone
        this.pValue = function () {return t1 / TAU * 100;};
    }

    /**
     * Handles the little radiating section that is given off when a traveling section hits the wall of the containing donut
     *
     * Arguments:
     *     opts - {opts0: val0, ...}: options for setting the internal properties of this RadiatingSection
     *       theta0                       - [0, TAU]: starting bound of the radiating section
     *       theta1                       - [0, TAU]: ending bound of the radiating section
     *       numRadiatingFrames           - [0, inf): the number of frames to animate the radiation
     *       radialPercentage             - [0, inf): how far to extend the radiating section as a percentage of the radius
     *       radiatingThicknessPercentage - [0, 1 / (1 - r0x)]: percentage of thickness of the loading icon outer wall to make the radiating section
     *       radiatingThicknessEasing     - function with domain [0, 1]: easing for thickness across different ticks of animation time
     */
    function RadiatingSection (opts) {
        var t0 = opts.theta0 || 0,
            t1 = opts.theta1 || TAU,
            n = opts.numRadiatingFrames || 20,
            extP = opts.radialPercentage || 1.125,
            th = opts.radiatingThicknessPercentage || 0.125,
            eFunc = opts.radiatingThicknessEasing || function (z) {return z;},
            i = 0
            p = 0
            pT = th;

        // Returns whether the section is finished radiating or not
        this.done = function () {return i >= n;};

        // Ticks the current state of the radiating section forward one unit in animation time
        this.tick = function () {p = 1 + d (i++ / n) * extP; pT = eFunc ((i - 1) / n) * th; return this;};

        // Draws the radiating section to the canvas
        this.draw = function (x, y) {draw (p, lColor, t0, t1, x, y, pT); return this;};
    }

    this.sections = function () {return sects;};

    // Returns x mod y like in Python
    function mod (x, y) {return x < 0? y - (-x % y) : x % y;}

    /* Percentage transformation functions for a more professional feel */
    // Cosine transformation for the emerging animation
    function c (z) {return (1 - Math.cos(Math.PI * z)) / 2;}

    // Exponential growth transformation for the traveling animation
    function e (z) {var b = 5, j = 4; return (Math.pow(b, j * z - j) - Math.pow(b, -j)) / (1 - Math.pow(b, -j));}

    // Exponential decay transformation for the radiating animation
    function d (z) {return p > 1? 1 : -e (z) + 1;}

    // Converts a [0, 100] percentage to its percent TAU radian value
    function pToR (percentage) {return TAU * percentage / 100;}

    // Draws a donut section from the starting radian to the ending radian to specifiaction
    /*function draw (percentRadius, color, theta0, theta1, x, y, percentThickness) {
        if (arguments.length === 6) percentThickness = 1;
        function ad (pr) {return pr > 1 / (1 - pr)? 1 / (1 - pr) : pr < 0? 0 : pr;}
        var R = percentRadius * r0, r1 = R * (1 - ad (percentThickness) * (1 - r0x));

        ctx.fillStyle = color;
        ctx.beginPath ();

        // Draws the longest arc with percentRadius * r0 radius length
        ctx.arc (x, y, R, theta0, theta1, false);

        // Draws the smaller closing arc at the thickness percentage specified
        ctx.arc (x, y, r1, theta1, theta0, true);

        // Fills in the newly formed path
        ctx.fill ();
    }*/

    function draw (bigR, littleR, color, theta0, theta1, x, y) {
        ctx.fillStyle = color;
        ctx.beginPath ();

        // Draws the longest arc first
        ctx.arc (x, y, bigR, theta0, theta1, false);

        // Draws the smaller arc second
        ctx.arc (x, y, littleR, theta1, theta0, true);

        // Fills in the newly formed path
        ctx.fill ();
    }
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

    var sRGB = parse (rgb0), cRGB = sRGB, eLab = rgbToLab (parse (rgb1)), n = nSteps, i = 1;

    // Marks whether the color was completely faded through the first time
    this.done = function () {
        return i === (n + 1);
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
        if (--i >= 0) cRGB = labToRGB (interpolate (rgbToLab (cRGB), eLab, i / n));

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

function SimpleLoadingIcon (canvas, opt) {
    if (arguments.length === 1) opt = {};
    var TAU = 2 * Math.PI,
        can = canvas,
        ctx = canvas.getContext ('2d'),
        r0 = opt.radius || 0.35 * Math.min(can.width, can.height),
        r0x = opt.pRWidth || 1 - 0.125,
        oColor = opt.outerColor || 'rgb(200, 200, 200)',
        lColor = opt.loadColor || 'rgb(0, 153, 0)',
        gColor = opt.glowColor || 'rgb(128, 255, 0)',
        rot = opt.radianDisplacement || -TAU / 4;

    var pPrev = 0, pCurr = 0, pDone = 0;

    this.draw = function (x, y) {
        if (arguments.length === 1) y = can.height / 2;
        else if (arguments.length === 0) {x = can.width / 2; y = can.height / 2;}

        ctx.clearRect (0, 0, can.width, can.height);

        draw (r0, r0 * r0x, oColor, 0, TAU, x, y);

        draw (r0, r0 * r0x, lColor, mod (rot, TAU), mod (pToR (pDone) + rot, TAU), x, y);

        draw (r0 * (1 - r0x), 0, oColor, 0, TAU, x, y);

        ctx.font = '' + Math.round(0.75 * r0 * (1 - r0x)) + 'px Tahoma';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = lColor;
        ctx.fillText (Math.floor(pCurr), x, y);

        return this;
    };

    this.tick = function (quantity) {
        if (arguments.length === 1) {
            pPrev = pCurr;
            pCurr += Math.abs(+quantity);
            if (pCurr > 100) pCurr = 100;
            pDone = pCurr;
        }

        return this;
    };

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

