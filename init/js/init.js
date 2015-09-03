// Data-race free solution to checking if all JavaScript dependencies have been loaded via AJAX
var deps = {jQuery: false, jQueryColor: false, mCustomScrollbar: false, keyPress: false}, onMobile = isMobile (), loadingIcon;

// Code to execute once the DOM has been parsed
ready (function () {
    var can = document.getElementById ('loading');
    can.width = window.innerWidth;
    can.height = window.innerHeight;

    loadingIcon = new SimpleLoadingIcon (can);
    var accountedFor = {jQuery: false, jQueryColor: false, mCustomScrollbar: false, keyPress: false, buildingWebsite: false};
    (function load () {
        if (deps.jQuery === 200 && !accountedFor.jQuery) {
            accountedFor.jQuery = true;
            loadingIcon.tick (46.2).draw ();
        }
        if (deps.jQueryColor === 200 && !accountedFor.jQueryColor) {
            accountedFor.jQueryColor = true;
            loadingIcon.tick (3.8).draw ();
        }
        if (deps.mCustomScrollbar === 200 && !accountedFor.mCustomScrollbar) {
            accountedFor.mCustomScrollbar = true;
            loadingIcon.tick (22.2).draw ();
        }
        if (deps.keyPress === 200 && !accountedFor.keyPress) {
            accountedFor.keyPress = true;
            loadingIcon.tick (7.8).draw ();
        }

        // Tick the loading icon regardless of new status change just in case of animation in progress
        loadingIcon.tick ().draw ();

        if (loadingIcon.percentage () === 80 && !accountedFor.buildingWebsite) {
            accountedFor.buildingWebsite = true;
            buildHomepage ();
        }
        
        // Request another frame for the loading icon if the percentage is not 100, or animate the entrance otherwise
        if (!loadingIcon.done ()) requestAnimationFrame (load);
        else animateEntrance ();
    })();

    // When the window is resized, resize the loading icon, or if that is finished, resize the content on the page
    addEvent (window, 'resize', function () {
        can.width = window.innerWidth;
        can.height = window.innerHeight;
        loadingIcon.updateRadius ();

        // Resize the homepage if it has been loaded
        if ($ && loadingIcon.percentage () >= 80) {
            if (!onMobile) {
                $documentationdiv.css ({height: (window.innerHeight - $headerdiv.outerHeight(true)), width: (window.innerWidth / 2) + 'px', verticalAlign: 'top'});
                $availablediv.css ({height: (window.innerHeight - $headerdiv.outerHeight(true) - $availablehead.outerHeight(true)), width: (window.innerWidth / 2) + 'px'});
                $documentationtabdiv.css ({height: $documentationdiv.outerHeight(true) - $availablehead.outerHeight(true)});

            }
        }
    });

    // Website clock and jQuery selector cache for resizing content on window resize
    var clock = new Clock (),
        $clock,
        $availablediv,
        $availablehead,
        $documentationdiv,
        $documentationtabdiv,
        $documentationhead,
        $documentationtitle,
        $staticentry,
        $headerdiv;

    // Updates the time of the clock every 1.5 seconds only if the clock and jQuery are present in the DOM
    function keepTime () {
        $clock.html (clock.tick ().time ());
        setTimeout (keepTime, 1500);
    }

    // Loads the necessary content and assembles the website behind the loading icon screen
    function buildHomepage () {
        // GET the list of static websites available at the time of call
        var staticWebsites = {'static': 'ERR'};
        (function () {
            var req = new window.XMLHttpRequest (), ASYNC = true;
            req.onreadystatechange = function () {
                if (req.readyState === 4 && req.status === 200) {
                    loadingIcon.tick (5).draw ();
                    staticWebsites = JSON.parse (req.responseText)['static'];
                }

                // Only build the body if the list has been returned, or erred
                if (req.readyState === 4) buildBody ();
            };

            req.open ('GET', 'static.directory', ASYNC);
            req.send ();
        })();

        // Builds the website using jQuery. This function assumes that staticWebsites has been determined
        function buildBody () {
            var $body = $('body'), 
                scrollbarOpts = {
                    theme: 'minimal-dark', 
                    scrollInertia: 256, 
                    advanced: {
                        updateOnContentResize: true, 
                        updateOnBrowserResize: true
                    }
                };

            // Add the div that will contain the title and the time at the top
            $body.append ('<div id="headerdiv"><img src="css/logo.svg" alt="a server" id="logosvg"/></div>');

            // Add the div that will contain documentation
            $body.append ('<div id="documentationdiv"></div>');

            // Add the div that will contain the available static websites
            $body.append ('<div id="availablediv"></div>');
            
            // Cache the newly appendend divs
            $headerdiv = $('#headerdiv');
            $availablediv = $('#availablediv');
            $documentationdiv = $('#documentationdiv');

            // Build the desktop version of the site
            if (!onMobile) {
                // Add the clock at the header
                $headerdiv.append ('<p id="clock"></p>');
                $clock = $('#clock');
                keepTime ();

                // Add the 'AVAILABLE STATIC WEBSITES' containing div, and link holding div
                $availablediv.css ({overflow: 'auto'});
                $availablediv.append ('<div id="availablehead"><p id="availableheadtitle">AVAILABLE WEBSITES</p></div>');

                // Push down the available head as the position is fixed
                $availablehead = $('#availablehead');
                $availablehead.css ({top: $headerdiv.outerHeight(true)});
                $('#availableheadtitle').css ({fontSize: '1.75em'}).centerVerticallyInParent ();
                
                $availablediv.css ({backgroundColor: 'white'});
                if (staticWebsites['static'] === 'ERR') {
                    $availablediv.append ('<div class="staticentry"><p>Unexpected error prevented static folder retrieval</p></div>');
                } else if (staticWebsites.length) {
                    for (var i = 0; i < staticWebsites.length; i++) $availablediv.append ('<a target="_blank" href="../' + staticWebsites[i] + '" class="staticentry">' + staticWebsites[i] + '</a>');
                    $staticentry = $('.staticentry');
                    $availablediv.mCustomScrollbar (scrollbarOpts);

                    // Cache the hovering colors
                    var defColor = '#FFF', hovColor = '#AAA', m = 200;
                    $staticentry.hover (function () {
                        $(this).stop ().animate ({backgroundColor: hovColor}, m);
                    }, function () {
                        $(this).stop ().animate ({backgroundColor: defColor}, m);
                    });
                }

                $documentationdiv.append ('<div id="documentationhead"><p id="documentationtitle">DOCS AND BLOG</p></div>');
                $documentationhead = $('#documentationhead');
                $documentationtitle = $('#documentationtitle');

                // Make the documentation title text bigger and center it vertically
                $documentationtitle.css ({fontSize: '1.75em'}).centerVerticallyInParent ();
                $documentationdiv.css ({height: (window.innerHeight - $headerdiv.outerHeight(true)), width: (window.innerWidth / 2) + 'px'});
                $availablediv.css ({height: (window.innerHeight - $headerdiv.outerHeight(true) - $availablehead.outerHeight(true)), width: (window.innerWidth / 2) + 'px'});

                // Add the documentation tab content
                $documentationdiv.append ('<div id="documentationtabdiv"></div>');
                $documentationtabdiv = $('#documentationtabdiv');
                $documentationtabdiv.css ({height: $documentationdiv.outerHeight(true) - $availablehead.outerHeight(true)});

                // Get the A Server Github HTML and CSS and add it as the first documentation card
                ajaxText ('/request.crossdomain.https://github.com/tacowhisperer/A', function (text) {
                    loadingIcon.tick (5).draw ();
                    ajaxText ('/request.crossdomain.https://assets-cdn.github.com/assets/' +
                        'github2-0f9ba210819ce56d9f786431efa5742ecacb9ea2d491b3b2a1c191626fd447e7.css', function (txt) {
                            // Handles the case where both the CSS and HTML were successfully loaded
                            $body.append('<style>' + txt + '</style>');
                            _next ();
                        }, _next);

                    function _next () {
                        $documentationtabdiv.append ('<div class="blogcard"><p class="blogtext">The following is pulled from <a href="https://github.com/tacowhisperer/A" target="_blank">https://github.com/tacowhisperer/A</a></p>' + text.match (/<div id="readme"(.|\n)+<article(.|\n)+<\/article>(.|\n)+?<\/div>/)[0] + '</div>');
                        loadingIcon.tick (5).draw ();
                        _appendBlog ();
                    }
                }, function (status) {
                    $documentationtabdiv.append ('<div class="blogcard"><p class="blogtext">Could not retrieve the documentation directly from'+
                        ' the Github server. Please click <a href="https://github.com/tacowhisperer/A" target="_blank" style="text-decoration: none;">here</a>'+
                        ' to see the documentatoin readme directly.</p></div>');
                    loadingIcon.tick (10).draw ();
                    _appendBlog ();
                });

                function _appendBlog () {
                    ajaxText ('blog/blog.json', function (text) {
                        try {
                            var webObj = JSON.parse (text);
                            $documentationtabdiv.append (webObj.blog.join (''));
                        } catch (e) {
                            alert ('There was an error parsing the text in blog/blog.json. Contact your local administrator and let him or her know of this error.');
                            console.log (e.stack || e);
                        }
                        $documentationtabdiv.mCustomScrollbar (scrollbarOpts);
                        loadingIcon.tick (5).draw ();
                    }, function (status) {
                        alert ('The blog/blog.json file is missing or corrupted. Contact your local administrator and let them know of this error.');
                        console.log ('error status: ' + status);
                        $documentationtabdiv.mCustomScrollbar (scrollbarOpts);
                        loadingIcon.tick (5).draw ();
                    });
                }
            } 

            // Build the mobile version of the site otherwise
            else {
                // Make the top bar taller
                var mTop = '4.5em';
                $headerdiv.css ({height: mTop});
                $availablediv.css ({top: mTop, height: 0.85 * $headerdiv.outerHeight(true), width: (window.innerWidth / 2) + 'px'});
                $documentationdiv.css ({top: mTop, height: 0.85 * $headerdiv.outerHeight(true), width: (window.innerWidth / 2) + 'px'});

                // Add the content divs that will hold content based on whether the documentation or available tab is focused
                $body.append ('<div id="staticcontenttab" class="mobilecontentdiv"></div>');
                $body.append ('<div id="documentationtab" class="mobilecontentdiv" style="display: none"></div>');
                $mobilecontentdiv = $('.mobilecontentdiv');

                var delta = $headerdiv.outerHeight(true) + $availablediv.outerHeight(true);
                $mobilecontentdiv.css ({height: (window.innerHeight - delta) + 'px', top: delta + 'px'});
            }
        }

        /*global jQuery
        *
        * FlexVerticalCenter.js 1.0
        *
        * Copyright 2011, Paul Sprangers http://paulsprangers.com
        * Released under the WTFPL license
        * http://sam.zoy.org/wtfpl/
        *
        * Date: Fri Oct 28 19:12:00 2011 +0100
        */
        (function( $ ){

          $.fn.centerVerticallyInParent = function( options ) {
            var settings = $.extend({
              cssAttribute:   'margin-top', // the attribute to apply the calculated value to
              verticalOffset: 0,            // the number of pixels to offset the vertical alignment by
              parentSelector: null,         // a selector representing the parent to vertically center this element within
              debounceTimeout: 25,          // a default debounce timeout in milliseconds
              deferTilWindowLoad: false     // if true, nothing will take effect until the $(window).load event
            }, options || {});

            return this.each(function(){
              var $this   = $(this); // store the object
              var debounce;

              // recalculate the distance to the top of the element to keep it centered
              var resizer = function () {

                var parentHeight = (settings.parentSelector && $this.parents(settings.parentSelector).length) ?
                  $this.parents(settings.parentSelector).first().height() : $this.parent().height();

                $this.css(
                  settings.cssAttribute, ( ( ( parentHeight - $this.height() ) / 2 ) + parseInt(settings.verticalOffset) )
                );
              };

              // Call on resize. Opera debounces their resize by default.
              $(window).resize(function () {
                  clearTimeout(debounce);
                  debounce = setTimeout(resizer, settings.debounceTimeout);
              });

              if (!settings.deferTilWindowLoad) {
                // call it once, immediately.
                resizer();
              }

              // Call again to set after window (frames, images, etc) loads.
              $(window).load(function () {
                  resizer();
              });

            });

          };

        })( jQuery );
    }

    // Fades away the loading icon and fades in the contents of the homepage
    function animateEntrance () {
        $('#loading').fadeOut (200, function () {
            $('#loadingcover').fadeOut (200);
        });
    }

    // Simple clock object that returns the time in AM/PM format when ticked    
    function Clock () {

        var time = calculateTime (), showColon = true;

        // Updates time to the current system time
        this.tick = function () {
            time = calculateTime ();
            showColon = !showColon;
            return this;
        };

        // Returns the formatted string time
        this.time = function () {return time;};

        // Sets time to the current system time
        function calculateTime () {
            var d = new Date (),
                hour = d.getHours (),
                mins = d.getMinutes (),
                ampm = hour >= 12? 'PM' : 'AM';

            hour = '' + ((hour %= 12)? hour : '12');
            mins = mins < 10? '0' + mins : mins;

            return hour + (showColon? ':' : ' ') + mins + ' ' + ampm;
        };
    }
});

