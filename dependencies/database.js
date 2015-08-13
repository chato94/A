/**
 * This file handles forked child process that involve user creation, deletion, verification, username change,
 * and password change from POST requests ending in .dbaccess
 * 
 * This child process is created and killed with every POST request that requires database access, so
 * it must handle potential data-racy conditions in an efficient way to be viable
 */
var qs = require ('querystring'), fs = require ('fs'), website, IP,
    args = process.argv, verbose = JSON.parse (args[2]), debug = JSON.parse (args[3]);

/**
 * All valid response labels:
 *     OK   - The command functioned as expected
 *     BAD  - The command failed because the username and/or password is bad, or requested hash/salt
 *     AE   - The account creation failed because the new username already exists
 *     ERR  - The server had an unexpected error
 *     CDNE - The command does not exist in the current configuration of database.js
 */
process.on ('message', function (m) {
    var specs = m[0].match (/[^.]+/g), q = qs.parse (m[1]), command = specs[1].toLowerCase ();
    website = clean (specs[0]);
    IP = m[2];

    $dvnt(IP + ') child database.js process received a message from parent!');

    // All responses are strings in JSON notation. Labels are "label" and queried content will be "content"
    process.send ((handlers[command] || function (usr, pass, arg2, arg3) {
        $nt(IP + ') The command given to this database.js instance does not match any implemented command');
        $dnt('command: ' + command, 'usr: ' + usr, 'pass: ' + pass, 'arg2: ' + arg2, 'arg3: ' + arg3);

        // Send the CDNE label because the command does not match any of the 8 pre-defined properties of handlers
        return '{"label": "CDNE"}';
    }) (clean (q.username) || clean (q.usr),
        q.password || q.pass,
        q.newpassword || q.npass || clean (q.newusername) || clean (q.newusr) || clean (q.nusr) || 
            (q.datakey && q.datakey.toLowerCase ()) || (q.dkey && q.dkey.toLowerCase ()) || q,
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
        var dir = [], fol = './dependencies/db/' + website, user = usr + '.user';
        $dvnt('createuser called!', 'usr: ' + usr, 'pass: ' + pass);
        try {
            dir = fs.readdirSync (fol);

            // Linear search for 
            for (var i = 0; i < dir.length; i++) {
                if (dir[i] === user) {
                    // Make sure that the name matched is actually a file and not a directory
                    try {
                        fs.readFileSync (fol + '/' + user);
                        return '{"label": "AE"}';

                    // Delete the directory and make the file, or return the ERR label upon unexpected error
                    } catch (err) {
                        if (err.code === 'EISDIR') {
                            fs.unlinkSync (fol + '/' + user);
                            return handlers['createuser'] (usr, pass);
                        } else {
                            $dnt('handlers[createuser] linear search::', 'err.code: ' + err.code);
                            $dvnt('error:\n' + error + '\n');
                            return '{"label": "ERR"}';
                        }
                    }
                }
            }

            // The for loop did not return, therefore create the user
            var slt = salt (), hash = sha256 (pass + slt), content = '{"hash": "' + hash + '", "salt": "' + slt + '"}',
                fd = open (fol + '/' + user, 'w'), buffer = new Buffer (content), BUFFER_POSITION = 0, FILE_POSTION = null;

            if (fd) {
                fs.writeSync (fd, buffer, BUFFER_POSITION, buffer.length, FILE_POSTION);
                fs.closeSync (fd);
                return '{"label": "OK"}';
            }

            return '{"label": "ERR"}';

        // The user does not exist in the website's directory in /dependencies/db, so create the account    
        } catch (error) {
            $nt(IP + ') There was an error in the try section of create user')
            $dnt('error.code: ' + error.code);
            switch (error.code) {
                // The website folder does not exist in the directory
                case 'ENOENT':
                    try {
                        $nt(IP + ') Creating the directory "' + fol + '" for the database');
                        fs.mkdirSync (fol);
                    } catch (err) {
                        $dnt('Error using fs.mkdirSync(' + fol + ')', 'err.code: ' + err.code, 'err:\n' + err + '\n');
                    }
                    return handlers['createuser'] (usr, pass);

                // There is a file where there should be a directory
                case 'ENOTDIR':
                    fs.unlinkSync (fol);
                    fs.mkdirSync (fol);
                    return handlers['createuser'] (usr, pass);

                default:
                    $dnt('unknown error (possibly using .writeSync): ' + error.stack, 'error.code: ' + error.code);
                    return '{"label": "ERR"}';
            }
        }
    },

    deleteuser: function (usr, pass) {
        var status = validate (usr, pass)[0];
        $dvnt('deleteuser called!');
        if (status === 'OK') {
            try {
                $nt(IP + ') Deleting user "' + usr + '" from the ' + website + ' database.');
                fs.unlinkSync ('./dependencies/db/' + website + '/' + usr + '.user');
                return '{"label": "OK"}';
            } catch (err) {
                $nt(IP +') There was an unknown error deleting the approved user');
                $dnt('handlers[deleteuser]::', 'usr: ' + usr, 'err.code: ' + err.code);
                $dvnt('err:\n' + err + '\n');
                return '{"label": "ERR"}';
            }
        } return '{"label": "' + status + '"}';
    },

    changename: function (usr, pass, nName) {
        var validation = validate (usr, pass), status = validation[0], content = validation[1];
        $dvnt('changename called!');
        if (status === 'OK') {
            try {
                $nt(IP + ') Re-naming user "' + usr + '" to "' + nName + '"');
                fs.renameSync ('./dependencies/db/' + website + '/' + usr + '.user', './dependencies/db/' + website + '/' + nName + '.user');
                return '{"label": "OK"}';
            } catch (err) {
                $nt(IP + ') There was an error (most likely a data race renaming a user file');
                $dnt('handlers.changename::', 'usr: ' + usr, 'nName: ' + nName, 'err.code: ' + err.code);
                $dvnt('error:\n' + err + '\n');
                return '{"label": "ERR"}';
            }
        } return '{"label": "' + status + '"}';
    },

    changepassword: function (usr, pass, nPass) {
        var validation = validate (usr, pass), status = validation[0], content = validation[1], fd;
        $dvnt('changepassword called!');
        if (status === 'OK') {
            try {
                fd = open ('./dependencies/db/' + website + '/' + usr + '.user', 'w');
                if (fd) {
                    var slt = salt (), hash = sha256 (nPass + slt);
                    content['hash'] = hash;
                    content['salt'] = slt;

                    var buffer = new Buffer (JSON.stringify (content)), BUFFER_POSITION = 0, FILE_POSTION = null;
                    fs.writeSync (fd, buffer, BUFFER_POSITION, buffer.length, FILE_POSTION)
                    fs.closeSync (fd);
                    return '{"label": "OK"}';
                }

                $nt(IP + ') There was an error using the file descriptor in changepassword');
                $dnt('usr: ' + usr, 'fd: ' + fd);
            } catch (err) {
                $nt(IP + ') There was an error using fs.writeSync in changepassword');
                $dnt('usr: ' + usr, 'err.code: ' + err.code);
                $dvnt('err:\n' + err + '\n');
            }

            // The fd was null, or there was an error using fs.writeSync
            return '{"label": "ERR"}';
        }

        // The status was not originally "OK", so return the status without content
        return '{"label": "' + status + '"}';
    },

    extractalldata: function (usr, pass) {
        var validation = validate (usr, pass), status = validation[0], content = validation[1];
        $dvnt('extractalldata called!');

        if (status === 'OK') {
            var extraction = {};
            for (var i in content) {
                if (content.hasOwnProperty (i) && i !== 'hash' && i !== 'salt') {
                    extraction[i] = content[i];
                }
            }

            return '{"label": "OK", "content": ' + JSON.stringify (extraction) + '}';
        }

        return '{"label": "' + status +'", "content": {}}';
    },

    extractdata: function (usr, pass, key) {
        $dvnt('extractdata called!');

        // Take advantage of extractalldata as it is the same function, but with one key
        var result = JSON.parse (handlers['extractalldata'] (usr, pass)), c = result['content'][key], status = result['label'];

        if (status === 'OK') return '{"label": "OK", "content": {"' + key + '": "' + (c? c : '') + '"}}';
        return '{"label": "' + status + '": "content": {}}';
    },

    storealldata: function (usr, pass, obj) {
        $dvnt('storealldata called!');
        var validation = validate (usr, pass), status = validation[0], content = validation[1], 
            fd, BUFFER_POSITION = 0, FILE_POSTION = null;
        if (status === 'OK') {
            try {
                $nt(IP + ') Storing/changing multiple data entries for user "' + usr + '"');
                for (var i in obj) {
                    var prop = i.toLowerCase ();
                    if (obj.hasOwnProperty (prop) && prop !== 'hash' && prop !== 'salt') {
                        content[prop] = obj[prop];
                    }
                }

                fd = open ('./dependencies/db/' + website + '/' + usr + '.user', 'w'), buffer = new Buffer (JSON.stringify (content));
                if (fd) {
                    fs.writeSync (fd, buffer, BUFFER_POSITION, buffer.length, FILE_POSTION);
                    fs.closeSync (fd);
                    return '{"label": "OK"}';
                }
            } catch (err) {
                $nt(IP + ') There was an error using open, fs.writeSync, or fs.closeSync');
                $dnt('usr: ' + usr, 'fd: ' + fd, 'err.code: ' + err.code);
                $dvnt('err: ' + err.stack + '\n');
            }

            // The password was verified, but there was an error using fs.open, write, or close
            return '{"label": "ERR"}';
        }

        // The integrity of the password did not pass the verificaiton stage
        return '{"label": "' + status + '"}';
    },

    storedata: function (usr, pass, key, val) {
        $dvnt('storedata called!');

        // Take advantage of storealldata as it does the same function, but with one key-val pair
        var map = {};
        map[key] = val;
        return handlers['storealldata'] (usr, pass, map);
    }
}

/* Validates a user and a password by reading the stored JSON buffer */
function validate (usr, pass) {
    var fol = './dependencies/db/' + website + '/' + usr + '.user', status = 'BAD', content = '';
    try {
        content = JSON.parse ('' + fs.readFileSync (fol));
        var hash = (content['hash'] || 'none'), salT = (content['salt'] || '');
        if (sha256 (pass + salT) === hash) status = 'OK';

    } catch (error) {
        $dnt('validate - fol: ' + fol);
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
                $dnt('validate - unknown error: ' + error.stack, 'unknown error\'s code: ' + error.code);
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
                $nt(IP + ') There was an error using the open function');
                $dnt('path: ' + path, 'mode: ' + mode, 'error.code: ' + err.code);
                $dvnt('err: ' + err.stack);
                break;

        } 

        $nt(IP + ') Returning a null from the open function');
        $dnt('path: ' + path, 'mode: ' + mode);
        return null;
    }
}

/* Generates a pseud-random ascii string 1000 characters long with ascii codes in [32, 126] */
function salt () {
    var s0 = '', n = 1250, UPPER_ASCII = 126 - 32, LOWER_ASCII = 32;

    for (var i = 0; i < n; i++) {
        var ascii = Math.floor (Math.random () * UPPER_ASCII) + LOWER_ASCII;

        // Avoid adding the double quote and the backslash for easier JSON writing
        if (ascii !== 34 && ascii !== 92) s0 += String.fromCharCode (ascii);
    }

    return s0;
}

/* Hashes the input string to its standard SHA-256 represenation */
function sha256 (string) {return require ('crypto').createHash ('sha256').update (string, 'utf8').digest ('hex');}

/* Only allow A-Z, a-z, 0-9, _, and - in storing user names */
function clean (fileName) {
    if (fileName) return fileName.replace (/[^A-Z0-9_\-]/gi, '');
    return fileName;
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
