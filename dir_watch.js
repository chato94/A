/**
 * Polls the server directory every second to detect a file change independently
 * of the parent process.
 *
 * Sends a string of double quote-space separated paths to the parent process
 * upon detection of a file change. Note that this does not scale well with
 * many files to keep track of.
 */
var fs = require ('fs'), paths = bfs (__dirname), S = require ('os').platform ().match (/^win\d+?/)? '\\' : '/';
paths.sort ();
process.send (concat (paths));

setInterval (function () {
	var updatedPaths = bfs (__dirname);
	updatedPaths.sort ();

	if (updatedPaths.length !== paths.length) {
		paths = updatedPaths;
		process.send (concat (updatedPaths));
	} else {
		for (var i = 0; i < paths.length; i++) {
			if (paths[i] !== updatedPaths[i]) {
				paths = updatedPaths;
				process.send (concat (updatedPaths));
				break;
			}
		}
	}

}, 1000);

function concat (array) {return ['Update Directory', '"' + array.join ('" "') + '"'];}

function bfs (dirStr) {
	var directories = new Queue ().push (dirStr), finalDirs = [];

	function bfsWorker (path) {
		try {
			var directory = fs.readdirSync (path);
			if (directory.length) {
				for (var i = 0; i < directory.length; i++) directories.push (path + S + directory[i]);
			} else {
				finalDirs.push (path);
			} 
		} catch (error) {
			if (error.code === 'ENOTDIR') {
				finalDirs.push (path);
			} else {
				console.log ('FATAL ERROR: SOMETHING BAD HAPPENED\n');
				console.log (error);
			}
		}

		if (directories.size ()) bfsWorker (directories.pop ().val ());
	}

	bfsWorker (directories.pop ().val ());
	return finalDirs;
}

function Queue () {
	var queue = [], popValue;
	this.size = function () {return queue.length;};
	this.push = function (me) {queue.push (me); return this;};
	this.pop = function () {popValue = queue.splice (0, 1)[0]; return this;};
	this.val = function () {return popValue;};
	this.array = function () {return queue;};
	this.toString = function () {var s = ''; for (var i = 0; i < queue.length; i++) s += i > 1? ', ' + queue[i] : i === 1? '| ' + queue[i] : queue[i]; return '<' + s + '>';};
}