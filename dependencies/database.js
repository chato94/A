/**
 * This file handles forked child process that involve user creation, deletion, verification, username change,
 * and password change from POST requests ending in .dbaccess
 * 
 * This child process is created and killed with every POST request that requires database access, so
 * it must handle potential data-racy conditions in an efficient way to be viable
 */
var qs = require ('querystring'), fs = require ('fs'), website,
    args = process.argv, verbose = JSON.parse (args[2]), debug = JSON.parse (args[3]);

$dvnt('child database.js process started!');

/**
 * All valid response labels:
 *     OK   - The command functioned as expected
 *     BAD  - The command failed because the username and/or password is bad
 *     AE   - The account creation failed because the new username already exists
 *     ERR  - The server had an unexpected error
 *     CDNE - The command does not exist in the current configuration of database.js
 */
process.on ('message', function (m) {
    var specs = m[0].match (/[^.]+/g), q = qs.parse (m[1]), command = specs[1];
    website = specs[0];

    // All responses are strings in JSON notation. Labels are "label" and queried content will be "content"
    process.send ((handlers[command] || function (usr, pass, arg2, arg3) {
        $nt('The command given to this database.js instance does not match any implemented command');
        $dnt('command: ' + command, 'usr: ' + usr, 'pass: ' + pass, 'arg2: ' + arg2, 'arg3: ' + arg3);
        return '{"label": "CDNE", "content": ""}';
    }) (q.username || q.usr,
        q.password || q.pass,
        q.newpassword || q.npass || q.newusr || q.nusr || q.datakey || q.dkey ||
            (q.multidata && JSON.parse (q.multidata)) || (q.mdata && JSON.parse (q.mdata)),
        q.datakeyval || q.dkval));
});

/**
 * Handle all POST commands involving user database data access, creation, and deletion.
 *
 * Each returns a JSON-formatted string with the "label" for the end result, and the "content"
 * obtained from the input command.
 */
