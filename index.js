/*********************************************************************************************
 * THE FOLLOWING ARE REQUIRED Node.js LIBRARIES AND GLOBAL VARIABLES FOR STATIC FILE SERVING *
 *********************************************************************************************/
var http = require ('http'), fs = require ('fs'), path = require ('path'), cp = require ('child_process');
var Int = require ('os').networkInterfaces (), CL_IP = 'x-forwarded-for', server;
var SERVER_IP = localIPAddress (), PORT = 80, BACKLOG = 511, L = '127.0.0.1', Z = '0.0.0.0';

/* Fork all necessary child processes */
var dirWatcher = cp.fork (__dirname + '/dir_watch.js');

/* All available files and directories relative to this file */
var root = '""', e = new RootSpace (), receivedInit = false;

/* Client Page Map --> Keeps track of the page that users are on when the request URL does not directly match a root path */
var cPM = {};

/* Wait until first update of directories to start serving files */
var int = setInterval (function () {if (receivedInit) server = http.createServer (fHTTP).listen (PORT, SERVER_IP, BACKLOG, iS);}, 250);

/* Server initialization function */
function iS () {
	$('** The server is up and running! Listening to requests at ' + SERVER_IP + ' on port ' + PORT + ' **\n');
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
	$n('*** fHTTP - Incoming request heard! Initializing response for ' + IP + ' ***');
	rq.method === 'GET'? GETHandler (rq, rs, IP) : POSTHandler (rq, rs, IP);
}

/* Root function of the POST request handling function tree */
function POSTHandler (request, response, IP) {
	var html = '<!DOCTYPE html><html><h2>POST Request Heard!</h2><p>Stay tuned for more later.</p></html>';
	$nt('POST Methods are coming soon. Sending an HTML response for now to ' + IP);
	respondTo ('POST Method', response, IP, html, 200, 'text/html');
}

/* Root function of the GET request handling function tree */
function GETHandler (request, response, IP) {
	var url = decodeURL (request.url),
	FILE = new RegExp ('"' + deRegEx (url) + ':FILE"'), DIRECTORY = new RegExp ('"' + deRegEx (url) + ':DIRECTORY"');
	$nt('GETHandler - Detected a GET request! for ' + IP, IP + ') Filtered URL: ' + url, 'FILE regex: ' + FILE, 'DIRECTORY regex: ' + DIRECTORY);
	root.match (FILE) || root.match (DIRECTORY)? urlMatchesDir (url, response, IP, FILE) : rawURLDoesNotMatch (url, response, IP, FILE);
}

function urlMatchesDir (url, response, IP, FILE) {
	$nt('urlMatchesDir - The url "' + url + '" matches to a file in the current directory!');
	root.match (FILE)? url.match (/\.html$/)? next (true) : read (url, response, IP, false) : next (false);
	
	// Sets the client page map for potential dependency concatenation, then reads the file from storage
	function next (mapArg) {setMap (url, IP, mapArg); read (url, response, IP, false);}
}

function rawURLDoesNotMatch (route, rs, IP) {
	$nt('rawURLDoesNotMatch - The url "' + route + '" does not match a file in the current directory!', 'Attempting to merge and match for ' + IP);
	var url = mergeMapAndURL (route, IP), q = '\\.html:FILE"', r = root,
	FILE = new RegExp ('"' + deRegEx (url) + ':FILE"'), DIR = new RegExp ('"' + deRegEx (url) + ':DIRECTORY"');
	r.match (FILE)? url.match (/\.html$/)? next (true) : read (url, rs, IP, false) : r.match (DIR)? _() : send404 (url, rs, IP);

	// Used to handle an incoming URL that matches a directory rather than a file. Should never happen, but just in case, it's here
	function _() {
		$t('_(' + IP + ') was called, and it has been determined that', 'dir_watch.js would not match this case.');
		var I = new RegExp ('"' + deRegEx (url) + '\\/index' + q), H = root.match (new RegExp ('"' + deRegEx (url) + '\\/.*' + q));
		root.match (I)? next (false, url + '/index.html') : H? next (false, H[0].replace (/^"|:FILE"$/g, '')) : send404 (url, response, IP);
	}

	// Sets the client page map for potential dependency concatenation if .html file exists, then reads the file from storage
	function next (mapArg, file) {var u = file? file : url; setMap (u, IP, mapArg); read (u, response, IP, false);}
}

function read (route, response, IP, merge, err, callback) {
	var url = '.' + (merge? mergeMapAndURL (route, IP) : route);
	$nt('read - Attempting to read the file in the url "' + url + '" for ' + IP, IP + ') merge: ' + merge);
	if (!err) errCallback = send404;
	if (!callback) callback = respondTo;
	fs.readFile (url, function (error, content) {
		error? err (url, response, IP) : callback (url, response, IP, content, 200, MIMEType (path.basename (url)));
	});
}

function send404 (badURL, response, IP) {
	$nt('send404 - There was a problem reading "' + badURL + '" for ' + IP, 'Sending the 404 page for ' + IP + ' instead...');
	read (e.filter (badURL, response, IP), response, IP, false, done, done);

	// Handler for error and success to avoid recursive call and thus write after end error
	function done () {}
}

function send500 (url, response, IP) {
	$nt('send500 - The url "' + url + '" was either originally in the directory', 'but not at read time, or never exited for ' + IP + '.');
	respondTo (url, response, IP, _500Page, 500, 'text/html');
}

function respondTo (url, response, IP, content, code, MIME) {
	$nt('respondTo - Finalizing response for ' + IP + ' for the url: ' + url);
	response.writeHead (code, {'Content-Type': MIME});
	response.write (content, function () {$('*** Successfully finished the response for ' + IP + ' with code ' + code + '. ***'); response.end ();});
}

/********************************************************************************************************
 * THE FOLLOWING FUNCTIONS ARE FUNCTIONS THAT HANDLE CHILD PROCESSES AND THE PARENT PROCESS TERMINATION *
 ********************************************************************************************************/
