/**
 * Polls the server directory every second to detect a file change independently
 * of the parent process.
 *
 * Sends a string of double quote-space separated paths to the parent process
 * upon detection of a file change. Note that this does not scale well with
 * many files to keep track of.
 */
var fs = require ('fs'), S = require ('os').platform ().match (/^win\d+?/)? '\\' : '/', allPaths = bfs (__dirname), SECONDS = 1, p = process;
console.log ('\n"dir_watch.js" child process started! S: ' + S);

allPaths.sort ();
process.send (concat (allPaths));

setInterval (function () {
	var newPaths = bfs (__dirname);
	newPaths.sort ();

	if (newPaths.length !== allPaths.length) {
		console.log ('lengths don\'t match!: ' + newPaths.length + ' vs ' + allPaths.length);
		allPaths = newPaths;
		process.send (concat (newPaths));
	} else {
		for (var i = 0; i < allPaths.length; i++) {
			if (allPaths[i] !== newPaths[i]) {
				console.log ('not a match!: ' + allPaths[i] + ' vs ' + newPaths[i]);
				allPaths = newPaths;
				process.send (concat (newPaths));
				break;
			}
		}
	}
}, SECONDS * 1000);

function updatePaths () {
	var d = bfs (__dirname);
	d.sort ();

	d.length !== allPaths.length? _true () : _false ();

	function _true () {allPaths = d; p.send (concat (d));}
	function _false () {for (var i = 0; i < d.length; i++) if (allPaths[i] !== d[i]) {allPaths = d; p.send (concat (d)); break;}}
}

function concat (array) {
	var newArray = [];
	console.log ('concat called!');
	for (var i = 0; i < array.length; i++) newArray[i] = array[i].replace (new RegExp ('^' + deRegEx (__dirname)), '').replace (/\\/g, '/');
	return ['Update Directory', '"' + newArray.join ('" "') + '"'];
}

function bfs (dirStr) {
	var dirs = [dirStr], all = [];

	function bfsWorker (path) {
		try {
			var dir = fs.readdirSync (path);
			dir.length? (function () {for (var i = 0; i < dir.length; i++) dirs.push (path + S + dir[i]);})() : all.push (path + ':DIRECTORY');
		} catch (error) {
			error.code === 'ENOTDIR'? all.push (path + ':FILE') : console.log ('UNKNOWN ERROR OCCURRED:\n' + error + '\n');
		} 

		if (dirs.length) bfsWorker (dirs.splice (0, 1)[0]);
	}

	bfsWorker (dirs.splice (0, 1)[0]);
	return all;
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
