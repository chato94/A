/* Required Node.js modules and variables for static file serving */
var http = require ('http'), fs = require ('fs'), path = require ('path'), cp = require ('child_process'), server;
var SERVER_IP = (function () {var nI = require ('os').networkInterfaces (), i, a; for (var p in nI) {i = nI[p]; for (var j = 0; j < i.length; j++) {a = i[j]; if (a.family === 'IPv4' && a.address !== '127.0.0.1' && !a.internal) return a.address;}} return '0.0.0.0';})(), PORT = 80, BACKLOG = 511;

/* Child process map and process number tracker variable */
var childProcesses = {}, pN = 0;

var DNE = 'ENOENT', ISDIR = 'EISDIR', NOTDIR = 'ENOTDIR';

/* Fork all necessary child processes */
var dirWatcher = cp.fork (__dirname + '/dir_watch.js');

/* All available files and directories relative to this file */
var currentDirectories = '""', receivedInit = false;

/* Wait until first update of directories to start serving files */
var start = setInterval (function () {
	if (receivedInit) server = http.createServer (serverHandler).listen (PORT, SERVER_IP, BACKLOG, function () {
		$('** The server is up and running! Listening to requests on port ' + PORT + ' at ' + SERVER_IP + ' **\n');
		clearTimeout (start);
	});
}, 500);

/* Root of all callback functions */
function serverHandler (request, response) {

}

/* Handle incoming messages from child processes */
process.on ('message', function (m) {
	switch (m[0]) {
		case 'Update Directory':
			if (!receivedInit) receivedInit = true;
			currentDirectories = m[1];
			break;
	}
});

/* Kill all child processes on exit */
process.on ('SIGINT', function () {
	dirWatcher.kill ();
	process.exit ();
});

/* Helper functions and aliases */
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

function decodeURL (url) {
	return url.replace (SPACE, ' ')
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

/* Internal server error page and file/directory reading error names */
var _500Page = '<DOCTYPE! html>' +
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
