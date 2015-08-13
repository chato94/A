# A[ Server]
This is a static file server that is powered by Node.js, meaning that it serves files to any and all devices that are on the same network as the hosting machine. It functions similarly to WAMP in that it's as simple as dragging and dropping all necessary dependencies and it works, but it also has its potential quirks and naming restrictions. This is an adequate solution for users looking for a simple way to serve files on their local network and not just their machine.

## Instructions
Please note that these instructions assume that Node.js is already properly installed on the machine, and that users know how to run any JavaScript using command lines. If not, these pages give detailed instructions for [Windows](http://blog.teamtreehouse.com/install-node-js-npm-windows), [Linux](http://blog.teamtreehouse.com/install-node-js-npm-linux), and [Mac](http://blog.teamtreehouse.com/install-node-js-npm-mac). All directories described assume that the user is in the folder that contains the `index.js` file that comes with the server. Note that Windows uses `\` instead of `/` to separate directories.

### Static File Serving Instructions
* Add all files and directories to serve as-is into the `/static` directory.
  * Each website must have its own folder inside the `/static` directory
  * The server will automatically search for and serve an `index.html` file in each directory, and then it will serve the first HTML file that it finds.
    * There are **no guarantees** for the server to find one HTML file over another in any order

* Users of the static file server must interact with 3 main folders, each for different website types. These are:
  * `/static`
    * Contains all static directories and files

  * `/init`
    * Contains the homepage of the static file server (when the URL is `/`).
    * The contents of this folder are 100% customizable, except that this directory **must** contain an `index.html` file, or it will serve the contents of the `/404` directory.

  * `/404`
    * Contains the 404 error page for when users request a page that does not exist
    * The contents of this folder are also 100% customizable, except that, like `/init`, it **must** contain an `index.html` file, or it will serve the contents of `/dependencies/500.html`
      * `/dependencies/500.html` must be present in its current location (the server will not even start without it), but it is fully customizable as well.

* Because of the way that the server searches for files, there are potential naming restrictions that must be taken into account. The following is the hierarchy with which the server attempts to find a file with the URL that a user types after the IP address of the navigation bar of their browser. Use it to avoid any potential conflicts (none have been found to this date, but unit testing has not been conducted in this area):
  1. The server first attempts to perfectly match the URL after the IP address with a path in one of `/static`, `/init`, or `/404` directories. For example, the server would attempt to find `http://192.168.1.11/something/somethingelse/file.extension` exactly at `/static/something/somethingelse/file.extension`. If this fails then...

  2. Attempts to serve a dependency (CSS, JavaScript, etc.) from the last folder that contained a successfully loaded HTML file. For example, this means that if the last successfully loaded HTML file for a user is located at `/static/website` and the user is requesting `/javascript/dependency.js`, the server would search for `/static/website/javascript/dependency.js`. If this fails then...

  3. Attempts to serve the requested URL with `/index.html` attached to the end of it. For example, if the user requests `/init/this/path/to/website`, the server searches for `/init/this/path/to/website/index.html`. If this fails then...

  4. Attempts to serve the requested URL with any sort of HTML file attached to the end of it. Meaning that if, for example, the website is the `/static/website` directory, and it contains exactly one file called `website.html`, it will serve `/static/website/website.html`. If this fails then...

  5. It servers the HTML file and dependencies in the `/404` directory.

* The `index.js` file has support for 2 command line arguments, each separated with a space (or more, but are still counted as one argument)
  * `-v[erbose]`: logs additional information about how each request is being processed to the terminal window

  * `-d[ebug]`: logs internal variable values for each request, along with error stacks that might mysteriously arise

  * None of the mentioned arguments can currently be changed during run time, only during initialization

### User Database Documentation
For users that know about POST requests via the `form` HTML tag (or `AJAX`), the server also has basic capabilities to create user accounts for websites.
* All database calls must be done using POST, must conform to the [standard query string](https://en.wikipedia.org/wiki/Query_string), and must have the request URL in the format `WEBSITE`.`COMMAND`.`dbaccess`
  * `WEBSITE` is the directory that will hold the users for `WEBSITE`

    * For example, `Google.COMMAND.dbaccess` will run `COMMAND` for users in `/dependencies/db/Google/...`
  
    * This part of the URL (**and usernames**) are stripped of all characters that are not **A-Z**, **a-z**, **0-9**, **underscores**, or **hyphens** (in regex, `/^A-Z0-9_\-/gi`), before they are stored on the server
      * For example, `#WEBSI!TE` and `@WEB&SIT^E` will both be treated internally as `WEBSITE`, thus create unexpected errors if applications rely on the differences.

  * `COMMAND` is one of 8 commands that can be called for data manipulation. All `dbaccess` POST commands (except for the extraction commands) will return a `JSON` formatted string with one value called `"label"`, which will determine if the command went through as expected. The following are all valid commands, all of which are case-insentitive (usernames are stripped of all characters like `WEBSITE`):
    * `createuser`
      * Required Query String Keys:
        * `username` or `usr` = name of the user account
        * `password` or `pass` = password to access the content of the user account

    * `deleteuser`
      * Required Query String Keys:
        * `username` or `usr` = name of the user account
        * `password` or `pass` = password to verify owner and delete the account

    * `changename`
      * Required Query String Keys:
        * `username` or `usr` = name of the user account
        * `password` or `pass` = password modify the account name
        * `newusername` or `newusr` or `nusr` = the new name of the account

    * `changepassword`
      * Required Query String Keys:
        * `username` or `usr` = name of the user account
        * `password` or `pass` = password to access the content of the user account
        * `newpassword` or `npass` = new password to verify the account

    * `extractalldata`
      * Required Query String Keys:
        * `username` or `usr` = name of the user account
        * `password` or `pass` = password to access the content of the user account
      * Returns a `JSON` string with the usual `"label"` key for the status, but also a `"content"` key for the content extracted in the form of another `JSON` object string
        * ex.) `{"label": "OK", "content": {"key0": "val0", "key1": "val1", ...}}`

    * `extractdata`
      * Required Query String Keys:
        * `username` or `usr` = name of the user account
        * `password` or `pass` = password to access the content of the user account
        * `datakey` or `dkey` = key of the value to pull from the account (case insensitive)
      * Returns a `JSON` string in the same format as `extractalldata`, except the `"content"` key will only have the `datakey` (or `dkey`) key-value pair

    * `storealldata`
      * Required Query String Keys:
        * `username` or `usr` = name of the user account
        * `password` or `pass` = password to access the content of the user account
        * Any number of key-value query string keys. All will be stored to the account. Keys are always case insensitive, but they must not match any of the following:
          * `newpassword`, `npass`, `newusername`, `newusr`, `nusr`, `datakey`, or `dkey`

    * `storedata`
      * Required Query String Keys:
        * `username` or `usr` = name of the user account
        * `password` or `pass` = password to access the content of the user account
        * `datakey` or `dkey` = key of the value to store in the account (case insensitive)
        * `datakeyval` or `dkval` = value to store with `datakey` (or `dkey`)

  * `dbaccess` identifies the URL as a database command. More dynamic POST methods may or may not be coming soon

  * There are 6 `"label"` values to potentially keep track of in the returned `JSON` string:
    * `OK`   - The command functioned as expected
    * `BAD`  - The command failed because the password is bad, or requested the `hash` or `salt` values
    * `DNE`  - The command failed because the account does not exist
    * `AE`   - The account creation failed because the new username already exists
    * `ERR`  - The server had an unexpected error
    * `CDNE` - The command does not exist in the current configuration of `database.js`

## Future Development
Once user database support runs reliably and data-race free, and once there exists a way to wrap the server in an executable file, there may not be any more future development for this project, except for potentially figuring out a way to add dynamic page support. There exist many other libraries that ease this process, mainly `Express`, but should support for dynamic page generation be included, it would most likely not use `Express` or any other large libraries like that because of potential unnecessary source overhead and weeks of documentation-reading to save minutes worth of work.

## Project History and Past Development
For those interested in how this project came about, it started with the need to test a website on iOS devices. Searching for "how to make an intranet" brings up a bunch of useless jargon, except for maybe WAMP and WAMP equivalents, but the problem is that they don't have easy ways to go from `localhost` to being broadcast on the router for multiple devices to see. Thus came *A Server 2.0*, the first successful iteration of the *A Server* project that actually ran on Wi-Fi (*A Server 1.0* was an unsuccessful hodgepodge of libraries and Stack Overflow code). There was another iteration of the *A Server* project called *A Server 3.0*, which was basically a shorter, re-factored version of *A Server 2.0*, but both 2.0 and 3.0 were based on intense processing of the incoming URL to figure out what to read from the hard drive. It operated on a similar hierarchy, meaning that the exact path was checked first, then merged with the previous served HTML file, etc., but it turned out that it would be much easier, effective, and efficient to just have a list of all valid paths at any given time paired with logarithmic binary search for speed, and thus began the complete re-write of the server.