/*********************************************************************************************
 * THE FOLLOWING ARE REQUIRED Node.js LIBRARIES AND GLOBAL VARIABLES FOR STATIC FILE SERVING *
 *********************************************************************************************/
var http = require ('http'), fs = require ('fs'), path = require ('path'), cp = require ('child_process'),
    Int = require ('os').networkInterfaces (), CL_IP = 'x-forwarded-for', S_IP = localIPAddress (),
    PORT = 80, BACKLOG = 511, L = '127.0.0.1', Z = '0.0.0.0', verbose = false, debug = false, server;

/* Fork all necessary child processes */
var dirWatcher = cp.fork (__dirname + '/dirwatch.js'), dataBases = {}, dbID = 0;

/* All available files and directories relative to this file */
var root = {}, d = new DirSpace (), receivedInit = false;

/* Client Page Map --> Keeps track of the page that users are on when the request URL does not directly match a root path */
var cPM = {};

/* Wait until first update of directories to start serving files */
var int = setInterval (function () {if (receivedInit) server = http.createServer (fHTTP).listen (PORT, S_IP, BACKLOG, iS);}, 300);

/* Server initialization function */
function iS () {
    $('** The server is up and running! Listening to requests at ' + S_IP + ' on port ' + PORT + ' **\n');
    clearInterval (int);
    int = null;
}

/* Gets the IPv4 address of the machine running the server */
function localIPAddress () {
    var a, i, p, j;
    for (p in Int) {
        i = Int[p];
        for (j = 0; j < i.length; j++) if (a = i[j], a.family === 'IPv4' && a.address !== L && !a.internal) {return a.address;}
    } return Z;
}

/* Sets the logging flags to specify how much to log to the console from the command line arguments */
var dMssg = 0, aMssg = '\nAll Valid Arguments: -v[erbose], -d[ebug]', uA = '    Unknown Argument', args = process.argv;
for (var i = 2; i < args.length; i++) {
    if (args[i].match (/-?v(erbose)?$/i)) verbose = true;
    else if (args[i].match (/-?d(ebug)?$/i)) debug = true;
    else dMssg? $(uA + (i+1) + ': "' + args[i] + '"'):(function(){$(aMssg); dMssg = 1; $(uA + (i+1) + ': "' + args[i] + '"');})();
}

if (debug) $('Additional command line arguments: ' + (process.argv.length - 2));

/***********************************************************************************************************************
 * THE FOLLOWING FUNCTIONS ARE THE TREE-LIKE FLOW OF CALLBACKS THAT STEM FROM CLIENT REQUESTS FOR THE SERVER TO HANDLE *
 ***********************************************************************************************************************/
/* Function from which all other callbacks execute */
function fHTTP (rq, rs) {
    var IP = rq.headers[CL_IP] || rq.connection.remoteAddress || rq.socket.remoteAddress || rq.connection.socket.remoteAddress;
    $n('\n*** ' + fN (fHTTP) + 'Incoming request heard! Initializing response for ' + IP + ' ***');
    rq.method === 'GET'? rq.url === '/static.directory'? dirCont (rq, rs, IP) : GETHandler (rq, rs, IP) : POSTHandler (rq, rs, IP);
}

