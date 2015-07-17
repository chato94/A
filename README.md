# A[ Server]
This is a simple static file server powered by Node.js. It is highly, highly *not* 
recommended to replace `express` for this, as `express` has a much wider range of
support, and more robust functionality. This is more for personal usage on a home 
network. Note that development of this static file server is still not yet fully
complete. There are a few functions left to write for a complete, basically functional
server, and many more still for dynamic features and database support. All in
due time, of course.

## Summary
It is the refactored<sup>2</sup> version of **A Server 3.1**, which was coded using
Dropbox and a lot of patience. Hopefully, this server will simply be a plug and play
server like **WAMP**, meaning that it will serve a web page by simply typing in the path
to the file relative to the path of the `index.js` file, then sending all dependencies
for the page correctly, and serving a 404 page for a non-existing page, directory, or
file of any kind (only limited by `MIME` types). 

## Future Development
Hopefully with more development, it will reach the point where it will have easy dynamic page
serving support, similar to JsCon's universal support of any JavaScript function (JsCon is a
website that I developed mainly to learn JavaScript, but also to debug JavaScript code), all
with the hopes of being a great tool to use to host pages for any purpose necessary on a home
network as an intranet. As described in the intro, I am also hoping to add database support,
maybe not necessarily through SQL or any variation of that. I have already implemented the 
SHA-256 algorithm in JavaScript (mostly for learningpurposes because Node.js already comes with
a more fully equiped `crypto` library), so at least a small amount of security will be possible.
In **A Server 2.0**, security had to be done from the client side, which resulted in slow 
processing. This can be fixed by using HTTPS instead, but then it wouldn't be free `:P`.

## Past Implementations
All previous solutions to the static file server problem focused on calculating
the path to the file on the machine from the request URL from the client. While
this solution worked for **A Server 2.0**, it made it extremely cumbersome to
add more dynamic functionality to the server. I am currently taking a new approach
to the problem and using the `child_process` to simply poll the directory every x
seconds (tbd) to detect file changes, and then just have the list ready to go
in the parent process to simplify URL decoding and exception-making. This will
come at the cost of hogging up the hard drive, but with faster solid-state drives,
this should not be a huge problem (unless of course you decide to use hundreds of
thousands of small files). Previous implementations were also limited for the
same reason that request URLs were being dynamically processed every time because
files had to have file extensions (and folders could not). All in all, it was a
frenzy of code to check for errors and what-not, almost as bad as `C`. As expected,
some old code made it to the new code, such as calculating the IP address of the
machine on the home network, but other than that, it has all been re-coded from
documentation, Stack Overflow, and scratch (no, not MIT's Scratch).

## Instructions
*These instructions assume that Node is already installed on the machine and all necessary paths are correctly configured.*

* Add all files and folders to serve in the same directory as the index.js file.
  * You still have to have an HTML file in the directory. If none is found, the 404 page is served.
    * It takes priority for an `index.html` file, then serves the first HTML file it finds. There are no guarantees that HTML files will be found in any specified order.

* Once ready to run, run the `index.js` file and from there, websites can be accessed from the IP address logged on the terminal's stdout.