/* Handle incoming messages from child processes */
dirWatcher.on ('message', function (m) {
	if (m[0] === 'Update Directory') {
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
function RootSpace () {

	// rgx0 matches all valid /404 dirs from root, rgx1 splits paths and URLs into segments
	var rgx1 = /\/[^/]+/g;

	// Splits a URL or a path into an array of forwardslash-name segments
	function segment (url) {
		var m = url.match (rgx1) || [];
		return m.length? (function () {var l = m.length-1; m[l] = m[l].replace (/^"|:FILE"$|:DIRECTORY"$/g, ''); return m;})() : m;
	}

	// Returns the longest string in the input array
	function longest (a) {var s = ''; for (var i = 0; i < a.length; i++) if (a[i].length > s.length) s = a[i]; return s;}

	// Searches root for the top folder defined by rgx and returns the longest match found
	function matchWorker (url, rgx) {
		var matchDirs = root.match (rgx) || [];
		var broke = false, matches = [], concat = '', urlSegs = segment (url), k0 = urlSegs.length - 1, k = k0, segs, j;

		// Iterates through each specified top directory to match the bad URL segments from basename to rootname
		for (var i = 0; i < matchDirs.length; i++) {

			segs = segment (matchDirs[i]);
			j = segs.length - 1;

			// Iterates through each /... segment of the directory and bad URL and joins the result in concat
			while (j >= 0) {
				if (k >= 0 && segs[j] === urlSegs[k]) {
					concat = urlSegs[k] + concat;
					k--;
				} else {
					k = k0;
					broke = true; // break because it's guaranteed that the error and bad don't ===
					break;
				} j--;
			}

			// No break means perfect match, so return early
			if (!broke) return concat; else matches.push (concat);
			concat = '';
		}

		return longest (matches);
	};

	this.filter = function (badURL, response, IP) {
		var longestMatch = '/404' + matchWorker (badURL, /"\/404.*?"/g), rgx = new RegExp (deRegEx ('"' + longestMatch + ':FILE"'));
		return root.match (rgx)? root.match (rgx)[0] : root.match (/"\/404\/index\.html:FILE"/)? '/404/index.html' : send500 (badURL, response, IP);
	}

	// Used to update the internal array of all /404 directories, and to log that child process has updated root
	this.update = function () {
		$n('################################# UPDATED ROOT #################################\n');
	};
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

/* Lets new RegExp match for the complete literal of the input string */
function deRegEx (str) {
	return str.replace (/\\/g, '\\\\')
		.replace (/\//g, '\\/')
		.replace (/\?/g, '\\?')
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
}

/*********************************************************************************************************************************
 * THE FOLLOWING ARE GLOBAL VARIABLES THAT WOULD BE TOO LARGE TO FIT ON A SINGLE LINE AND COULD POTENTIALLY BE ON THEIR OWN FILE *
 *********************************************************************************************************************************/
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

/* Internal server error page */
var _500Page = '<!DOCTYPE html>' +
	'<html>' +
		'<head>' +
			'<title>500% Stamina</title>' +
			'<meta name="viewport" content="initial-scale=1, width=device-width, user-scalable=no"/>' +
			'<style>' +
				'h1, h2, h3, h4, h5, h6, p, br {' +
					'color: #FFFFCC;' +
					'font-family: "Courier New", monospace;' +
				'}' +
				'body {' +
					'background-color: #0A0000;' +
				'}' +
				'.fire {' +
					'color: #AA2000;' +
				'}' +
			'</style>' +
		'</head>' +
		'<body>' +
			'<h1 style="margin: 0; padding: 0">Error Code: 500</h1><hr>' +
			'<p style="margin: 0; padding: 0">' +
				'There was an internal server error. Rest assured that the monkeys are most ' +
				'likely working on it, and then try again later. If you keep seeing this message, ' +
				'make sure to contact your local developer and tell him that the machine blew ' +
				'up again. He (or she) will know exactly what that means, and hopefully the page ' +
				'that you loaded will be in tip-top shape before you know it.' +
			'</p>' +
			'<br>' +
			'<h2 style="margin: 0; padding: 0"><span class="fire">&#128293;&#128293;&#128293;</span> ' +
				'Known Error <span class="fire">&#128293;&#128293;&#128293;</span></h2><hr>' +
			'<p style="margin: 0; padding: 0">' +
				'Do especially let the developers know if you get this message, and then the page ' +
				'fails to connect entirely (but your Internet is still working perfectly fine). This ' + 
				'means that the server crashed, and unless it is manually restarted from the same ' +
				'machine, it won\'t work anymore. Thank you for your patience, and for reading this ' +
				'message of course :)' +
			'</p>' +
		'</body>' +
	'</html>';

/* Mapping of file extensions to their corresponding MIME type */
var extensionMap = {
	'.aw': 'application/applixware',
	'.atom': 'application/atom+xml',
	'.atomcat': 'application/atomcat+xml',
	'.atomsvc': 'application/atomsvc+xml',
	'.ccxml': 'application/ccxml+xml',
	'.cdmia': 'application/cdmi-capability',
	'.cdmic': 'application/cdmi-container',
	'.cdmid': 'application/cdmi-domain',
	'.cdmio': 'application/cdmi-object',
	'.cdmiq': 'application/cdmi-queue',
	'.cu': 'application/cu-seeme',
	'.davmount': 'application/davmount+xml',
	'.dssc': 'application/dssc+der',
	'.xdssc': 'application/dssc+xml',
	'.es': 'application/ecmascript',
	'.emma': 'application/emma+xml',
	'.epub': 'application/epub+zip',
	'.exi': 'application/exi',
	'.pfr': 'application/font-tdpfr',
	'.stk': 'application/hyperstudio',
	'.ipfix': 'application/ipfix',
	'.jar': 'application/java-archive',
	'.ser': 'application/java-serialized-object',
	'.class': 'application/java-vm',
	'.js': 'application/javascript',
	'.json': 'application/json',
	'.hqx': 'application/mac-binhex40',
	'.cpt': 'application/mac-compactpro',
	'.mads': 'application/mads+xml',
	'.mrc': 'application/marc',
	'.mrcx': 'application/marcxml+xml',
	'.ma': 'application/mathematica',
	'.mathml': 'application/mathml+xml',
	'.mbox': 'application/mbox',
	'.mp3': 'audio/mpeg', 
	'.mscml': 'application/mediaservercontrol+xml',
	'.meta4': 'application/metalink4+xml',
	'.mets': 'application/mets+xml',
	'.mods': 'application/mods+xml',
	'.m21': 'application/mp21',
	'.mp4': 'application/mp4',
	'.doc': 'application/msword',
	'.mxf': 'application/mxf',
	'.bin': 'application/octet-stream',
	'.oda': 'application/oda',
	'.opf': 'application/oebps-package+xml',
	'.ogx': 'application/ogg',
	'.onetoc': 'application/onenote',
	'.xer': 'application/patch-ops-error+xml',
	'.pdf': 'application/pdf',
	'.pgp': 'application/pgp-signature',
	'.prf': 'application/pics-rules',
	'.p10': 'application/pkcs10',
	'.p7m': 'application/pkcs7-mime',
	'.p7s': 'application/pkcs7-signature',
	'.p8': 'application/pkcs8',
	'.ac': 'application/pkix-attr-cert',
	'.cer': 'application/pkix-cert',
	'.crl': 'application/pkix-crl',
	'.pkipath': 'application/pkix-pkipath',
	'.pki': 'application/pkixcmp',
	'.pls': 'application/pls+xml',
	'.ai': 'application/postscript',
	'.cww': 'application/prs.cww',
	'.pskcxml': 'application/pskc+xml',
	'.rdf': 'application/rdf+xml',
	'.rif': 'application/reginfo+xml',
	'.rnc': 'application/relax-ng-compact-syntax',
	'.rl': 'application/resource-lists+xml',
	'.rld': 'application/resource-lists-diff+xml',
	'.rs': 'application/rls-services+xml',
	'.rsd': 'application/rsd+xml',
	'.rss': 'application/rss+xml',
	'.rtf': 'application/rtf',
	'.sbml': 'application/sbml+xml',
	'.scq': 'application/scvp-cv-request',
	'.scs': 'application/scvp-cv-response',
	'.spq': 'application/scvp-vp-request',
	'.spp': 'application/scvp-vp-response',
	'.sdp': 'application/sdp',
	'.setpay': 'application/set-payment-initiation',
	'.setreg': 'application/set-registration-initiation',
	'.shf': 'application/shf+xml',
	'.smi': 'application/smil+xml',
	'.rq': 'application/sparql-query',
	'.srx': 'application/sparql-results+xml',
	'.gram': 'application/srgs',
	'.grxml': 'application/srgs+xml',
	'.sru': 'application/sru+xml',
	'.ssml': 'application/ssml+xml',
	'.tei': 'application/tei+xml',
	'.tfi': 'application/thraud+xml',
	'.tsd': 'application/timestamped-data',
	'.plb': 'application/vnd.3gpp.pic-bw-large',
	'.psb': 'application/vnd.3gpp.pic-bw-small',
	'.pvb': 'application/vnd.3gpp.pic-bw-var',
	'.tcap': 'application/vnd.3gpp2.tcap',
	'.pwn': 'application/vnd.3m.post-it-notes',
	'.aso': 'application/vnd.accpac.simply.aso',
	'.imp': 'application/vnd.accpac.simply.imp',
	'.acu': 'application/vnd.acucobol',
	'.atc': 'application/vnd.acucorp',
	'.air': 'application/vnd.adobe.air-application-installer-package+zip',
	'.fxp': 'application/vnd.adobe.fxp',
	'.xdp': 'application/vnd.adobe.xdp+xml',
	'.xfdf': 'application/vnd.adobe.xfdf',
	'.ahead': 'application/vnd.ahead.space',
	'.azf': 'application/vnd.airzip.filesecure.azf',
	'.azs': 'application/vnd.airzip.filesecure.azs',
	'.azw': 'application/vnd.amazon.ebook',
	'.acc': 'application/vnd.americandynamics.acc',
	'.ami': 'application/vnd.amiga.ami',
	'.apk': 'application/vnd.android.package-archive',
	'.cii': 'application/vnd.anser-web-certificate-issue-initiation',
	'.fti': 'application/vnd.anser-web-funds-transfer-initiation',
	'.atx': 'application/vnd.antix.game-component',
	'.mpkg': 'application/vnd.apple.installer+xml',
	'.m3u8': 'application/vnd.apple.mpegurl',
	'.swi': 'application/vnd.aristanetworks.swi',
	'.aep': 'application/vnd.audiograph',
	'.mpm': 'application/vnd.blueice.multipass',
	'.bmi': 'application/vnd.bmi',
	'.rep': 'application/vnd.businessobjects',
	'.cdxml': 'application/vnd.chemdraw+xml',
	'.mmd': 'application/vnd.chipnuts.karaoke-mmd',
	'.cdy': 'application/vnd.cinderella',
	'.cla': 'application/vnd.claymore',
	'.rp9': 'application/vnd.cloanto.rp9',
	'.c4g': 'application/vnd.clonk.c4group',
	'.c11amc': 'application/vnd.cluetrust.cartomobile-config',
	'.c11amz': 'application/vnd.cluetrust.cartomobile-config-pkg',
	'.csp': 'application/vnd.commonspace',
	'.cdbcmsg': 'application/vnd.contact.cmsg',
	'.cmc': 'application/vnd.cosmocaller',
	'.clkx': 'application/vnd.crick.clicker',
	'.clkk': 'application/vnd.crick.clicker.keyboard',
	'.clkp': 'application/vnd.crick.clicker.palette',
	'.clkt': 'application/vnd.crick.clicker.template',
	'.clkw': 'application/vnd.crick.clicker.wordbank',
	'.wbs': 'application/vnd.criticaltools.wbs+xml',
	'.pml': 'application/vnd.ctc-posml',
	'.ppd': 'application/vnd.cups-ppd',
	'.car': 'application/vnd.curl.car',
	'.pcurl': 'application/vnd.curl.pcurl',
	'.rdz': 'application/vnd.data-vision.rdz',
	'.fe_launch': 'application/vnd.denovo.fcselayout-link',
	'.dna': 'application/vnd.dna',
	'.mlp': 'application/vnd.dolby.mlp',
	'.dpg': 'application/vnd.dpgraph',
	'.dfac': 'application/vnd.dreamfactory',
	'.ait': 'application/vnd.dvb.ait',
	'.svc': 'application/vnd.dvb.service',
	'.geo': 'application/vnd.dynageo',
	'.mag': 'application/vnd.ecowin.chart',
	'.nml': 'application/vnd.enliven',
	'.esf': 'application/vnd.epson.esf',
	'.msf': 'application/vnd.epson.msf',
	'.qam': 'application/vnd.epson.quickanime',
	'.slt': 'application/vnd.epson.salt',
	'.ssf': 'application/vnd.epson.ssf',
	'.es3': 'application/vnd.eszigno3+xml',
	'.ez2': 'application/vnd.ezpix-album',
	'.ez3': 'application/vnd.ezpix-package',
	'.fdf': 'application/vnd.fdf',
	'.seed': 'application/vnd.fdsn.seed',
	'.gph': 'application/vnd.flographit',
	'.ftc': 'application/vnd.fluxtime.clip',
	'.fm': 'application/vnd.framemaker',
	'.fnc': 'application/vnd.frogans.fnc',
	'.ltf': 'application/vnd.frogans.ltf',
	'.fsc': 'application/vnd.fsc.weblaunch',
	'.oas': 'application/vnd.fujitsu.oasys',
	'.oa2': 'application/vnd.fujitsu.oasys2',
	'.oa3': 'application/vnd.fujitsu.oasys3',
	'.fg5': 'application/vnd.fujitsu.oasysgp',
	'.bh2': 'application/vnd.fujitsu.oasysprs',
	'.ddd': 'application/vnd.fujixerox.ddd',
	'.xdw': 'application/vnd.fujixerox.docuworks',
	'.xbd': 'application/vnd.fujixerox.docuworks.binder',
	'.fzs': 'application/vnd.fuzzysheet',
	'.txd': 'application/vnd.genomatix.tuxedo',
	'.ggb': 'application/vnd.geogebra.file',
	'.ggt': 'application/vnd.geogebra.tool',
	'.gex': 'application/vnd.geometry-explorer',
	'.gxt': 'application/vnd.geonext',
	'.g2w': 'application/vnd.geoplan',
	'.g3w': 'application/vnd.geospace',
	'.gmx': 'application/vnd.gmx',
	'.kml': 'application/vnd.google-earth.kml+xml',
	'.kmz': 'application/vnd.google-earth.kmz',
	'.gqf': 'application/vnd.grafeq',
	'.gac': 'application/vnd.groove-account',
	'.ghf': 'application/vnd.groove-help',
	'.gim': 'application/vnd.groove-identity-message',
	'.grv': 'application/vnd.groove-injector',
	'.gtm': 'application/vnd.groove-tool-message',
	'.tpl': 'application/vnd.groove-tool-template',
	'.vcg': 'application/vnd.groove-vcard',
	'.hal': 'application/vnd.hal+xml',
	'.zmm': 'application/vnd.handheld-entertainment+xml',
	'.hbci': 'application/vnd.hbci',
	'.les': 'application/vnd.hhe.lesson-player',
	'.hpgl': 'application/vnd.hp-hpgl',
	'.hpid': 'application/vnd.hp-hpid',
	'.hps': 'application/vnd.hp-hps',
	'.jlt': 'application/vnd.hp-jlyt',
	'.pcl': 'application/vnd.hp-pcl',
	'.pclxl': 'application/vnd.hp-pclxl',
	'.sfd-hdstx': 'application/vnd.hydrostatix.sof-data',
	'.x3d': 'application/vnd.hzn-3d-crossword',
	'.mpy': 'application/vnd.ibm.minipay',
	'.afp': 'application/vnd.ibm.modcap',
	'.irm': 'application/vnd.ibm.rights-management',
	'.sc': 'application/vnd.ibm.secure-container',
	'.icc': 'application/vnd.iccprofile',
	'.igl': 'application/vnd.igloader',
	'.ivp': 'application/vnd.immervision-ivp',
	'.ivu': 'application/vnd.immervision-ivu',
	'.igm': 'application/vnd.insors.igm',
	'.xpw': 'application/vnd.intercon.formnet',
	'.i2g': 'application/vnd.intergeo',
	'.qbo': 'application/vnd.intu.qbo',
	'.qfx': 'application/vnd.intu.qfx',
	'.rcprofile': 'application/vnd.ipunplugged.rcprofile',
	'.irp': 'application/vnd.irepository.package+xml',
	'.xpr': 'application/vnd.is-xpr',
	'.fcs': 'application/vnd.isac.fcs',
	'.jam': 'application/vnd.jam',
	'.rms': 'application/vnd.jcp.javame.midlet-rms',
	'.jisp': 'application/vnd.jisp',
	'.joda': 'application/vnd.joost.joda-archive',
	'.ktz': 'application/vnd.kahootz',
	'.karbon': 'application/vnd.kde.karbon',
	'.chrt': 'application/vnd.kde.kchart',
	'.kfo': 'application/vnd.kde.kformula',
	'.flw': 'application/vnd.kde.kivio',
	'.kon': 'application/vnd.kde.kontour',
	'.kpr': 'application/vnd.kde.kpresenter',
	'.ksp': 'application/vnd.kde.kspread',
	'.kwd': 'application/vnd.kde.kword',
	'.htke': 'application/vnd.kenameaapp',
	'.kia': 'application/vnd.kidspiration',
	'.kne': 'application/vnd.kinar',
	'.skp': 'application/vnd.koan',
	'.sse': 'application/vnd.kodak-descriptor',
	'.lasxml': 'application/vnd.las.las+xml',
	'.lbd': 'application/vnd.llamagraphics.life-balance.desktop',
	'.lbe': 'application/vnd.llamagraphics.life-balance.exchange+xml',
	'.123': 'application/vnd.lotus-1-2-3',
	'.apr': 'application/vnd.lotus-approach',
	'.pre': 'application/vnd.lotus-freelance',
	'.nsf': 'application/vnd.lotus-notes',
	'.org': 'application/vnd.lotus-organizer',
	'.scm': 'application/vnd.lotus-screencam',
	'.lwp': 'application/vnd.lotus-wordpro',
	'.portpkg': 'application/vnd.macports.portpkg',
	'.mcd': 'application/vnd.mcd',
	'.mc1': 'application/vnd.medcalcdata',
	'.cdkey': 'application/vnd.mediastation.cdkey',
	'.mwf': 'application/vnd.mfer',
	'.mfm': 'application/vnd.mfmp',
	'.flo': 'application/vnd.micrografx.flo',
	'.igx': 'application/vnd.micrografx.igx',
	'.mif': 'application/vnd.mif',
	'.daf': 'application/vnd.mobius.daf',
	'.dis': 'application/vnd.mobius.dis',
	'.mbk': 'application/vnd.mobius.mbk',
	'.mqy': 'application/vnd.mobius.mqy',
	'.msl': 'application/vnd.mobius.msl',
	'.plc': 'application/vnd.mobius.plc',
	'.txf': 'application/vnd.mobius.txf',
	'.mpn': 'application/vnd.mophun.application',
	'.mpc': 'application/vnd.mophun.certificate',
	'.xul': 'application/vnd.mozilla.xul+xml',
	'.cil': 'application/vnd.ms-artgalry',
	'.cab': 'application/vnd.ms-cab-compressed',
	'.xls': 'application/vnd.ms-excel',
	'.xlam': 'application/vnd.ms-excel.addin.macroenabled.12',
	'.xlsb': 'application/vnd.ms-excel.sheet.binary.macroenabled.12',
	'.xlsm': 'application/vnd.ms-excel.sheet.macroenabled.12',
	'.xltm': 'application/vnd.ms-excel.template.macroenabled.12',
	'.eot': 'application/vnd.ms-fontobject',
	'.chm': 'application/vnd.ms-htmlhelp',
	'.ims': 'application/vnd.ms-ims',
	'.lrm': 'application/vnd.ms-lrm',
	'.thmx': 'application/vnd.ms-officetheme',
	'.cat': 'application/vnd.ms-pki.seccat',
	'.stl': 'application/vnd.ms-pki.stl',
	'.ppt': 'application/vnd.ms-powerpoint',
	'.ppam': 'application/vnd.ms-powerpoint.addin.macroenabled.12',
	'.pptm': 'application/vnd.ms-powerpoint.presentation.macroenabled.12',
	'.sldm': 'application/vnd.ms-powerpoint.slide.macroenabled.12',
	'.ppsm': 'application/vnd.ms-powerpoint.slideshow.macroenabled.12',
	'.potm': 'application/vnd.ms-powerpoint.template.macroenabled.12',
	'.mpp': 'application/vnd.ms-project',
	'.docm': 'application/vnd.ms-word.document.macroenabled.12',
	'.dotm': 'application/vnd.ms-word.template.macroenabled.12',
	'.wps': 'application/vnd.ms-works',
	'.wpl': 'application/vnd.ms-wpl',
	'.xps': 'application/vnd.ms-xpsdocument',
	'.mseq': 'application/vnd.mseq',
	'.mus': 'application/vnd.musician',
	'.msty': 'application/vnd.muvee.style',
	'.nlu': 'application/vnd.neurolanguage.nlu',
	'.nnd': 'application/vnd.noblenet-directory',
	'.nns': 'application/vnd.noblenet-sealer',
	'.nnw': 'application/vnd.noblenet-web',
	'.ngdat': 'application/vnd.nokia.n-gage.data',
	'.n-gage': 'application/vnd.nokia.n-gage.symbian.install',
	'.rpst': 'application/vnd.nokia.radio-preset',
	'.rpss': 'application/vnd.nokia.radio-presets',
	'.edm': 'application/vnd.novadigm.edm',
	'.edx': 'application/vnd.novadigm.edx',
	'.ext': 'application/vnd.novadigm.ext',
	'.odc': 'application/vnd.oasis.opendocument.chart',
	'.otc': 'application/vnd.oasis.opendocument.chart-template',
	'.odb': 'application/vnd.oasis.opendocument.database',
	'.odf': 'application/vnd.oasis.opendocument.formula',
	'.odft': 'application/vnd.oasis.opendocument.formula-template',
	'.odg': 'application/vnd.oasis.opendocument.graphics',
	'.otg': 'application/vnd.oasis.opendocument.graphics-template',
	'.odi': 'application/vnd.oasis.opendocument.image',
	'.oti': 'application/vnd.oasis.opendocument.image-template',
	'.odp': 'application/vnd.oasis.opendocument.presentation',
	'.otp': 'application/vnd.oasis.opendocument.presentation-template',
	'.ods': 'application/vnd.oasis.opendocument.spreadsheet',
	'.ots': 'application/vnd.oasis.opendocument.spreadsheet-template',
	'.odt': 'application/vnd.oasis.opendocument.text',
	'.odm': 'application/vnd.oasis.opendocument.text-master',
	'.ott': 'application/vnd.oasis.opendocument.text-template',
	'.oth': 'application/vnd.oasis.opendocument.text-web',
	'.xo': 'application/vnd.olpc-sugar',
	'.dd2': 'application/vnd.oma.dd2+xml',
	'.oxt': 'application/vnd.openofficeorg.extension',
	'.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'.sldx': 'application/vnd.openxmlformats-officedocument.presentationml.slide',
	'.ppsx': 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
	'.potx': 'application/vnd.openxmlformats-officedocument.presentationml.template',
	'.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'.xltx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
	'.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'.dotx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
	'.mgp': 'application/vnd.osgeo.mapguide.package',
	'.dp': 'application/vnd.osgi.dp',
	'.pdb': 'application/vnd.palm',
	'.paw': 'application/vnd.pawaafile',
	'.str': 'application/vnd.pg.format',
	'.ei6': 'application/vnd.pg.osasli',
	'.efif': 'application/vnd.picsel',
	'.wg': 'application/vnd.pmi.widget',
	'.plf': 'application/vnd.pocketlearn',
	'.pbd': 'application/vnd.powerbuilder6',
	'.box': 'application/vnd.previewsystems.box',
	'.mgz': 'application/vnd.proteus.magazine',
	'.qps': 'application/vnd.publishare-delta-tree',
	'.ptid': 'application/vnd.pvi.ptid1',
	'.qxd': 'application/vnd.quark.quarkxpress',
	'.bed': 'application/vnd.realvnc.bed',
	'.mxl': 'application/vnd.recordare.musicxml',
	'.musicxml': 'application/vnd.recordare.musicxml+xml',
	'.cryptonote': 'application/vnd.rig.cryptonote',
	'.cod': 'application/vnd.rim.cod',
	'.rm': 'application/vnd.rn-realmedia',
	'.link66': 'application/vnd.route66.link66+xml',
	'.st': 'application/vnd.sailingtracker.track',
	'.see': 'application/vnd.seemail',
	'.sema': 'application/vnd.sema',
	'.semd': 'application/vnd.semd',
	'.semf': 'application/vnd.semf',
	'.ifm': 'application/vnd.shana.informed.formdata',
	'.itp': 'application/vnd.shana.informed.formtemplate',
	'.iif': 'application/vnd.shana.informed.interchange',
	'.ipk': 'application/vnd.shana.informed.package',
	'.twd': 'application/vnd.simtech-mindmapper',
	'.mmf': 'application/vnd.smaf',
	'.teacher': 'application/vnd.smart.teacher',
	'.sdkm': 'application/vnd.solent.sdkm+xml',
	'.dxp': 'application/vnd.spotfire.dxp',
	'.sfs': 'application/vnd.spotfire.sfs',
	'.sdc': 'application/vnd.stardivision.calc',
	'.sda': 'application/vnd.stardivision.draw',
	'.sdd': 'application/vnd.stardivision.impress',
	'.smf': 'application/vnd.stardivision.math',
	'.sdw': 'application/vnd.stardivision.writer',
	'.sgl': 'application/vnd.stardivision.writer-global',
	'.sm': 'application/vnd.stepmania.stepchart',
	'.sxc': 'application/vnd.sun.xml.calc',
	'.stc': 'application/vnd.sun.xml.calc.template',
	'.sxd': 'application/vnd.sun.xml.draw',
	'.std': 'application/vnd.sun.xml.draw.template',
	'.sxi': 'application/vnd.sun.xml.impress',
	'.sti': 'application/vnd.sun.xml.impress.template',
	'.sxm': 'application/vnd.sun.xml.math',
	'.sxw': 'application/vnd.sun.xml.writer',
	'.sxg': 'application/vnd.sun.xml.writer.global',
	'.stw': 'application/vnd.sun.xml.writer.template',
	'.sus': 'application/vnd.sus-calendar',
	'.svd': 'application/vnd.svd',
	'.sis': 'application/vnd.symbian.install',
	'.xsm': 'application/vnd.syncml+xml',
	'.bdm': 'application/vnd.syncml.dm+wbxml',
	'.xdm': 'application/vnd.syncml.dm+xml',
	'.tao': 'application/vnd.tao.intent-module-archive',
	'.tmo': 'application/vnd.tmobile-livetv',
	'.tpt': 'application/vnd.trid.tpt',
	'.mxs': 'application/vnd.triscape.mxs',
	'.tra': 'application/vnd.trueapp',
	'.ufd': 'application/vnd.ufdl',
	'.utz': 'application/vnd.uiq.theme',
	'.umj': 'application/vnd.umajin',
	'.unityweb': 'application/vnd.unity',
	'.uoml': 'application/vnd.uoml+xml',
	'.vcx': 'application/vnd.vcx',
	'.vsd': 'application/vnd.visio',
	'.vis': 'application/vnd.visionary',
	'.vsf': 'application/vnd.vsf',
	'.wbxml': 'application/vnd.wap.wbxml',
	'.wmlc': 'application/vnd.wap.wmlc',
	'.wmlsc': 'application/vnd.wap.wmlscriptc',
	'.wtb': 'application/vnd.webturbo',
	'.nbp': 'application/vnd.wolfram.player',
	'.wpd': 'application/vnd.wordperfect',
	'.wqd': 'application/vnd.wqd',
	'.stf': 'application/vnd.wt.stf',
	'.xar': 'application/vnd.xara',
	'.xfdl': 'application/vnd.xfdl',
	'.hvd': 'application/vnd.yamaha.hv-dic',
	'.hvs': 'application/vnd.yamaha.hv-script',
	'.hvp': 'application/vnd.yamaha.hv-voice',
	'.osf': 'application/vnd.yamaha.openscoreformat',
	'.osfpvg': 'application/vnd.yamaha.openscoreformat.osfpvg+xml',
	'.saf': 'application/vnd.yamaha.smaf-audio',
	'.spf': 'application/vnd.yamaha.smaf-phrase',
	'.cmp': 'application/vnd.yellowriver-custom-menu',
	'.zir': 'application/vnd.zul',
	'.zaz': 'application/vnd.zzazz.deck+xml',
	'.vxml': 'application/voicexml+xml',
	'.wgt': 'application/widget',
	'.hlp': 'application/winhlp',
	'.wsdl': 'application/wsdl+xml',
	'.wspolicy': 'application/wspolicy+xml',
	'.7z': 'application/x-7z-compressed',
	'.abw': 'application/x-abiword',
	'.ace': 'application/x-ace-compressed',
	'.aab': 'application/x-authorware-bin',
	'.aam': 'application/x-authorware-map',
	'.aas': 'application/x-authorware-seg',
	'.bcpio': 'application/x-bcpio',
	'.torrent': 'application/x-bittorrent',
	'.bz': 'application/x-bzip',
	'.bz2': 'application/x-bzip2',
	'.vcd': 'application/x-cdlink',
	'.chat': 'application/x-chat',
	'.pgn': 'application/x-chess-pgn',
	'.cpio': 'application/x-cpio',
	'.csh': 'application/x-csh',
	'.deb': 'application/x-debian-package',
	'.dir': 'application/x-director',
	'.wad': 'application/x-doom',
	'.ncx': 'application/x-dtbncx+xml',
	'.dtb': 'application/x-dtbook+xml',
	'.res': 'application/x-dtbresource+xml',
	'.dvi': 'application/x-dvi',
	'.bdf': 'application/x-font-bdf',
	'.gsf': 'application/x-font-ghostscript',
	'.psf': 'application/x-font-linux-psf',
	'.otf': 'application/x-font-otf',
	'.pcf': 'application/x-font-pcf',
	'.snf': 'application/x-font-snf',
	'.ttf': 'application/x-font-ttf',
	'.pfa': 'application/x-font-type1',
	'.woff': 'application/x-font-woff',
	'.woff2': 'application/font-woff2', 
	'.spl': 'application/x-futuresplash',
	'.gnumeric': 'application/x-gnumeric',
	'.gtar': 'application/x-gtar',
	'.hdf': 'application/x-hdf',
	'.jnlp': 'application/x-java-jnlp-file',
	'.latex': 'application/x-latex',
	'.prc': 'application/x-mobipocket-ebook',
	'.application': 'application/x-ms-application',
	'.wmd': 'application/x-ms-wmd',
	'.wmz': 'application/x-ms-wmz',
	'.xbap': 'application/x-ms-xbap',
	'.mdb': 'application/x-msaccess',
	'.obd': 'application/x-msbinder',
	'.crd': 'application/x-mscardfile',
	'.clp': 'application/x-msclip',
	'.exe': 'application/x-msdownload',
	'.mvb': 'application/x-msmediaview',
	'.wmf': 'application/x-msmetafile',
	'.mny': 'application/x-msmoney',
	'.pub': 'application/x-mspublisher',
	'.scd': 'application/x-msschedule',
	'.trm': 'application/x-msterminal',
	'.wri': 'application/x-mswrite',
	'.nc': 'application/x-netcdf',
	'.p12': 'application/x-pkcs12',
	'.p7b': 'application/x-pkcs7-certificates',
	'.p7r': 'application/x-pkcs7-certreqresp',
	'.rar': 'application/x-rar-compressed',
	'.sh': 'application/x-sh',
	'.shar': 'application/x-shar',
	'.swf': 'application/x-shockwave-flash',
	'.xap': 'application/x-silverlight-app',
	'.sit': 'application/x-stuffit',
	'.sitx': 'application/x-stuffitx',
	'.sv4cpio': 'application/x-sv4cpio',
	'.sv4crc': 'application/x-sv4crc',
	'.tar': 'application/x-tar',
	'.tcl': 'application/x-tcl',
	'.tex': 'application/x-tex',
	'.tfm': 'application/x-tex-tfm',
	'.texinfo': 'application/x-texinfo',
	'.ustar': 'application/x-ustar',
	'.src': 'application/x-wais-source',
	'.der': 'application/x-x509-ca-cert',
	'.fig': 'application/x-xfig',
	'.xpi': 'application/x-xpinstall',
	'.xdf': 'application/xcap-diff+xml',
	'.xenc': 'application/xenc+xml',
	'.xhtml': 'application/xhtml+xml',
	'.xml': 'application/xml',
	'.dtd': 'application/xml-dtd',
	'.xop': 'application/xop+xml',
	'.xslt': 'application/xslt+xml',
	'.xspf': 'application/xspf+xml',
	'.mxml': 'application/xv+xml',
	'.yang': 'application/yang',
	'.yin': 'application/yin+xml',
	'.zip': 'application/zip',
	'.adp': 'audio/adpcm',
	'.au': 'audio/basic',
	'.mid': 'audio/midi',
	'.mp4a': 'audio/mp4',
	'.mpga': 'audio/mpeg',
	'.oga': 'audio/ogg',
	'.uva': 'audio/vnd.dece.audio',
	'.eol': 'audio/vnd.digital-winds',
	'.dra': 'audio/vnd.dra',
	'.dts': 'audio/vnd.dts',
	'.dtshd': 'audio/vnd.dts.hd',
	'.lvp': 'audio/vnd.lucent.voice',
	'.pya': 'audio/vnd.ms-playready.media.pya',
	'.ecelp4800': 'audio/vnd.nuera.ecelp4800',
	'.ecelp7470': 'audio/vnd.nuera.ecelp7470',
	'.ecelp9600': 'audio/vnd.nuera.ecelp9600',
	'.rip': 'audio/vnd.rip',
	'.weba': 'audio/webm',
	'.aac': 'audio/x-aac',
	'.aif': 'audio/x-aiff',
	'.m3u': 'audio/x-mpegurl',
	'.wax': 'audio/x-ms-wax',
	'.wma': 'audio/x-ms-wma',
	'.ram': 'audio/x-pn-realaudio',
	'.rmp': 'audio/x-pn-realaudio-plugin',
	'.wav': 'audio/x-wav',
	'.cdx': 'chemical/x-cdx',
	'.cif': 'chemical/x-cif',
	'.cmdf': 'chemical/x-cmdf',
	'.cml': 'chemical/x-cml',
	'.csml': 'chemical/x-csml',
	'.xyz': 'chemical/x-xyz',
	'.bmp': 'image/bmp',
	'.cgm': 'image/cgm',
	'.g3': 'image/g3fax',
	'.gif': 'image/gif',
	'.ief': 'image/ief',
	'.jpeg': 'image/jpeg',
	'.jpg': 'image/jpeg',
	'.ktx': 'image/ktx',
	'.png': 'image/png',
	'.btif': 'image/prs.btif',
	'.svg': 'image/svg+xml',
	'.tiff': 'image/tiff',
	'.psd': 'image/vnd.adobe.photoshop',
	'.uvi': 'image/vnd.dece.graphic',
	'.sub': 'image/vnd.dvb.subtitle',
	'.djvu': 'image/vnd.djvu',
	'.dwg': 'image/vnd.dwg',
	'.dxf': 'image/vnd.dxf',
	'.fbs': 'image/vnd.fastbidsheet',
	'.fpx': 'image/vnd.fpx',
	'.fst': 'image/vnd.fst',
	'.mmr': 'image/vnd.fujixerox.edmics-mmr',
	'.rlc': 'image/vnd.fujixerox.edmics-rlc',
	'.mdi': 'image/vnd.ms-modi',
	'.npx': 'image/vnd.net-fpx',
	'.wbmp': 'image/vnd.wap.wbmp',
	'.xif': 'image/vnd.xiff',
	'.webp': 'image/webp',
	'.ras': 'image/x-cmu-raster',
	'.cmx': 'image/x-cmx',
	'.fh': 'image/x-freehand',
	'.ico': 'image/x-icon',
	'.pcx': 'image/x-pcx',
	'.pic': 'image/x-pict',
	'.pnm': 'image/x-portable-anymap',
	'.pbm': 'image/x-portable-bitmap',
	'.pgm': 'image/x-portable-graymap',
	'.ppm': 'image/x-portable-pixmap',
	'.rgb': 'image/x-rgb',
	'.xbm': 'image/x-xbitmap',
	'.xpm': 'image/x-xpixmap',
	'.xwd': 'image/x-xwindowdump',
	'.eml': 'message/rfc822',
	'.igs': 'model/iges',
	'.msh': 'model/mesh',
	'.dae': 'model/vnd.collada+xml',
	'.dwf': 'model/vnd.dwf',
	'.gdl': 'model/vnd.gdl',
	'.gtw': 'model/vnd.gtw',
	'.mts': 'model/vnd.mts',
	'.vtu': 'model/vnd.vtu',
	'.wrl': 'model/vrml',
	'.ics': 'text/calendar',
	'.css': 'text/css',
	'.csv': 'text/csv',
	'.html': 'text/html',
	'.n3': 'text/n3',
	'.txt': 'text/plain',
	'.dsc': 'text/prs.lines.tag',
	'.rtx': 'text/richtext',
	'.sgml': 'text/sgml',
	'.tsv': 'text/tab-separated-values',
	'.t': 'text/troff',
	'.ttl': 'text/turtle',
	'.uri': 'text/uri-list',
	'.curl': 'text/vnd.curl',
	'.dcurl': 'text/vnd.curl.dcurl',
	'.scurl': 'text/vnd.curl.scurl',
	'.mcurl': 'text/vnd.curl.mcurl',
	'.fly': 'text/vnd.fly',
	'.flx': 'text/vnd.fmi.flexstor',
	'.gv': 'text/vnd.graphviz',
	'.3dml': 'text/vnd.in3d.3dml',
	'.spot': 'text/vnd.in3d.spot',
	'.jad': 'text/vnd.sun.j2me.app-descriptor',
	'.wml': 'text/vnd.wap.wml',
	'.wmls': 'text/vnd.wap.wmlscript',
	'.s': 'text/x-asm',
	'.c': 'text/x-c',
	'.f': 'text/x-fortran',
	'.p': 'text/x-pascal',
	'.java': 'text/x-java-source',
	'.etx': 'text/x-setext',
	'.uu': 'text/x-uuencode',
	'.vcs': 'text/x-vcalendar',
	'.vcf': 'text/x-vcard',
	'.3gp': 'video/3gpp',
	'.3g2': 'video/3gpp2',
	'.h261': 'video/h261',
	'.h263': 'video/h263',
	'.h264': 'video/h264',
	'.jpgv': 'video/jpeg',
	'.jpm': 'video/jpm',
	'.mj2': 'video/mj2',
	'.mp4': 'video/mp4',
	'.mpeg': 'video/mpeg',
	'.ogv': 'video/ogg',
	'.qt': 'video/quicktime',
	'.uvh': 'video/vnd.dece.hd',
	'.uvm': 'video/vnd.dece.mobile',
	'.uvp': 'video/vnd.dece.pd',
	'.uvs': 'video/vnd.dece.sd',
	'.uvv': 'video/vnd.dece.video',
	'.fvt': 'video/vnd.fvt',
	'.mxu': 'video/vnd.mpegurl',
	'.pyv': 'video/vnd.ms-playready.media.pyv',
	'.uvu': 'video/vnd.uvvu.mp4',
	'.viv': 'video/vnd.vivo',
	'.webm': 'video/webm',
	'.f4v': 'video/x-f4v',
	'.fli': 'video/x-fli',
	'.flv': 'video/x-flv',
	'.m4v': 'video/x-m4v',
	'.asf': 'video/x-ms-asf',
	'.wm': 'video/x-ms-wm',
	'.wmv': 'video/x-ms-wmv',
	'.wmx': 'video/x-ms-wmx',
	'.wvx': 'video/x-ms-wvx',
	'.avi': 'video/x-msvideo',
	'.movie': 'video/x-sgi-movie',
	'.ice': 'x-conference/x-cooltalk',
	'.par': 'text/plain-bas',
	'.yaml': 'text/yaml'
}