/****************************************************************************************************
 * Asynchronously request and eval JavaScript dependencies to start building the website on-the-fly *
 ****************************************************************************************************/
// Load jQuery
(function () {
    // Create the request object
    var request = new window.XMLHttpRequest (), ASYNC = true;
    request.onreadystatechange = function () {
        if (request.readyState === 4) {
            if (request.status === 200) {
                deps.jQuery = 200;
                eval(request.responseText);

                /** Load JavaScript libraries that depend on successful jQuery load **/
                // Load jQuery Color
                ajaxJS ('jQueryColor', 'js/jquery-color.min.js');

                // Load mCustomScrollbar
                ajaxJS ('mCustomScrollbar', 'js/jquery.mCustomScrollbar.concat.min.js');

            } else {
                deps.jQuery = request.status;
                console.log ('jQuery retrieval failed');
            }
        }
    };

    // Send the request to the server
    request.open ('GET', 'js/jquery-2.1.4.min.js', ASYNC);
    request.send ();
})();

// Load KeyPress
ajaxJS ('keyPress', 'js/keypress-2.1.0.min.js');

// Asynchronously loads a JavaScript dependency using the native eval()
function ajaxJS (dps, url) {
    var req = new window.XMLHttpRequest (), ASYNC = true;
    req.onreadystatechange = function () {
        if (req.readyState === 4) {
            if (req.status === 200) {
                deps[dps] = 200;
                eval(req.responseText);
            } else {
                deps[dps] = req.status;
                console.log (dps + ' retrieval failed');
            }
        }
    };

    req.open ('GET', url, ASYNC);
    req.send ();
}

