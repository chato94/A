# A[ Server]
This is a static file server that is powered by Node.js, meaning that it serves files to any and all devices that are on the same network as the hosting machine. It functions similarly to **WAMP** in that it's as simple as dragging and dropping all necessary dependencies and it works, but it also has its potential quirks, naming restrictions, and overall, naïve approaches to web standards that have been solved by *much* smarter people than myself.

## Instructions
Please note that these instructions assume that Node.js is already properly installed on the machine, and that you know how to run any JavaScript using command lines. If not, check out these pages for instructions for [Windows](http://blog.teamtreehouse.com/install-node-js-npm-windows), [Linux](http://blog.teamtreehouse.com/install-node-js-npm-linux), and [Mac](http://blog.teamtreehouse.com/install-node-js-npm-mac). All directories described assume that you're in the folder that contains the `index.js` file that comes with the server.

### Static File Serving Instructions
* Add all files and directories that you want to serve into the `/static` directory.
  * Each website must have its own folder inside the `/static` directory
  * The server will automatically search for and serve an `index.html` file in each directory, and then it will serve the first HTML file that it finds.
    * There are **no guarantees** for the server to find one HTML file over another in any order
* The static file server has 3 main folders, each for different website types. These are:
  * `/static`
  * `/init`
    * The contents of this folder are 100% customizable, except that this directory **must** contain an `index.html` file, or it will serve the contents of `/404`
  * `/404`
    * The contents of this folder are also 100% customizable, except that, like `/init`, it **must** contain an `index.html` file, or it will serve the contents of `/dependencies/500.html`
      * `/dependencies/500.html` must be present in its current location (the server will not even start without it), but it is fully customizable as well.
* Because of the way that the server looks for files, there are naming restrictions that must be taken into account. The following is the hierarchy with which the server attempts to find a file with the URL that a user types after the IP address of the navigation bar of their browser:
  1. Attempts to match the URL after the IP address (for example, `/something/somethingelse/index.html`) perfectly with a path in one of `/static`, `/init`, or `/404` (for example, `/static/something/somethingelse/index.html`). Any other path found in another folder with this name will never be seen. If this fails then...
  2. Attempts to serve a dependency (CSS, JavaScript, etc.) from the last folder that contained a successfully loaded HTML file. Meaning that if the last successfully loaded HTML file is located at, for example, `/static/website` and the user is requesting, for example, `/javascript/dependency.js`, the server searches for `/static/website/javascript/dependency.js`. If this fails then...
  3. Attempts to serve the requested URL with `/index.html` attached to the end of it. For example, if the user requests `/init/this/path/to/website`, the server searches for `/init/this/path/to/website/index.html`. If this fails then...
  4. Attempts to serve the requested URL with any sort of HTML file attached to the end of it. Meaning that if, for example, the website is the `/static/website` directory, and it contains exactly one file called `website.html`, it will serve `/static/website/website.html`. If this fails then...
  5. It servers the HTML file and dependencies in the `/404` directory.
* The `index.js` file has support for 2 command line arguments, each separated with a space (or more, but are still counted as one argument)
  * -v[erbose]: logs additional information about how each request is being processed to the terminal window
  * -d[ebug]: logs internal variable values for each request, along with error stacks that might mysteriously arise
  * None of the mentioned arguments can currently be changed during run time, only during initialization

### User Database Documentation
For more advanced users that didn't need the explanations above and know about POST requests via the `form` HTML tag (or `AJAX`), the server also has very basic capabilities to create user accounts for your website.

TODO: Add documentation

## Future Development
Once user database support runs reliably and data-race free, there may not be any more future development for this project, except for potentially figuring out a way to add dynamic page support. There exist many other libraries that ease this process, mainly `Express`, but if I were to include support for dynamic page generation, I would not want to use `Express` or any other large libraries like that because of potential unnecessary source overhead and weeks of documentation-reading to save minutes worth of work. Most likely though, this project will be wrapped in an executable file for the sake of simplicity on the user end.

## Project History and Past Development
For those *potentially* mildly interested in how this project came about, it started with the need to test a website that I was developing on iOS devices. Searching for "how to make an intranet" brings up a bunch of useless jargon, except for maybe WAMP and WAMP equivalents, but the problem is that they don't have easy ways to go from `localhost` to being broadcast on the router. Thus came *A Server 2.0*, the first successful iteration of the *A Server* project that actually ran on Wi-Fi (before that, I had a complete and utter failure not even worth mentioning). There was another iteration of the *A Server* project called *A Server 3.0*, but both 2.0 and 3.0 were based on intense processing of the incoming URL to figure out what to read from the hard drive. It operated on a similar hierarchy, meaning that the exact path was checked first, then merged with the previous served HTML file, etc., but I realized that it would be much easier (and less CPU intensive) to just have a list of all valid paths at any given time, and thus began the complete re-write of the server. With all of that mentioned, I guess that this is better for people that don't know exactly what they are doing, but want to host files on their local network like on an Intranet.