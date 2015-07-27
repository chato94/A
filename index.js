/*********************************************************************************************
 * THE FOLLOWING ARE REQUIRED Node.js LIBRARIES AND GLOBAL VARIABLES FOR STATIC FILE SERVING *
 *********************************************************************************************/
var http = require ('http'), fs = require ('fs'), path = require ('path'), cp = require ('child_process'),
    Int = require ('os').networkInterfaces (), CL_IP = 'x-forwarded-for', S_IP = localIPAddress (),
    PORT = 80, BACKLOG = 511, L = '127.0.0.1', Z = '0.0.0.0', server;

/* Fork all necessary child processes */
var dirWatcher = cp.fork (__dirname + '/dirwatch.js');

/* All available files and directories relative to this file */
var root = {}, d = new DirSpace (), receivedInit = false;

/* Client Page Map --> Keeps track of the page that users are on when the request URL does not directly match a root path */
var cPM = {};

/* Wait until first update of directories to start serving files */
var int = setInterval (function () {if (receivedInit) server = http.createServer (fHTTP).listen (PORT, S_IP, BACKLOG, iS);}, 250);

/* Server initialization function */
function iS () {
    $('** The server is up and running! Listening to requests at ' + S_IP + ' on port ' + PORT + ' **\n');
    clearInterval (int);
}

/* Gets the IPv4 address of the machine running the server */
function localIPAddress () {
    var a, i, p, j;
    for (p in Int) {
        i = Int[p];
        for (j = 0; j < i.length; j++) if (a = i[j], a.family === 'IPv4' && a.address !== L && !a.internal) {
            return a.address;
        }
    } return Z;
}

/***********************************************************************************************************************
 * THE FOLLOWING FUNCTIONS ARE THE TREE-LIKE FLOW OF CALLBACKS THAT STEM FROM CLIENT REQUESTS FOR THE SERVER TO HANDLE *
 ***********************************************************************************************************************/
/* Function from which all other callbacks execute */
function fHTTP (rq, rs) {
    var IP = rq.headers[CL_IP] || rq.connection.remoteAddress || rq.socket.remoteAddress || rq.connection.socket.remoteAddress;
    $n('\n*** fHTTP - Incoming request heard! Initializing response for ' + IP + ' ***');
    rq.method === 'GET'? GETHandler (rq, rs, IP) : POSTHandler (rq, rs, IP);
}

function POSTHandler (request, response, IP) {

}

function GETHandler (request, response, IP) {
    var ip = IP + ') ', wrap = d.match (request.url, IP), url = '.' + wrap[0], code = wrap[1];
    $nt(ip+'GETHandler - Detected a GET request!', ip+'Raw URL: ' + request.url, ip+'Filtered URL: ' + url);
    read (url, response, IP, code);
}

function send500 (url, response, IP, error) {
    $nt(IP + ') send500 - An error occurred while serving: ' + url);
    respondTo (url, response, IP, _500Page, 500, 'text/html');
}

function read (url, response, IP, code) {
    $nt(IP + ') read - Attempting to read the file in: ' + url);
    fs.readFile (url, function (error, content) {
        error? send500 (url, response, IP, error) : respondTo (url, response, IP, content, code, MIMEType (path.basename (url)));
    });
}

function respondTo (url, response, IP, content, code, mime) {
    var ip = IP + ') ';
    $nt(ip+'respondTo - Finalizing the response for: ' + url, ip+'Status Code: ' + code);
    response.writeHead (code, {'Content-Type': mime});
    response.write (content, function () {$n('*** Finished the response for ' + IP + ' ***'); response.end ();});
}

/***************************************************************************************************
 * THE FOLLOWING FUNCTIONS ARE FUNCTIONS THAT HANDLE CHILD PROCESSES AND CLEAN PROCESS TERMINATION *
 ***************************************************************************************************/
