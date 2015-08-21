var can = document.getElementById ('loading'), ctx = can.getContext ('2d');

var frame = 0, r0 = Math.min (can.width, can.height) * 0.4, r1 = 11 * r0 / 13;

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
    ctx.arc (can.width / 2, can.height / 2, r0 - r1 * (1 - Math.cos (deg)) / 2, 0, deg, false);
    ctx.arc (can.width / 2, can.height / 2, r1 - r1 * (1 - Math.cos (deg)) / 2, deg, 0, true);
    ctx.fill ();

    ctx.beginPath ();
    ctx.fillStyle = 'rgb(225, 225, 225)';
    ctx.arc (can.width / 2, can.height / 2, r0 - r1, 0, 2 * Math.PI, false);
    ctx.fill ();
    requestAnimationFrame (animate);
})();

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
 *           startingRadian - [0, 2pi]: radian value of the location of the starting point of the loading animation along the circumference
 *           radius     - [0, inf): specifies the radius of the outer circle of the loading icon
 *           pRWidth    - [0, 1]: specifies the percentage of the radius that will be dedicated to loadColor (thickness of donut)
 */
function LoadingIcon (canvas, opt) {
    var N_FRAMES = opt.glowFrames || 24, TAU = 2 * Math.PI, ROT = opt.startingRadian || TAU / 4,

        lColor = opt.loadColor || 'rgb(0, 153, 0)', gColor = opt.glowColor || 'rgb(128, 255, 0)', oColor = opt.outerColor || 'rgb(200, 200, 200)',
        globalColorTweener = new ColorTweener (lColor, gColor, N_FRAMES),
        can = canvas, ctx = can.getContext ('2d'), r = opt.radius || 0.25 * Math.min (can.width, can.height), r1 = r * (opt.pRWidth || 0.0625);

    // sects is for animating individual sections to the circumference, and per store the previous and current percentage values
    var sects = [], pPrev = 0, pCurr = 0, rotTheta = 3 * Math.PI / 2;

    // Stores the global alpha value of the icon. The value should always be [0, 1], and is used to fade out the icon when done.
    this.alpha = 1;

    // Animates the loading icon to the next stage. Note that it clears the context first
    this.draw = function (x, y) {
        if (arguments.length === 1) y = can.height / 2;
        if (arguments.length === 0) {x = can.width / 2, y = can.height / 2;}

        // if (!this.done ()) {
        ctx.clearRect (0, 0, can.width, can.height);

        // Draw the outer fill/container ring
        draw (1, oColor, 0, TAU, x, y);

        // Draw the completed progress with loadColor
        draw (1, lColor, 0, TAU * pCurr / 100, x, y);

        // Draw the transitioning sections

        // Draw the center circle and the text with the percent status
    };

    this.done = function () {
        var allSectsDone = true;
        for (var i = 0; i < sects.length; i++) {
            if (!sects[i].done ()) {
                allSectsDone = false;
                break;
            }
        }
        return allSectsDone && pCurr === 100;
    };

    this.updatePercentage = function (quantity) {
        // Percentage loaded can only go forward
        per += Math.abs (+quantity);
        if (per > 100) per = 100;

        // Create a new transitioning section based on the difference between the new per value and the old per value
        sects.push ();
        return this;
    };

    // Draws a section of a donut at per[cent] radius with the specified color from t0 to t1 radians centered at (x, y)
    function draw (per, color, t0, t1, x, y) {
        ctx.fillStyle = color;
        ctx.beginPath ();

        // Draws the largest radius first
        ctx.arc (x, y, per * r, t0, t1, false);

        // Then covers the circle formed by backtracking over the smaller radius
        ctx.arc (x, y, per * r1, t1, t0, true);

        // Fills in the newly formed path
        ctx.fill ();
    }

    // Returns x % y like in Python
    function mod (x, y) {
        // Treat all +- values of x % y as |x| % |y|
        return Math.abs (x) % Math.abs (y);
    }

    // Returns the point (x, y) in an array [x', y'] rotated t radians about the point (h, k)
    function rot (x, y, t, h, k) {
        return [x * Math.cos (t) - y * Math.sin (t) + h, x * Math.sin (t) + y * Math.cos (t) + k];
    }

    /**
     * Handles properties of traveling sections like speed, color, and duration
     *
     * Arguments:
     *     theta0, theta1  - [0, TAU]: starting and ending radian values defining the boundaries of the section
     *     numFrames       - [0, inf): the number of frames that the section will be animating towards the edge
     *     tweener         - ColorTweener: the ColorTweener that will be used to "glow" when the section touches the edge
     *     percentEmerging - [0, 1]: the percentage of the frames that will be used to "emerge" from the center
     */
    function TravelingSection (theta0, theta1, numFrames, tweener, percentEmerging) {
        // Cache the incoming arguments as they will be necessary throughout the entire animation for drawing purposes
        var t0 = theta0, t1 = theta1, n = numFrames, tw = tweener,
            keyFrame = Math.floor (percentEmerging * n), k = keyFrame / n, i = 0, p = 0;

        // Flag that marks if the section is done glowing (using the tweener)
        var finishedGlowing = false;

        // Used to determine if the section is done animating or not
        this.done = function () {
            return i >= (n + 1) && finishedGlowing;
        };

        // Draws the current state of this to the canvas
        this.draw = function () {
            return this;
        };

        // Advances the section one step further
        this.step = function () {
            // Emerge from the center if i is less than keyFrame (frame calculated from percentEmerging)
            if (i++ < keyFrame) {
                p = c (normalizeEm (i / n)) * (keyFrame - 1) / n;
            }

            // Apply the jQuery cosine transformation function to per to cover the remaining ground with respect to i
            else {
                p = c (normalize (i / n)) * (1 - k) + (k);

                if (i === n) finishedGlowing = true;
            }

            // Normalization from 0 to (keyFrame - 1) / n
            function normalizeEm (p) {return p / (keyFrame - 1) / n;}

            // Normalization from k to 1
            function normalize (p) {if (p > 1) p = 1; return (p - (k)) / (1 - k);}

            return this;
        };

        // Cosine transformation for emerging animation
        function c (p) {
            return (1 - Math.cos (Math.PI * p)) / 2;
        }

        // Exp transformation for the sending animation
        function s (p) {
            var c = 5;
            return (Math.exp (c * p - c) - Math.exp (-c)) / (1 - Math.exp (-c));
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

        this.color = function () {
            return this.toString ();
        };

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

        function parse (rgbStr) {
            var strs = rgbStr.match (/\d+/g);
            return [+strs[0], +strs[1], +strs[2]];
        }

        this.toString = function () {
            return 'rgb(' + Math.floor (cRGB[0]) + ', ' + Math.floor (cRGB[1]) + ', ' + Math.floor (cRGB[2]) + ')';
        };
    }
}