/* Required Node.js modules and variables for static file serving */
var http = require ('http'), fs = require ('fs'), path = require ('path'), cp = require ('child_process');
var I = require ('os').networkInterfaces (), CL_IP = 'x-forwarded-for', server;
var SERVER_IP = localIPAddress (), PORT = 80, BACKLOG = 511, F = 'IPv4', L = '127.0.0.1', Z = '0.0.0.0';

/* Fork all necessary child processes */
var dirWatcher = cp.fork (__dirname + '/dir_watch.js');

/* All available files and directories relative to this file */
var root = '""', receivedInit = false;

/* Client Page Map --> Keeps track of the page that users are on when the request URL does not directly match a root path */
var cPM = {};

/* Wait until first update of directories to start serving files */
var int = setInterval (function () {
	if (receivedInit) server = http.createServer (serverHandler).listen (PORT, SERVER_IP, BACKLOG, initServer);
}, 500);

/* Server initialization function */
function initServer () {
	$('** The server is up and running! Listening to requests at ' + SERVER_IP + ' on port ' + PORT + ' **\n');
	clearInterval (int);
}

/* Function from which all other callbacks execute */
function serverHandler (rq, rs) {
	var IP = rq.headers[CL_IP] || rq.connection.remoteAddress || rq.socket.remoteAddress || rq.connection.socket.remoteAddress;
	$('*** Incoming request heard! Initializing response for ' + IP + ' ***');
	rq.method === 'GET'? GETHandler (rq, rs, IP) : POSTHandler (rq, rs, IP);
}

/* Root function of the POST request handling function tree */
function POSTHandler (request, response, IP) {
	var html = '<!DOCTYPE html><html><h2>POST Request Heard!</h2><p>Stay tuned for more later.</p></html>';
	$nt('POST Methods are coming soon. Sending an HTML response for now to ' + IP);
	respondTo (response, html, 200, 'text/html', 'POST Method', IP);
}

/* Root function of the GET request handling function tree */
function GETHandler (request, response, IP) {
	var url = decodeURL (request.url),
	FILE = new RegExp ('"' + deRegEx (url) + ':FILE"'), DIRECTORY = new RegExp ('"' + deRegEx (url) + ':DIRECTORY"');
	$nt('Detected a GET request! for ' + IP, IP + ') Filtered URL: ' + url, 'FILE regex: ' + FILE, 'DIRECTORY regex: ' + DIRECTORY);
	root.match (FILE) || root.match (DIRECTORY)? urlMatchesDir (url, response, IP, FILE) : rawURLDoesNotMatch (url, response, IP);
}

function urlMatchesDir (url, response, IP, FILE) {
	$nt('The url "' + url + '" matches to a file in the current directory!');
	root.match (FILE)? url.match (/\.html$/)? setMap (url, IP, true) : read (url, response, IP, false) : setMap (url, IP, false);
}

function rawURLDoesNotMatch (url, response, IP) {
	
}

function read (route, response, IP, merge) {
	var url = merge? mergeMapAndURL (route, IP) : route;
	$nt('Attempting to read the file in the url "' + route + '" for ' + IP, IP + ') merge: ' + merge);
	fs.readFile (route, function (error, content) {
		error? send404 (route, response, IP) : respondTo (response, content, 200, MIMEType (path.basename (route)), route, IP);
	});
}

function send404 (url, response, IP) {
	$nt('There was a problem reading "' + url + '" for ' + IP, 'Sending the 404 page for ' + IP + ' instead...');
	setMap ('/404', IP, false);
}

function send500 (url, response, IP) {
	$nt('The url "' + url + '" was originally in the directory,', 'but was not at read time for ' + IP + '.');
	respondTo (response, _500Page, 500, 'text/html', url, IP);
}

function respondTo (response, content, code, MIME, url, IP) {
	$nt('Finalizing response for ' + IP + ' for the url: ' + url);
	response.writeHead (code, {'Content-Type': MIME});
	response.write (content, function () {$('*** Successfully finished the response for ' + IP + ' with code ' + code + '. ***');});
}