// Asynchronously loads a text file and executes the appropriate callback
function ajaxText (url, sCB, eCB) {
    var req = new window.XMLHttpRequest (), ASYNC = true;
    req.onreadystatechange = function () {
        if (req.readyState === 4) req.status === 200? sCB (req.responseText) : eCB (req.status);
    };

    req.open ('GET', url, ASYNC);
    req.send ();
}

Array.prototype.toString = function () {
    var s = '', n = '\n    ';
    for (var i = 0, t = this; i < t.length; i++) s += i > 0? ',' + n + t[i] : n + t[0];
    return '[' + s + '\n]';
};

function printHTMLArray (arr, i, ind, s) {
    if (arguments.length === 1) {i = 0; ind = 0; s = '';}

    var prevWasOpening = false, prevWasClosing = false, tab = '    ', n = '\n';
    if (i < arr.length) {

        // Matches opening HTML tags
        if (arr[i].match (/^<[^/]/)) {
            prevWasClosing = false;

            // Two consecutive opening tags indicates recursive tab adjustment
            if (prevWasOpening) {
                s += _(tab, ind) + arr[i] + n;
                return printHTMLArray (arr, i + 1, ind + 1, s);
            }

            // This is the first opening tag, or first opening tag after a closing tag
            else {
                prevWasOpening = true;
                s += _(tab, ind) + arr[i] + n;
                return printHTMLArray (arr, i + 1, ind, s);
            }
        }

        // Matches closing HTML tags
        else if (arr[i].match (/^<\//)) {
            prevWasOpening = false;

            // Two consecutive closing tags indicates recursive tab adjustment
            if (prevWasClosing) {
                s += _(tab, ind) + arr[i] + n;
                return printHTMLArray (arr, i + 1, ind - 1, s);
            }

            // This is a first closing tag that came after an opening tag
            else {
                prevWasClosing = true;
                s += _(tab, ind) + arr[i] + n;
                return printHTMLArray (arr, i + 1, ind, s);
            }
        }

        // Work with everything else
        else s += _(tab, ind) + arr[i] + n;
    }

    function _ (str, t) {
        var __ = '';
        for (var ___ = 0; ___ < t; ___++) __ += str;
        return __;
    }

    return s;
}