/* Root function of the POST request handling function tree */
function POSTHandler (request, response, IP) {
    // http://stackoverflow.com/questions/4295782/how-do-you-extract-post-data-in-node-js
    var url = decodeURL (request.url).replace (/^\//, ''), body = '', FIVE_MB = 5242880;

    // Parses the incoming data to the body variable
    request.on ('data', function (data) {
        body += data;
        if (body.length > FIVE_MB) request.connection.destroy ();
    });

    // Processes the parsed body query string
    request.on ('end', function () {
        $nt(IP + ') POST request body finished parsing');
        $dnt(IP + ') url: ' + url, IP + ') body: ' + body);
        if (url.match (/\.dbaccess$/)) {
            var thisID = dbID++;

            $dnt ('thisID: ' + thisID);
            dataBases[thisID] = cp.fork (__dirname + '/dependencies/database.js', ['' + verbose, '' + debug]);
            dataBases[thisID].send ([url, body, IP]);

            dataBases[thisID].on ('message', function (m) {
                respondTo (url, response, IP, m, 200, 'application/json');
                dataBases[thisID].kill ();
                dataBases[thisID] = null;
            });
        } else {
            $nt(IP + ') POST request was heard, but was of an unknown type');
            var html = uPOSTPage.replace (/#/, body);
            respondTo (url, response, IP, html, 404, 'text/html');
        }
    });
}

/* Responds with a JSON of the folders found in the /static directory. Useful for the homepage, but any page can make use of it */
function dirCont (request, rs, IP) {
    var url = request.url, ip = IP + ') ' + fN (dirCont), jn = 'application/json', s0 = '{"static":', s1 = '}';
    $nt(ip + 'Detected a directory read for /static!');
    $dnt(ip + 'url: ' + url);
    fs.readdir ('./static', function (e, dir) {
        e? respondTo (url, rs, IP, s0 + '"ERR"' + s1, 500, jn) : respondTo (url, rs, IP, s0 + JSON.stringify (dir) + s1, 200, jn);
    });
}

/* Root function of the GET request handling function tree */
function GETHandler (request, response, IP) {
    var ip = IP + ') ' + fN (GETHandler), wrap = d.match (request.url, IP), url = '.' + wrap[0], code = wrap[1];
    $nt(ip + 'Detected a GET request!', ip+'Raw URL: ' + request.url, ip + 'Filtered URL: ' + url);
    read (url, response, IP, code);
}

/* Handles any calls to the fs library to read a file in the specified path */
function read (url, response, IP, code) {
    var ip = IP + ') ' + fN (read);
    $dnt(ip + 'Attempting to read the file in: ' + url);
    fs.readFile (url, function (error, content) {
        error? send500 (url, response, IP, error) : respondTo (url, response, IP, content, code, MIMEType (path.basename (url)));
    });
}

/* Handles any calls that were guaranteed to work in theory, but somehow failed */
function send500 (url, response, IP, error) {
    var ip = IP + ') ' + fN (send500);
    $nt(ip + 'An error occurred while serving: ' + url);
    respondTo (url, response, IP, _500Page, 500, 'text/html');
}

/* Handles responding to a request with the input arguments */
function respondTo (url, response, IP, content, code, mime) {
    var ip = IP + ') ' + fN (respondTo);
    $nt(ip + 'Finalizing the response for: ' + url, ip + 'Status Code: ' + code);
    response.writeHead (code, {'Content-Type': mime});
    response.write (content, function () {$n('*** Finished the response for ' + IP + ' ***'); response.end ();});
}

/***************************************************************************************************
 * THE FOLLOWING FUNCTIONS ARE FUNCTIONS THAT HANDLE CHILD PROCESSES AND CLEAN PROCESS TERMINATION *
 ***************************************************************************************************/
// Handles all changes made to the static, init, and 404 directories
dirWatcher.on ('message', function (m) {
    if (m[0] === 'Update Mapping') {
        if (!receivedInit) receivedInit = true;
        root = m[1];
        d.update ();
    }
});

/* Kill all child processes on exit */
process.on ('SIGINT', killChildrenAndExit);

function killChildrenAndExit () {
    dirWatcher.kill ();

    for (var i = 0; i < dbID; i++) {
        if (dataBases[i]) dataBases[i].kill ();
    }

    $n('CLEANLY TERMINATED ALL COMMANDS AND NOW EXITING THE SERVER PROGRAM.');
    process.exit ();
}


/************************************************************************************************
 * THE FOLLOWING FUNCTIONS ARE HELPER FUNCTIONS AND ALIASES FOR REPEATED FUNCTIONS LIKE LOGGING *
 ************************************************************************************************/
/* Handles bad URL error filtering for the 404 page by keeping track of the valid directories */
function DirSpace () {

    // Simple binary search over an array to find the index of its location, or false if it's not in the array
    function bS (a, o) {

        // Binary search worker function
        function s (a, me, i, j) {
            if (!a || !a.length || i > j) return false;
            var m = Math.floor ((i + j) / 2), t = true, f = false;
            return i === j? a[i] === o? i : f : a[m] === o? m : a[m] > o? s(a, o, i, m - 1) : s(a, o, m + 1, j);
        }

        return s(a, o, 0, a.length - 1);
    }

    // Maps the master page of the incoming IP address if the URL is an HTML file
    function map (url, IP, code) {
        var ip = IP + ') (anon) DirSpace.map-> ';
        if (path.basename (url).match (/\.html$/)) {
            $dnt(ip + 'url: ' + url, ip + 'code: ' + code);
            $dvnt(ip + 'Re-mapping the url "' + cPM[IP] + '" to "' + path.dirname (url) + '"');
            cPM[IP] = path.dirname (url);
        }
        $dvnt(ip + '');
        return [url, code];
    }

    // Merges the input URL with the master map if it exists; returns the input URL as-is otherwise
    function mrg (url, IP) {
        $dvnt(IP + ') (anon) DirSpace.mrg->' + url, IP + ') (anon) DirSpace.mrg->' + IP);
        return cPM[IP]? url.match (/^\/static/)? cPM[IP] + url.substr (7) : cPM[IP] + url : url;
    }

    // Filters the input URL such that only the dependency remains if possible, false otherwise
    function errorMatch (rURL, IP) {
        var deps = root['/404'] || [], segs = rURL.match (/\/[^/]+/g), dStr = IP + ') (anon) DirSpace.errorMatch ';

        $dnt(dStr + 'deps: ' + deps, dStr + 'segs: ' + segs);

        while (segs.length > 1) {
            segs.splice (0, 1);
            var url = '/404' + segs.join (''), i;
            if ((i = bS (deps, url)) !== false) return map (deps[i], IP, 200);
        }

        $dvnt(IP + ') no match for rURL "' + rURL + '" in /404');

        return false;
    }

    // Attempts to match the raw URL directly from the request with a directory found in 
    this.match = function (rURL, IP) {
        var def = ['/404', '/index.html'], rx = /\/[^/]+/g;

        var url = sDecodeURL (rURL), aURL = mrg (url, IP), 
            sgs0 = url.match (rx) || def, sgs1 = aURL.match (rx) || def,
            top0 = sgs0[0], top1 = sgs1[0], dps0 = root[top0] || [], dps1 = root[top1] || [], idxStr = url + def[1], i;

        $dvnt(IP + ') - d.match');
        $dnt('rURL: '+rURL,'url: '+url,'aURL: '+aURL,'idxStr: '+idxStr,'sgs0: '+sgs0,'sgs1: '+sgs1,'dps0 ->'+dps0,'dps1 ->'+dps1);
        $dnt('1: '+bS (dps0, url), '2: '+bS (dps1, aURL), '3: '+bS (dps0, idxStr), '4: '+dps0.length, '5: '+errorMatch (url, IP));

        // The user agent requested a perfect path to the file
        if ((i = bS (dps0, url)) !== false) return map (dps0[i], IP, 200);

        // The user agent's page requested a dependency
        else if ((i = bS (dps1, aURL)) !== false) return [dps1[i], 200];

        // The user agent lazily typed the request, and it matches a valid path to an index.html file
        else if ((i = bS (dps0, idxStr)) !== false) return map (dps0[i], IP, 200);

        // The user agent lazily typed the request, and it might match a valid path to an html file
        else if (dps0.length) {for (i = 0; i < dps0.length; i++) if (dps0[i].match (/\\.html$/)) return map (dps0[i], IP, 200);}

        // The user agent might have requested a completely non-existent URL, but the error page is requesting dependencies,
        // or the user agent requested a path that does not exist in the current state of the directory
        return errorMatch (url, IP) || map ('/404/index.html', IP, 404);
    };

    // Used to update the internal array of all /404 directories, and to log that child process has updated root
    this.update = function () {$nt(' #################################### UPDATED ROOT ####################################\n');};
}

/* console.log alias functions */
function $ (m) {console.log (m);}
function $n () {for (var i = 0, a = arguments; i < a.length; i++) $('\n' + a[i]);}
function $t () {for (var i = 0, a = arguments; i < a.length; i++) $('    ' + a[i]);}

// Only prints if the verbose flag is true
function $nt () {if (verbose) {for (var i = 0, a = arguments; i < a.length; i++) i > 0? $('    ' + a[i]) : $('\n    ' + a[i]);}}

// Only prints if the debug flag is true
function $dnt () {if (debug) {for (var i = 0, a = arguments; i < a.length; i++) i > 0? $('    ' + a[i]) : $('\n    ' + a[i]);}}

// Only prints if both the verbose and debug flags are true
function $dvnt () {
    if (debug && verbose) {for (var i = 0, a = arguments; i < a.length; i++) i > 0? $('    ' + a[i]) : $('\n    ' + a[i]);}
}

/* Returns the function name to concatenate to logging based on the debug variable */
function fN (f) {
    return debug? (f.toString ().replace (/^function\s/, '').match (/^[^(]+\(/) || ['('])[0].replace (/\s*?\($/, '') + ' - ' : '';
}

/* Utilizes the comprehensive extension map to return the appropriate MIME type of a file */
function MIMEType (file) {
    var ext = /\..+$/, extension = file.match (ext)? file.match (ext)[0] : 'dne';
    return extensionMap[extension] || 'text/plain';
}

/* Quietly attaches the "/static" directory to non-"/404" and non-"/init" queries and returns the string literal of request.url */
function sDecodeURL (url) {
    var i = '/index.html';    
    return decodeURL (url === '/' || url === i? '/init' + i : url.match (/^\/404|^\/init/)? url : '/static' + url);
}

/* Returns the string literal of the encoded request.url */
function decodeURL (url) {
    var u = url.replace (SPACE, ' ');

    // Convert URL encodings to their literal string representations and return the value
    return u.replace (LT, '<')  .replace (EQ, '=')   .replace (OBRKT, '[')  .replace (HTAG, '#')   .replace (PSNT, '%')
            .replace (GT, '>')  .replace (AND, '&')  .replace (PLUS, '+')   .replace (OBRCE, '{')  .replace (CBRCE, '}')
            .replace (AT, '@')  .replace (MNY, '$')  .replace (PIPE, '|')   .replace (FSLSH, '/')  .replace (CRRT, '^')
            .replace (QM, '?')  .replace (DQT, '"')  .replace (SQT, "'")    .replace (SCLN, ';')   .replace (BSLSH, '\\')
            .replace (NL, '\n') .replace (CLN, ':')  .replace (BTICK, '`')  .replace (CBRKT, ']')  .replace (COMMA, ',');
}

/* Lets new RegExp match for the complete literal of the input string */
function deRegEx (str) {
    var s = '\\';
    return str.replace (/\\/g, s+s)  .replace (/\//g, '\\/').replace (/\?/g, '\\?').replace (/\+/g, '\\+').replace (/\[/g, '\\[')
              .replace (/\]/g, '\\]').replace (/\{/g, '\\{').replace (/\}/g, '\\}').replace (/\./g, '\\.').replace (/\*/g, '\\*')
              .replace (/\^/g, '\\^').replace (/\$/g, '\\$').replace (/\(/g, '\\(').replace (/\)/g, '\\)').replace (/\|/g, '\\|');
}

/*************************************************************************************************************************
 * THE FOLLOWING ARE GLOBAL VARIABLES SPAN MULTIPLE LINES, OR THEY ARE STORED IN THEIR OWN FILES TO CONSERVE READABILITY *
 *************************************************************************************************************************/
/* URL decoding regexes */
var NL = /%0A/g,  SPACE = /%20/g, BTICK = /%60/g, HTAG = /%23/g,  MNY = /%24/g,   PSNT = /%25/g, AND = /%26/g,   PLUS = /%2B/g,
    EQ = /%3D/g,  OBRCE = /%7B/g, CBRCE = /%7D/g, OBRKT = /%5B/g, CBRKT = /%5D/g, PIPE = /%7C/g, BSLSH = /%5C/g, FSLSH = /%2F/g,
    CLN = /%3A/g, SCLN = /%3B/g,  DQT = /%22/g,   SQT = /%27/g,   LT = /%3C/g,    GT = /%3E/g,   COMMA = /%2C/g, QM = /%3F/g, 
    AT = /%40/g,  CRRT = /%5E/g;

/* Internal static server error page */
var _500Page = fs.readFileSync ('./dependencies/500.html');

/* Internal unknown form error page */
var uPOSTPage = '' + fs.readFileSync ('./dependencies/UnknownPOSTForm.html');

/* Mapping of file extensions to their corresponding MIME type */
var extensionMap = JSON.parse (fs.readFileSync ('./dependencies/mimeobj.json'));

/* Changing the way that Array.prototype.toString behaves for better logging on the console */
Array.prototype.toString = function () {
    var s = '', idt = '\n        ';
    for (var i = 0; i < this.length; i++) s += i > 0? ',' + idt + this[i] : idt + this[i];
    return '[' + s + '\n    ]';
};