/* Handle incoming messages from child processes */
var retryMap = {};
dirWatcher.on ('message', function (m) {
	switch (m[0]) {
		case 'Update Directory':
			if (!receivedInit) receivedInit = true;
			root = m[1];
			break;
	}
});

/* Kill all child processes on exit */
process.on ('SIGINT', killChildrenAndExit);
process.on ('exit', killChildrenAndExit);

function killChildrenAndExit () {
	dirWatcher.kill ();
	process.exit ();
}

/**
 * Helper functions and aliases
 */
/* Sets the global map for the client */
function setMap (url, IP, useDirname) {
	var newMap = '.' + useDirname? path.dirname (url) : url;
	$nt('Re-mapping ' + IP + ' from "' + cPM[IP] + '" to "' + newMap + '"');
	cPM[IP] = newMap;
}

function mergeMapAndURL (url, IP) {

}

/* console.log alias functions */
var n = '\n', t = '    ', 
	$ = function (m) {console.log (m);}, 
	$n = function () {for (var i = 0, a = arguments; i < a.length; i++) $(n+a[i]);}, 
	$t = function () {for (var i = 0, a = arguments; i < a.length; i++) $(t+a[i]);}, 
	$nt = function () {for (var i = 0, a = arguments; i < a.length; i++) i > 0? $(n+t+a[i]) : $(t+a[i]);};

/* URL decoding regexes */
var SPACE = /%20/g, 
	NEWLINE = /%0A/g, 
	AT = /%40/g, 
	HASHTAG = /%23/g, 
	DOLLAR = /%24/g, 
	PERCENT = /%25/g, 
	CARROT = /%5E/g, 
	AMPERSAND = /%26/g, 
	PLUS = /%2B/g, 
	EQUALS = /%3D/g, 
	OPENBRACE = /%7B/g, 
	CLOSEBRACE = /%7D/g, 
	OPENBRACKET = /%5B/g, 
	CLOSEBRACKET = /%5D/g, 
	PIPE = /%7C/g, 
	BACKSLASH = /%5C/g, 
	FORWARDSLASH = /%2F/g, 
	COLON = /%3A/g, 
	SEMICOLON = /%3B/g, 
	DOUBLEQUOTE = /%22/g, 
	SINGLEQUOTE = /%27/g, 
	LESSTHAN = /%3C/g, 
	GREATERTHAN = /%3E/g, 
	COMMA = /%2C/g, 
	QUESTIONMARK = /%3F/g, 
	BACKTICK = /%60/g;

var extensionMap = {
	'.js': 'text/javascript', 
	'.css': 'text/css', 
	'.html': 'text/html', 
	'.jpeg': 'image/jpeg/', 
	'.jpg': 'image/jpeg', 
	'.png': 'image/png', 
	'.gif': 'image/gif', 
	'.ico': 'image/x-icon', 
	'.svg': 'image/svg+xml', 
	'.woff2': 'application/font-woff2', 
	'.woff': 'application/x-font-woff', 
	'.wav': 'audio/x-wav', 
	'.pdf': 'application/pdf', 
	'.zip': 'application/zip', 
	'.rar': 'application/x-rar-compressed', 
	'.mp3': 'audio/mpeg', 
	'.mp4': 'video/mp4', 
	'.avi': 'video/x-msvideo', 
	'.ttf': 'application/x-font-ttf', 
	'.3gp': 'video/3gpp', 
	'.7z': 'application/x-7z-compressed', 
	'.swf': 'application/x-shockwave-flash', 
	'.aac': 'audio/x-aac', 
	'.wma': 'audio/x-ms-wma', 
	'.webm': 'video/webm', 
	'.weba': 'audio/webm', 
	'.flv': 'video/x-flv', 
	'.apk': 'application/vnd.android.package-archive', 
	'.s': 'text/x-asm', 
	'.psd': 'image/vnd.adobe.photoshop', 
	'.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 
	'.sldx': 'application/vnd.openxmlformats-officedocument.presentationml.slide', 
	'.ppsx': 'application/vnd.openxmlformats-officedocument.slideshow', 
	'.potx': 'application/vnd.openxmlformats-officedocument.template', 
	'.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
	'.xltx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.template', 
	'.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
	'.dotx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template', 
	'.java': 'text/x-java-source.java,java', 
	'.class': 'application/java-vm', 
	'.jar': 'application/java-archive', 
	'.json': 'application/json', 
	'.latex': 'application/x-latex', 
	'.torrent': 'application/x-bittorrent'
}, ext = /\..+$/;

