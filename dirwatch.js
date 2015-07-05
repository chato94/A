/**
 * Polls the server directory every second to detect a file change independently
 * of the parent process.
 *
 * Sends a string of double quote-space separated paths to the parent process
 * upon detection of a file change. Note that this does not scale well with
 * many files to keep track of.
 */
var fs = require ('fs'), paths = [];

fs.readdir (__dirname, function (error, directory) {
	fif (error, function () {paths = '';}, false, bfs, []);
});

function bfs (dirStr) {
	var directories = new Queue ().push (dirStr), finalDirs = [];

	function bfsWorker () {

	}
}

function NAryTree (val, l) {
	var root = val, children = [], n = l;
	for (var i = 0; i < n; i++) children.push (null);

	this.isLeaf = function () {for (var i = 0; i < n; i++) if (children[i] !== null) return false; return true;};
	this.getChildrenArray = function () {return children;};
	this.getithChild = function (i) {return children[i];};
	this.N = function () {return n;};
	this.setithChild = function (i, toMe) {if (i < n) children[i] = toMe; return this;};
	this.setChildrenArray = function (toMe) {if (toMe.length === n) children = toMe; return this;};
	this.setN = function (l) {n = l; children = []; for (var i = 0; i < n; i++) children.push (null); return this;};
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

function Stack () {
	var stack = [], popValue;
	this.size = function () {return stack.length;};
	this.push = function (me) {stack.push (me); return this;};
	this.pop = function () {popValue = stack.splice[stack.length - 1, 1][0]; return this;};
	this.val = function () {return popValue;};
	this.toString = function () {var s = ''; for (var l = stack.length - 1, i = l; i >= 0; i--) s +=  i < l? i === l - 1? '| ' + stack[i] : ', ' + stack[i] : stack[i]; return '<' + s + '>';};
}

/* functional if -> alias for ternary operator --> ? */
function fif (c, T, t, F, f) {c? t? T.apply (T, t) : T () : f? F.apply (F, f) : F ();}