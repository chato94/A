$(function () {
    var can = document.getElementById ('loading'), ctx = can.getContext ('2d');

    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    
    var frame = 0, c0 = 0.4, c1 = 11 / 13, r0 = Math.min (can.width, can.height) * c0, r1 = r0 * c1;

    $(window).resize (function () {
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
        r0 = Math.min (can.width, can.height) * c0;
        r1 = r0 * c1;
    });

    (function animate () {
        var deg = (function (x) {return -Math.PI * Math.cos (x / 50) + Math.PI;})(frame++);
        ctx.clearRect (0, 0, can.width, can.height);

        ctx.fillStyle = 'rbg(225, 225, 225)';
        ctx.beginPath ();
        ctx.arc (can.width / 2, can.height / 2, r0, 0, 2 * Math.PI, false);
        ctx.arc (can.width / 2, can.height / 2, r1, 2 * Math.PI, 0, true);
        ctx.fill ();

        ctx.fillStyle = 'green';
        ctx.beginPath ();
        ctx.arc (can.width / 2, can.height / 2, r0 - r1 * expF ((1 - Math.cos (deg)) / 2), mod (-Math.PI / 2, 2 * Math.PI), mod (deg - Math.PI / 2, 2 * Math.PI), false);
        ctx.arc (can.width / 2, can.height / 2, r1 - r1 * expF ((1 - Math.cos (deg)) / 2), mod (deg - Math.PI / 2, 2 * Math.PI), mod (-Math.PI / 2, 2 * Math.PI), true);
        ctx.fill ();

        ctx.beginPath ();
        ctx.fillStyle = 'rgb(225, 225, 225)';
        ctx.arc (can.width / 2, can.height / 2, r0 - r1, 0, 2 * Math.PI, false);
        ctx.fill ();
        requestAnimationFrame (animate);
    })();

    function expF (p) {var b = 5, c = 4; return (Math.pow(b, c * p - c) - Math.pow(b, -c)) / (1 - Math.pow(b, -c));}

    function mod (x, y) {return x < 0? y - (-x % y) : x % y;}
});

/**
 * Creates a loading icon like the one at http://reddit.com/r/loadingicon/comments/293lqt/bored_at_work_so_look_what_i_made/
 *
 * Arguments:
 *     canvas - document.getElementById ('canvasid'): canvas to draw the animation on. Note that the context is cleared when drawing a frame of the loading icon
 *     opt - {opt0: val0, ...}: options for the properties of the loading icon
 *       Options for opt:
 *           loadColor  - 'rgb([0, 255], [0, 255], [0, 255])': marks the color of the loading circumference when marking progress
 *           glowColor  - 'rgb([0, 255], [0, 255], [0, 255])': marks the color of the loading circumference when glowing
 *           glowFrames - [0, inf): specifies the number of frames to make each section glow when they hit the edge (completion is twice as long)
 *           outerColor - 'rgb([0, 255], [0, 255], [0, 255])': marks the color of the loading circumference
 *           radianDisplacement - [0, TAU): radian value added to the starting point of the loading animation along the circumference (mod TAU)
 *           radius     - [0, inf): specifies the radius of the outer circle of the loading icon
 *           tFrames    - [0, inf): specifies the number of frames to animate the traveling sections
 *           pEmTravFrames - [0, 1]: the percent of tFrames that are spent emerging from the center circle
 *           pRWidth    - [0, 1]: specifies the percentage of the radius that will be dedicated to loadColor (thickness of donut)
 */