function MIMEType (file) {
	var extension = file.match (ext)? file.match (ext)[0] : 'dne';
	return extensionMap[extension] || 'text/plain';
}

function decodeURL (url) {
	// Convert the initial request into a directory that actually exists
	var temp = url === '/' || url === '/index.html'? '/init/index.html' : url;
	return temp.replace (SPACE, ' ')
		.replace (NEWLINE, '\n')
		.replace (AT, '@')
		.replace (HASHTAG, '#')
		.replace (DOLLAR, '$')
		.replace (PERCENT, '%')
		.replace (CARROT, '^')
		.replace (AMPERSAND, '&')
		.replace (PLUS, '+')
		.replace (EQUALS, '=')
		.replace (OPENBRACE, '{')
		.replace (CLOSEBRACE, '}')
		.replace (OPENBRACKET, '[')
		.replace (CLOSEBRACKET, ']')
		.replace (PIPE, '|')
		.replace (BACKSLASH, '\\')
		.replace (FORWARDSLASH, '/')
		.replace (COLON, ':')
		.replace (SEMICOLON, ';')
		.replace (DOUBLEQUOTE, '"')
		.replace (SINGLEQUOTE, "'")
		.replace (LESSTHAN, '<')
		.replace (GREATERTHAN, '>')
		.replace (COMMA, ',')
		.replace (QUESTIONMARK, '?')
		.replace (BACKTICK, '`');
}

function deRegEx (str) {
	return str.replace (/\?/g, '\\?')
		.replace (/\+/g, '\\+')
		.replace (/\[/g, '\\[')
		.replace (/\]/g, '\\]')
		.replace (/\{/g, '\\{')
		.replace (/\}/g, '\\}')
		.replace (/\./g, '\\.')
		.replace (/\*/g, '\\*')
		.replace (/\^/g, '\\^')
		.replace (/\$/, '\\$')
		.replace (/\(/g, '\\(')
		.replace (/\)/g, '\\)')
		.replace (/\|/g, '\\|');
		/*.replace (/\\/g, '\\\\')
		.replace (/\//g, '\\/')*/
}


/* Internal server error page and file/directory reading error names */
var _500Page = '<!DOCTYPE html>' +
'<html>' +
	'<head>' +
		'<title>500% Stamina</title>' +
	'</head>' +
	'<body>' +
		'<h1 style="margin: 0; padding: 0">Error 500: Internal Server Error</h1>' +
		'<p style="margin: 0; padding: 0">' +
			'There was an internal server error. Rest assured that the monkeys are most ' +
			'likely working on it, and then try again later. If you keep seeing this message, ' +
			'make sure to contact your local developer and tell him that the machine blew ' +
			'up again. He (or she) will know exactly what that means, and hopefully the page ' +
			'that you loaded will be in tip-top shape before you know it.' +
		'</p>' +
	'</body>' +
'</html>';

/* Gets the IP address of the machine that the server is running on */
function localIPAddress () {
	var p, a, i, j;
	for (p in I) {
		i = I[p];
		for (j = 0; j < i.length; j++) if (a = i[j], a.family === F && a.address !== L && !a.internal) return a.address;
	} return Z;
}