var handlers = {
    createuser: function (usr, pass) {
        // Make sure that the directory exists first
        var dir = [], fol = './db/' + website, user = usr + '.user';
        try {
            dir = fs.readdirSync (fol);

            // Linear search for 
            for (var i = 0; i < dir.length; i++) {
                if (dir[i] === user) {
                    // Make sure that the name matched is actually a file and not a directory
                    try {
                        fs.readFileSync (fol + '/' + user);
                        return '{"label": "AE", "content": ""}';

                    // Delete the directory and make the file, or return the ERR label upon unexpected error
                    } catch (err) {
                        if (err.code === 'EISDIR') {
                            fs.unlinkSync (fol + '/' + user);
                            return handlers['createuser'] (usr, pass);
                        } else {
                            $dnt('handlers[createuser] linear search::', 'err.code: ' + err.code);
                            $dvnt('error:\n' + error + '\n');
                            return '{"label": "ERR", "content": ""}';
                        }
                    }
                }
            }

            // The for loop did not return, therefore create the user
            var slt = salt (), hash = sha256 (pass + slt), content = '{hash: "' + hash + '", salt: "' + slt + '"}',
                fd = open (fol + user, 'w'), buffer = new Buffer (content), BUFFER_POSITION = 0, FILE_POSTION = null;

            if (fd) {
                fs.writeSync (fd, buffer, BUFFER_POSITION, buffer.length, FILE_POSTION);
                fs.closeSync (fd);
                return '{"label": "OK", "content": ""}';
            }

            return '{"label": "ERR", "content": ""}';

        // The user does not exist in the website's directory in /dependencies/db, so create the account    
        } catch (error) {
            switch (error.code) {
                // The website folder does not exist in the directory
                case 'ENOENT':
                    fs.mkdirSync (fol);
                    return handlers['createuser'] (usr, pass);

                // There is a file where there should be a directory
                case 'ENOTDIR':
                    fs.unlinkSync (fol);
                    fs.mkdirSync (fol);
                    return handlers['createuser'] (usr, pass);

                default:
                    $dnt('unknown error (possibly using .writeSync): ' + error, 'error.code: ' + error.code);
                    return '{"label": "ERR", "content": ""}';
            }
        }
    },

    deleteuser: function (usr, pass) {
        var status = validate (usr, pass)[0];
        if (status === 'OK') {
            try {
                $nt('Deleting user "' + usr + '" from the ' + website + ' database.');
                fs.unlinkSync ('./db/' + website + '/' + usr);
                return '{"label": "OK", "content": ""}';
            } catch (err) {
                $nt('There was an unknown error deleting the approved user');
                $dnt('handlers[deleteuser]::', 'usr: ' + usr, 'err.code: ' + err.code);
                $dvnt('err:\n' + err + '\n');
                return '{"label": "ERR", "content": ""}';
            }
        } return '{"label": "' + status + '", "content": ""}';
    },

    changename: function (usr, pass, nName) {
        var validation = validate (usr, pass), status = validation[0], content = validation[1];
        if (status === 'OK') {
            try {
                $nt('Re-naming user "' + usr + '" to "' + nName '"');
                fs.renameSync ('./db/' + website + '/' + usr, './db/' + website + '/' + nName + '.user');
                return '{"label": "OK", "content": ""}';
            } catch (err) {
                $nt('There was an error (most likely a data race renaming a user file');
                $dnt('handlers.changename::', 'usr: ' + usr, 'nName: ' + nName, 'err.code: ' + err.code);
                $dvnt('error:\n' + err + '\n');
                return '{"label": "ERR", "content": ""}';
            }
        } return '{"label": "' + status + '", "content": ""}';
    },

    changepassword: function (usr, pass, nPass) {
        var validation = validate (usr, pass), status = validation[0], content = validation[1];
        if (status === 'OK') {
            try {
                var fd = open ('./db/' + website + '/' + usr + '.user', 'w');
                if (fd) {
                    var slt = salt (), hash = sha256 (nPass + slt);
                    content['hash'] = hash;
                    content['salt'] = slt;

                    var buffer = new Buffer (JSON.stringify (content)), BUFFER_POSITION = 0, FILE_POSTION = null;
                    fs.writeSync (fd, buffer, BUFFER_POSITION, buffer.length, FILE_POSTION)
                    fs.closeSync (fd);
                    return '{"label": "OK", "content": ""}';
                }

                $nt('There was an error using the file descriptor in changepassword');
                $dnt('user: ' + usr, 'fd: ' + fd);
                return '{"label": "ERR", "content": ""}';
            } catch (err) {

            }
        } return '{"label": "' + status + '", "content": ""}';
    },

    extractalldata: function (usr, pass) {
        var validation = validate (usr, pass), status = validation[0], content = validation[1];
    },

    extractdata: function (usr, pass, key) {
        var validation = validate (usr, pass), status = validation[0], content = validation[1];
    },

    multistoredata: function (usr, pass, obj) {
        var validation = validate (usr, pass), status = validation[0], content = validation[1];
        if (status === 'OK') {
            try {
                $nt('Storing/changing multiple data entries for user "' + usr + '"');
                for (var i in obj) {

                }
            }
        } return '{"label": "' + status + '", "content": ""}';
    }

    storedata: function (usr, pass, key, val) {
        var validation = validate (usr, pass), status = validation[0], content = validation[1];
        if (status === 'OK') {
            try {
                $nt('Storing/changing data for usr "' + usr + '"');

            } catch (err) {

            }
        } return '{"label": "' + status + '", "content": ""}';
    }
}

/* Validates a user and a password by reading the stored JSON buffer */
function validate (usr, pass) {
    var fol = './db/' + website + '/' + usr + '.user', status = 'BAD', content = '';

    try {
        content = JSON.parse ('' + fs.readFileSync (fol));
        var hash = (content['hash'] || 'none'), salT = (content['salt'] || '');
        if (sha256 (pass + salT) === hash) status = 'OK';

    } catch (error) {
        switch (error.code) {
            case 'ENOENT':
                $dvnt('fol dne: ' + fol);
                status = 'DNE';
                break;

            case 'EISDIR':
                $dvnt('fol is dir: ' + fol);
                // There should not be directories in a folder inside a /db/[website] directory
                fs.unlinkSync (fol);
                status = 'DNE';
                break;

            default:
                $dnt('validate - unknown error:\n' + error, 'unknown error\'s code: ' + error.code);
                status = 'ERR';
                break;
        }
    }
    return [status, content];
}