function LoadingIcon (canvas, opt) {
    var N_FRAMES = opt.glowFrames || 24, TAU = 2 * Math.PI,

        lColor = opt.loadColor || 'rgb(0, 153, 0)',
        gColor = opt.glowColor || 'rgb(128, 255, 0)',
        oColor = opt.outerColor || 'rgb(200, 200, 200)',
        globalColorTweener = new ColorTweener (lColor, gColor, N_FRAMES),
        nTF = opt.tFrames || 20, // number of traveling frames
        pETF = opt.pEmTravFrames || 20, // percentage of frames used to emerge from the circle for traveling sections
        nRF = opt.numRadFrames || 20, // number of frames for radiating sections
        ctx = can.getContext ('2d'),
        can = canvas,
        r = opt.radius || 0.25 * Math.min (can.width, can.height),
        r1 = r * (opt.pRWidth || 0.0625);

    // sects is for animating individual sections to the circumference, and per store the previous and current percentage values
    var sects = [], pPrev = 0, pCurr = 0, pDone = 0, rot = opt.radianDisplacement || -TAU / 4;

    // Animates the loading icon to the next stage. Note that it clears the context first
    this.draw = function (x, y) {
        if (arguments.length === 1) y = can.height / 2;
        if (arguments.length === 0) {x = can.width / 2, y = can.height / 2;}

        // if (!this.done ()) {
        ctx.clearRect (0, 0, can.width, can.height);

        // Draw the outer fill/container ring
        draw (1, oColor, 0, TAU, x, y);

        // Draw the percent done (pDone) with loadColor (lColor)
        draw (1, globalColorTweener.color (), mod (0 + rot, TAU), mod (ptoR (pDone) + rot, TAU), x, y);

        // Draw the transitioning sections

        // Draw the center circle and the text with the percent status
    };

    // Returns whether the loading icon is at both 100% and finished animating
    this.done = function () {
        // Only need to check the last section as sections are synchronous
        return sects.length && sects[sects.length - 1].done () && pCurr === 100;
    };

    // Steps the loading icon one instance further in frame time
    this.tick = function (quantity) {
        // Add the absolute value of the quantity of percent, if any, to pCurr
        if (arguments.length === 1) {
            pPrev = pCurr;
            pCurr += Math.abs(+quantity);
            if (pCurr > 100) pCurr = 100;

            // Add the new transitioning segment based on the difference between pCurr and pPrev
            sects.push (new TravelingSection (pToR (pPrev), pToR (pCurr), nTF, new ColorTweener (lColor, gColor, N_FRAMES), pETF, nRF));
        }

        return this;
    };

    // Draws a section of a donut at per[cent] radius with the specified color from t0 to t1 radians centered at (x, y)
    function draw (per, color, t0, t1, x, y, pThick) {
        if (arguments.length === 6) pThick = 1; // percent thickness
        ctx.fillStyle = color;
        ctx.beginPath ();

        // Draws the largest radius first
        ctx.arc (x, y, per * r, t0, t1, false);

        // Then covers the circle formed by backtracking over the smaller radius
        ctx.arc (x, y, per * r1 + (1 - pThick) * (r - r1), t1, t0, true);

        // Fills in the newly formed path
        ctx.fill ();
    }

    // Returns x % y like in Python
    function mod (x, y) {return x < 0? y - (-x % y) : x % y;}

    // Converts a [0, 100] percentage to a radian value
    function ptoR (percentage) {return TAU * percentage / 100;}

    /**
     * Handles properties of traveling sections like speed, color, and duration
     *
     * Arguments:
     *     theta0, theta1  - [0, TAU): starting and ending radian values defining the boundaries of the section
     *     numFrames       - [0, inf): the number of frames that the section will be animating towards the edge
     *     tweener         - ColorTweener: the ColorTweener that will be used to "glow" when the section touches the edge
     *     percentEmerging - [0, 1]: the percentage of the frames that will be used to "emerge" from the center
     *     numRadFrames    - [0, inf): the number of frames that the radiating section will be animating
     */
    function TravelingSection (theta0, theta1, numFrames, tweener, percentEmerging, numRadFrames) {
        // Cache the incoming arguments as they will be necessary throughout the entire animation for drawing purposes
        var t0 = theta0, t1 = theta1, n = numFrames, tw = tweener, tweeningToGlow = true;
            keyFrame = Math.floor (percentEmerging * n), k = keyFrame / n, i = 0, p = 0;
            radiator = new RadiatingSection (numRadFrames)

        // Flag that marks if the section is done glowing (using the tweener)
        var finishedGlowing = false;

        // Used to determine if the section is done animating or not
        this.done = function () {return i >= (n + 1) && finishedGlowing;};

        // Draws the current state of this to the canvas
        this.draw = function (x, y) {
            draw (p, tw.color (), t0, t1, x, y);
            return this;
        };

        // Advances the section one step further
        this.step = function () {
            // Emerge from the center if i is less than keyFrame (frame calculated from percentEmerging) using jQuery cosine
            if (i++ < keyFrame) {
                p = c (normalizeEm (i / n)) * (keyFrame - 1) / n;
            }

            // Apply exponential transformation to p to cover the remaining ground with respect to i
            else {
                p = e (normalize (i / n)) * (1 - k) + (k);

                // Begin the glowing and radiating animation if done traveling
                if (i >= n) {
                    if (tweeningToGlow) {
                        tw.step ();
                        if (tw.done ()) tweeningToGlow = false;
                    } else {
                        tw.undo ();
                        if (tw.atStart ()) finishedGlowing = true;
                    }
                }
            }

            // Normalization from 0 to (keyFrame - 1) / n
            function normalizeEm (p) {return p / (keyFrame - 1) / n;}

            // Normalization from k to 1
            function normalize (p) {if (p > 1) p = 1; return (p - (k)) / (1 - k);}

            // Cosine transformation for emerging animation
            function c (p) {return (1 - Math.cos (Math.PI * p)) / 2;}

            // Exponential transformation for the sending animation (slow, then fast)
            function e (p) {var b = 5, j = 4; return (Math.pow(b, j * p - j) - Math.pow(b, -j)) / (1 - Math.pow(b, -j));}

            return this;
        };
    }

    /**
     * Handles the little radiating section that is given off when a traveling section hits the wall of the containing donut
     *
     * Arguments:
     *     theta0       - [0, TAU): starting radian of the radiating section
     *     theta1       - [0, TAU): ending radian of the radian section
     *     numRadFrames - [0, inf): the number of frames the section will radiate
     *     rPercentage  - [0, inf): the percentage of the radius (1 is 100%) that the section will radiate; 1 is added to the value provided
     *           pThick - [0, inf): the percentage of the thickness of the circumference to make the radiating section
     */
    function RadiatingSection (theta0, theta1, numRadFrames, rPercentage, pThick) {
        var t0 = theta0, t1 = theta1, n = numRadFrames, pT = pThick, rPer = rPercentage, i = 0;

        // Draws the radiating section to the canvas
        //
        // Arguments:
        //     x, y   - (-inf, inf): location of the center from which to radiate
        //     easing - function: function that defines the transition of a percentage from 0 to 1, inclusive
        this.draw = function (x, y, easing) {
            if (!easing) easing = function (percentThickness) {return percentThickness;};
            draw (1 + e (i / n) * rPer, lColor, t0, t1, x, y, easing (pT));
            return this;
        };

        // Steps the radiating animation one frame forward
        this.step = function () {
            i++;
            return this;
        };

        // Returns whether the section is finished radiating or not
        this.done = function () {
            return i >= n;
        };

        // Exp transformation for the radiating animation (fast, then slow)
        function e (p) {var b = 5, c = 4; return p >= 1? 1 : -(Math.pow(b, c * p - c) - Math.pow(b, -c)) / (1 - Math.pow(b, -c)) + 1}
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
}
