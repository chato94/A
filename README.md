# A[ Server]
This is a simple static file server powered by Node.js

## Main Description
It is the refactored^2 version of A Server 3.1, which was coded using Dropbox
and a lot of patience. Hopefully, this server will simply be a plug and play
server like WAMP, meaning that it will serve a web page by simply typing in
the path to the file relative to the path of the index.js file, then sending
all dependencies for the page correctly, and serving a 404 page for a non-
existing page, directory, or file of any kind (only limited by MIME types). 

## Future Development
Hopefully with more development, it will reach the point where it will have
easy dynamic page serving support, similar to JsCon's universal support of any
JavaScript function, all with the hopes of being a great tool to use to host
pages for any purpose necessary on a home network as an intranet. I am also 
hoping to add database support, maybe not necessarily through SQL or any variation
of that. I have already implemented the SHA-256 algorithm in JavaScript (mostly
for learning purposes because the hashing libraries are *plentiful*), so
at least a small amount of security will be possible.

## Past Implementations
All previous solutions to the static file server problem focused on calculating
the path to the file on the machine from the request URL from the client. While
this solution worked for **A Server 2.0**, it made it extremely cumbersome to
add more dynamic functionality to the server. I am currently taking a new approach
to the problem and using the `child_process` to simply poll the directory every
second or so to detect file changes, and then just have the list ready to go
in the parent process to simplify URL decoding and exception-making. This will
come at the cost of hogging up the hard drive, but with faster solid-state drives,
this should not be a huge problem (unless of course you decide to use hundreds of
thousands of small files). Previous implementations were also limited for the
same reason that request URLs were being dynamically processed every time because
files had to have file extensions (and folders could not). All in all, it was a
frenzy of code to check for errors and what-not, almost as bad as `C`.

## Instructions
*Assuming that Node is already installed on the machine and all paths are correctly
set up*

1. Switch to the directory containin the index.js file and do `node index.js`
2. Add files and folders to serve and enjoy the new Intranet on your network.
  * You still have to have an HTML file in the directory
    * It takes priority for an `index.html` file, then serves the first .html file it finds