/* Handle incoming messages from child processes */
dirWatcher.on ('message', function (m) {
    if (m[0] === 'Update Mapping') {
        if (!receivedInit) receivedInit = true;
        root = m[1];
        //$(root);
        d.update ();
    }
});

/* Kill all child processes on exit */
process.on ('SIGINT', killChildrenAndExit);

function killChildrenAndExit () {
    dirWatcher.kill ();
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

        return s (a, o, 0, a.length - 1);
    }

    // Maps the master page of the incoming IP address if the URL is an HTML file
    function map (url, IP, code) {if (path.basename (url).match (/\.html$/)) cPM[IP] = path.dirname (url); return [url, code];}

    // Merges the input URL with the master map if it exists; returns the input URL as-is otherwise
    function mrg (url, IP) {return cPM[IP]? cPM[IP] + url : url;}

    function errorMatch (rURL, IP) {
        var deps = root['/404'] || [], segs = rURL.match (/\/[^/]+/g);
        while (segs.length > 1) {
            segs.splice (0, 1);
            var url = '/404' + segs.join (''), i;
            if ((i = bS (deps, url)) !== false) return map (deps[i], IP, 200);
        }
        return false;
    }

    // Attempts to match the raw URL directly from the request with a directory found in 
    this.match = function (rURL, IP) {
        var def = ['/404', '/index.html'], rx = /\/[^/]+/g, errdep = true;

        var url = decodeURL (rURL), aURL = mrg (url, IP), 
            sgs0 = url.match (rx) || def, sgs1 = aURL.match (rx),
            top0 = sgs0[0], top1 = sgs1[0], deps0 = root[top0] || [], deps1 = root[top1] || [], idxStr = url + def[1], i;

        // The user agent requested a perfect path to the file
        if ((i = bS (deps0, url)) !== false) return map (deps0[i], IP, 200);

        // The user agent's page requested a dependency
        else if ((i = bS (deps1, aURL)) !== false) return [deps1[i], 200];

        // The user agent lazily typed the request, and it matches a valid path to an index.html file
        else if ((i = bS (deps0, idxStr)) !== false) return map (deps0[i], IP, 200);

        // The user agent lazily typed the request, and it might match a valid path to an html file
        else if (deps0.length) {for (i = 0; i < deps0.length; i++) if (deps0[i].match (/\\.html$/)) return map (deps0[i], IP, 200);}

        // The user agent might have requested a completely non-existent URL, but the error page is requesting dependencies
        else errdep = errorMatch (url, IP);

        // The user agent requested a path that does not exist in the current state of the directory
        return errdep || map ('/404/index.html', IP, 404);
    };

    // Used to update the internal array of all /404 directories, and to log that child process has updated root
    this.update = function () {$n('##################################### UPDATED ROOT #####################################\n');};
}

/* console.log alias functions */
function $ (m) {console.log (m);}
function $n () {for (var i = 0, a = arguments; i < a.length; i++) $('\n' + a[i]);}
function $t () {for (var i = 0, a = arguments; i < a.length; i++) $('    ' + a[i]);}
function $nt () {for (var i = 0, a = arguments; i < a.length; i++) i > 0? $('    ' + a[i]) : $('\n    ' + a[i]);}

/* Utilizes the comprehensive extension map to return the appropriate MIME type of a file */
function MIMEType (file) {
    var ext = /\..+$/, extension = file.match (ext)? file.match (ext)[0] : 'dne';
    return extensionMap[extension] || 'text/plain';
}

/* Converts the URL encoding to the literal string representation */
function decodeURL (url) {
    // Convert the initial request into a directory that actually exists
    var temp = url === '/' || url === '/index.html'? '/init/index.html' : url, u = temp.replace (SPACE, ' ');
    
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

/* Internal server error page */
var _500Page = '' + fs.readFileSync ('./dependencies/500.html');

/* Mapping of file extensions to their corresponding MIME type */
var extensionMap = JSON.parse ('' + fs.readFileSync ('./dependencies/mimeobj.json'));