/* Synchronously opens the file in the specified with the specified mode, and returns the file descriptor if successful */
function open (path, mode) {
    try {
        return fs.openSync (path, mode);
    } catch (err) {
        switch (mode) {
            case 'r': case 'r+':
                $dnt('path: ' + path, 'mode: ' + mode);
                $dvnt('The path does not exist, and the mode does not create the file.');
                break;

            case 'ax': case 'ax+': case 'wx': case 'wx+':
                $dnt('path: ' + path, 'mode: ' + mode);
                $dvnt('The path exists, and the mode only works when the file does not exist.');
                break;

            default:
                $dnt('path: ' + path, 'mode: ' + mode, 'error.code: ' + error.code);
                $dvnt('An unknown error occurred:\n' + err);
                break;

        } return null;
    }
}

/* Generates a pseud-random ascii string 1000 characters long with ascii codes in [32, 126] */
function salt () {
    var s0 = '', n = 1000, UPPER_ASCII = 126 - 32, LOWER_ASCII = 32;

    for (var i = 0; i < n; i++) {
        var ascii = Math.floor (Math.random () * UPPER_ASCII) + LOWER_ASCII;
        s0 += String.fromCharCode (ascii);
    }

    return s0;
}

/* Hashes the input string to its standard SHA-256 represenation */
function sha256 (string) {
    /* Necessary Constants */
    var K = ['01000010100010100010111110011000', '01110001001101110100010010010001', '10110101110000001111101111001111',
             '11101001101101011101101110100101', '00111001010101101100001001011011', '01011001111100010001000111110001',
             '10010010001111111000001010100100', '10101011000111000101111011010101', '11011000000001111010101010011000',
             '00010010100000110101101100000001', '00100100001100011000010110111110', '01010101000011000111110111000011',
             '01110010101111100101110101110100', '10000000110111101011000111111110', '10011011110111000000011010100111',
             '11000001100110111111000101110100', '11100100100110110110100111000001', '11101111101111100100011110000110',
             '00001111110000011001110111000110', '00100100000011001010000111001100', '00101101111010010010110001101111',
             '01001010011101001000010010101010', '01011100101100001010100111011100', '01110110111110011000100011011010',
             '10011000001111100101000101010010', '10101000001100011100011001101101', '10110000000000110010011111001000',
             '10111111010110010111111111000111', '11000110111000000000101111110011', '11010101101001111001000101000111',
             '00000110110010100110001101010001', '00010100001010010010100101100111', '00100111101101110000101010000101',
             '00101110000110110010000100111000', '01001101001011000110110111111100', '01010011001110000000110100010011',
             '01100101000010100111001101010100', '01110110011010100000101010111011', '10000001110000101100100100101110',
             '10010010011100100010110010000101', '10100010101111111110100010100001', '10101000000110100110011001001011',
             '11000010010010111000101101110000', '11000111011011000101000110100011', '11010001100100101110100000011001',
             '11010110100110010000011000100100', '11110100000011100011010110000101', '00010000011010101010000001110000',
             '00011001101001001100000100010110', '00011110001101110110110000001000', '00100111010010000111011101001100',
             '00110100101100001011110010110101', '00111001000111000000110010110011', '01001110110110001010101001001010',
             '01011011100111001100101001001111', '01101000001011100110111111110011', '01110100100011111000001011101110',
             '01111000101001010110001101101111', '10000100110010000111100000010100', '10001100110001110000001000001000',
             '10010000101111101111111111111010', '10100100010100000110110011101011', '10111110111110011010001111110111',
             '11000110011100010111100011110010'];

    var H = ['01101010000010011110011001100111', '10111011011001111010111010000101', '00111100011011101111001101110010',
             '10100101010011111111010100111010', '01010001000011100101001001111111', '10011011000001010110100010001100',
             '00011111100000111101100110101011', '01011011111000001100110100011001'];

    var ZERO = '00000000000000000000000000000000';

    /* String Initialization */
    var b = '', s = string;

    for (var i = 0; i < s.length; i++) {            
        b += s.charCodeAt (i).toString (16);
    }
    b = litHexToBin (b);

    /* Helper Functions */
    function Ch (X, Y, Z) {return XOR (AND (X, Y), AND (NOT (X), Z));}

    function Maj (X, Y, Z) {return XOR (XOR (AND (X, Y), AND (X, Z)), AND (Y, Z));}

    function SIG0 (X) {return XOR (XOR (RotR (X, 2), RotR (X, 13)), RotR (X, 22));}

    function SIG1 (X) {return XOR (XOR (RotR (X, 6), RotR (X, 11)), RotR (X, 25));}

    function Sig0 (X) {return XOR (XOR (RotR (X, 7), RotR (X, 18)), ShR (X, 3));}

    function Sig1 (X) {return XOR (XOR (RotR (X, 17), RotR (X, 19)), ShR (X, 10));}

    function NOT (s0) {
        var s_ = '';
        for (var i = 0; i < s0.length; i++) s_ += s0.charAt (i) === '1'? '0' : '1';
        return s_;
    }

    function AND (s0, s1) {
        var s_ = '', l0 = s0.length, l1 = s1.length, l = Math.min (l0, l1), m = l0 + l1 - l;
        for (var i = 0; i < l; i++) {
            s_ += s0.charAt (i) === '0' || s1.charAt (i) === '0'? '0' : '1';
        }
        if (m != l) {
            if (l == l0) {
                s_ += s1.substr (l);
            } else {
                s += s0.substr (l);
            }
        }
        return s_;
    }

    function XOR (s0, s1) {
        var s_ = '', l0 = s0.length, l1 = s1.length, l = Math.min (l0, l1), m = l0 + l1 - l;
        for (var i = 0; i < l; i++) {
            s_ += s0.charAt (i) === s1.charAt (i)? '0' : '1';
        }
        if (m != l) {
            if (l == l0) {
                s_ += s1.substr (l);
            } else {
                s += s0.substr (l);
            }
        }
        return s_;
    }

    function RotR (A, n) {
        if (A.length === 0) return '';
        var i = A.length - (n % A.length);
        return A.substr (i) + A.substr (0, i);
    }

    function ShR (A, n) {
        var i = A.length - n;
        if (i < 0) return times ('0', A.length);
        return times ('0', A.length - i) + A.substr (0, i);
    }

    function litHexToBin (str) {
        var s0 = '';
        for (var i = 0; i < str.length; i++) {
            s0 += mapChar (str.charAt (i));
        }
        return s0;
    }

    function mapChar (c) {
        switch (c.lower ()) {
            case '0': return '0000'; case '1': return '0001'; case '2': return '0010'; case '3': return '0011';
            case '4': return '0100'; case '5': return '0101'; case '6': return '0110'; case '7': return '0111';
            case '8': return '1000'; case '9': return '1001'; case 'a': return '1010'; case 'b': return '1011';
            case 'c': return '1100'; case 'd': return '1101'; case 'e': return '1110'; case 'f': return '1111';
        }
    }

    function toHexStr (nybbleArr) {
        var hxStr = [];
        for (var i = 0; i < nybbleArr.length; i++) {
            switch (nybbleArr[i]) {
                case '0000': hxStr.push ('0'); break; case '0001': hxStr.push ('1'); break; case '0010': hxStr.push ('2'); break;
                case '0011': hxStr.push ('3'); break; case '0100': hxStr.push ('4'); break; case '0101': hxStr.push ('5'); break;
                case '0110': hxStr.push ('6'); break; case '0111': hxStr.push ('7'); break; case '1000': hxStr.push ('8'); break;
                case '1001': hxStr.push ('9'); break; case '1010': hxStr.push ('a'); break; case '1011': hxStr.push ('b'); break;
                case '1100': hxStr.push ('c'); break; case '1101': hxStr.push ('d'); break; case '1110': hxStr.push ('e'); break;
                case '1111': hxStr.push ('f'); break;

                default: hxStr.push ('NaN'); break;
            }
        }
        return hxStr.join ('');
    }

    function to64BitStr (num) {
        if (num <= 0) return '0000000000000000000000000000000000000000000000000000000000000000';

        var s_ = '', i = Math.ceil (Math.log (num) / Math.log (2)) + 1, t_ = num;

        while (i--) {
            if (t_ >= Math.pow (2, i)) {
                s_ += '1';
                t_ -= Math.pow (2, i);
            } else s_ += '0';
        }

        return times ('0', 64 - s_.length) + s_;
    }

    // Returns the string strstr concatenated to itself x times
    function times (strstr, x) {
        var s_ = '';
        for (var i = 0; i < x; i++) s_ += strstr;
        return s_;
    }

    // 32-bit modulo adder
    function ModuloAdder (X) {
        var n0 = X? X : ZERO;

        // Sets the value stored in the adder to the specified 32-bit string
        this.setTo = function (toMe) {n0 = toMe; return this;};

        // Returns the answer from the cumulative add calls
        this.ans = function () {return n0;};

        // Adds two 32-bit binary strings and sets n0 as the answer (returns this for chainability)
        this.add = function (n1) {
            var s_ = '', carry = false;
            for (var i = 31; i >= 0; i--) {
                var lgc = bitLogic (n0.charAt (i), n1.charAt (i), carry), b0 = lgc[0], carry = lgc[1];
                s_ = b0 + s_;
            }
            n0 = s_;
            return this;
        }

        // Performs the behind-the-secnes addition of binary
        function bitLogic (bit0, bit1, carry) {
            var b0 = +bit0, b1 = +bit1, c = carry? 1 : 0, sum = b0 + b1 + c;
            return sum == 3? ['1', true] : sum == 2? ['0', true] : sum == 1? ['1', false] : ['0' , false];
        }
    }

    /* Padding */
    var len = b.length, k = 0;
    b += '1';

    while ((len + k + 1) % 512 !== 448) {
        b += '0';
        k++;
    }

    b += to64BitStr (len);

    /* Block Decomposition and Hash Computation */
    var M = b.match (/.{32}/g), _ = new ModuloAdder ();
    for (var x = 0; x < M.length; x += 64) {

        // Construct the blocks to specification
        for (var i = 16; i < 64; i++) {
            var j = x + i;
            M[j] = _.setTo (ZERO).add (Sig1 (M[j - 2])).add (M[j - 7]).add (Sig0 (M[j - 15])).add (M[j - 16]).ans ();
        }

        // Set the variables accordingly
        var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];

        // Do 64 rounds of variable updates to specification
        for (var j = 0; j < 64; j++) {
            var i = x + j;
            var T1 = _.setTo (ZERO).add (h).add (SIG1 (e)).add (Ch (e, f, g)).add (K[i]).add (M[i]).ans ();
            var T2 = _.setTo (ZERO).add (SIG0 (a)).add (Maj (a, b, c)).ans ();
            h = g;
            g = f;
            f = e;
            e = _.setTo (ZERO).add (d).add (T1).ans ();
            d = c;
            c = b;
            b = a;
            a = _.setTo (ZERO).add (T1).add (T2).ans ();
        }

        // Compute the new valies of H
        H[0] = _.setTo (ZERO).add (H[0]).add (a).ans ();
        H[1] = _.setTo (ZERO).add (H[1]).add (b).ans ();
        H[2] = _.setTo (ZERO).add (H[2]).add (c).ans ();
        H[3] = _.setTo (ZERO).add (H[3]).add (d).ans ();
        H[4] = _.setTo (ZERO).add (H[4]).add (e).ans ();
        H[5] = _.setTo (ZERO).add (H[5]).add (f).ans ();
        H[6] = _.setTo (ZERO).add (H[6]).add (g).ans ();
        H[7] = _.setTo (ZERO).add (H[7]).add (h).ans ();
    }

    return toHexStr (H.join ('').match (/.{4}/g));
}

/* console.log alias function */
function $ (m) {console.log (m);}

// Only prints if the verbose flag is true
function $nt () {if (verbose) {for (var i = 0, a = arguments; i < a.length; i++) i > 0? $('    ' + a[i]) : $('\n    ' + a[i]);}}

// Only prints if the debug flag is true
function $dnt () {if (debug) {for (var i = 0, a = arguments; i < a.length; i++) i > 0? $('    ' + a[i]) : $('\n    ' + a[i]);}}

// Only prints if both the verbose and debug flags are true
function $dvnt () {
    if (debug && verbose) {for (var i = 0, a = arguments; i < a.length; i++) i > 0? $('    ' + a[i]) : $('\n    ' + a[i]);}
}
