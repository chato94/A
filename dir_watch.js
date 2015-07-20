/**
 * Polls the server directory every second to detect a file change independently
 * of the parent process.
 *
 * Sends a string of double quote-space separated paths to the parent process
 * upon detection of a file change. Note that this does not scale well with
 * many files to keep track of.
 */
var fs = require ('fs'), S = require ('os').platform ().match (/^win\d+?/)? '\\' : '/', allPaths = bfs (__dirname), SECONDS = 0.5, p = process;
console.log ('\n"dir_watch.js" child process started! S: ' + S);

allPaths.sort ();
process.send (concat (allPaths));

updatePaths ();

function updatePaths () {
	var d = bfs (__dirname);

	// Small optimization for speedup
	d.length !== allPaths.length? _true () : _false ();

	function _true () {allPaths = d; p.send (concat (d));}
	function _false () {d.sort (); for (var i = 0; i < d.length; i++) if (allPaths[i] !== d[i]) {allPaths = d; p.send (concat (d)); break;}}

	setTimeout (updatePaths, SECONDS * 1000);
}

/* Called before process.send to process the list of files and directories to avoid blockage in the parent process */
function concat (array) {
	// Use a new array to avoid mutation errors that cause the directory to be read at every tick of this function
	var newArray = [];

	// Remove the path leading to index.js for easier reading in the parent function
	for (var i = 0; i < array.length; i++) newArray.push (array[i].replace (new RegExp ('^' + deRegEx (__dirname)), '').replace (/\\/g, '/'));
	return ['Update Directory', '"' + newArray.join ('" "') + '"'];
}

/* Recursive breadth-first search that constructs a list of all files relative to __dirname */
function bfs (dirStr) {
	var dirs = [dirStr], all = [], dir;

	function bfsWorker (path) {
		try {
			dir = fs.readdirSync (path);
			dir.length? (function () {for (var i = 0; i < dir.length; i++) dirs.push (path + S + dir[i]);})() : all.push (path + ':DIRECTORY');
		} catch (error) {
			error.code === 'ENOTDIR'? all.push (path + ':FILE') : console.log ('UNKNOWN ERROR OCCURRED:\n' + error + '\n');
		} 

		if (dirs.length) bfsWorker (dirs.splice (0, 1)[0]);
	}

	bfsWorker (dirs.splice (0, 1)[0]);
	return all;
}

/* Used to cleanly dynamically generate RegEx from a string literal using new RegExp */
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
