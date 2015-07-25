/*********************************************************************************************
 * THE FOLLOWING ARE REQUIRED Node.js LIBRARIES AND GLOBAL VARIABLES FOR STATIC FILE SERVING *
 *********************************************************************************************/
var http = require ('http'), fs = require ('fs'), path = require ('path'), cp = require ('child_process');
var Int = require ('os').networkInterfaces (), CL_IP = 'x-forwarded-for', server;
var S_IP = localIPAddress (), PORT = 80, BACKLOG = 511, L = '127.0.0.1', Z = '0.0.0.0';

/* Fork all necessary child processes */
var dirWatcher = cp.fork (__dirname + '/dirwatch.js');

/* All available files and directories relative to this file */
var root = {}, e = new DirSpace (), receivedInit = false;

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

/********************************************************************************************************
 * THE FOLLOWING FUNCTIONS ARE FUNCTIONS THAT HANDLE CHILD PROCESSES AND THE PARENT PROCESS TERMINATION *
 ********************************************************************************************************/
/* Handle incoming messages from child processes */
dirWatcher.on ('message', function (m) {
    if (m[0] === 'Update Mapping') {
        if (!receivedInit) receivedInit = true;
        root = m[1];
        e.update ();
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
/* Sets the global map for the client */
function setMap (url, IP, useDirname) {
    var newMap = useDirname? path.dirname (url) : url;
    $nt('Re-mapping ' + IP + ' from "' + cPM[IP] + '" to "' + newMap + '"');
    cPM[IP] = newMap;
}

/* Concatenates the client page map for IP with the requested url */
function mergeMapAndURL (url, IP) {return cPM[IP]? cPM[IP] + url : url;}

/* Handles bad URL error filtering for the 404 page by keeping track of the valid directories */
function DirSpace () {

    // Simple binary search over an array to find the index of its location, or false if it's not in the array
    function bS (a, me) {

        // Binary search worker function
        function b$ (a, me, i, j) {
            var m = Math.floor ((i + j) / 2);
            return i === j? a[i] === me? i : false : a[m] === me? m : a[m] > me? b$ (a, me, i, m - 1) : b$ (a, me, m + 1, j);
        }

        return b$ (a, me, 0, a.length - 1);
    }

    this.match = function (url) {
        var segs = url.match (/\/[^/]+/g) || ['/init', '/index.html'], deps = root[segs[0]], i;
        if (deps) {
            i = bS (deps, url);
        }
    };

    this.errorMatch = function (url) {
        var dependencies
    };

    // Used to update the internal array of all /404 directories, and to log that child process has updated root
    this.update = function () {$n('################################# UPDATED ROOT #################################\n');};
}

/* console.log alias functions */
function $ (m) {console.log (m);}
var n = '\n', t = '    ', 
    $n = function () {for (var i = 0, a = arguments; i < a.length; i++) $(n+a[i]);}, 
    $t = function () {for (var i = 0, a = arguments; i < a.length; i++) $(t+a[i]);}, 
    $nt = function () {for (var i = 0, a = arguments; i < a.length; i++) i > 0? $(t+a[i]) : $(n+t+a[i]);};

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
    return u.replace (SCLN, ';')  .replace (NLN, '\n') .replace (AT, '@')   .replace (HTAG, '#')  .replace (PSNT, '%')
            .replace (CARROT, '^').replace (AND, '&')  .replace (PLUS, '+') .replace (OBRCE, '{') .replace (CBRCE, '}')
            .replace (OBRKT, '[') .replace (CBRKT, ']').replace (PIPE, '|') .replace (BSLSH, '\\').replace (FSLSH, '/')
            .replace (CLN, ':')   .replace (DQTE, '"') .replace (SQTE, "'") .replace (LT, '<')    .replace (GT, '>')
            .replace (COMMA, ',') .replace (QM, '?')   .replace (BTICK, '`').replace (MNY, '$')   .replace (EQL, '=');
}

/* Lets new RegExp match for the complete literal of the input string */
function deRegEx (str) {
    var s = '\\';
    return str.replace (/\\/g, s+s)  .replace (/\//g, '\\/').replace (/\?/g, '\\?').replace (/\+/g, '\\+').replace (/\[/g, '\\[')
              .replace (/\]/g, '\\]').replace (/\{/g, '\\{').replace (/\}/g, '\\}').replace (/\./g, '\\.').replace (/\*/g, '\\*')
              .replace (/\^/g, '\\^').replace (/\$/g, '\\$').replace (/\(/g, '\\(').replace (/\)/g, '\\)').replace (/\|/g, '\\|');
}

/*****************************************************************************************************
 * THE FOLLOWING ARE GLOBAL VARIABLES SPAN MULTIPLE LINES OR THEIR OWN FILES TO CONSERVE READABILITY *
 *****************************************************************************************************/
/* URL decoding regexes */
var SPACE = /%20/g, NLN = /%0A/g,   AT = /%40/g,    HTAG = /%23/g,  MNY = /%24/g,   PSNT = /%25/g, AND = /%26/g,   PLUS = /%2B/g,
    EQL = /%3D/g,   OBRCE = /%7B/g, CBRCE = /%7D/g, OBRKT = /%5B/g, CBRKT = /%5D/g, PIPE = /%7C/g, BSLSH = /%5C/g, FSLSH = /%2F/g,
    CLN = /%3A/g,   SCLN = /%3B/g,  DQTE = /%22/g,  SQTE = /%27/g,  LT = /%3C/g,    GT = /%3E/g,   COMMA = /%2C/g, QM = /%3F/g, 
    BTICK = /%60/g, CARROT = /%5E/g;

/* Internal server error page */
var _500Page = ('' + fs.readdirSync (__dirname + '/500.html'));

/* Mapping of file extensions to their corresponding MIME type */
var extensionMap = JSON.parse ('' + fs.readdirSync (__dirname + '/mimeobj.json'));