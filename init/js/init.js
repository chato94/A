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

    // Updates the time of the clock every 0.5 seconds only if the clock and jQuery are present in the DOM
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
            var $body = $('body');

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
                    for (var i = 0; i < staticWebsites.length; i++) $availablediv.append ('<div class="staticentry"><p>' + staticWebsites[i] + '</p></div>');
                    $staticentry = $('.staticentry');
                    $availablediv.mCustomScrollbar ({theme: 'minimal-dark', scrollInertia: 256, advanced: {updateOnContentResize: true, updateOnBrowserResize: true}});

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
                $documentationtabdiv.append ();
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
                ajax ('jQueryColor', 'init/js/jquery-color.min.js');

                // Load mCustomScrollbar
                ajax ('mCustomScrollbar', 'init/js/jquery.mCustomScrollbar.concat.min.js');

            } else {
                deps.jQuery = request.status;
                console.log ('jQuery retrieval failed');
            }
        }
    };

    // Send the request to the server
    request.open ('GET', 'init/js/jquery-2.1.4.min.js', ASYNC);
    request.send ();
})();

// Load KeyPress
ajax ('keyPress', 'init/js/keypress-2.1.0.min.js');

function ajax (dps, url) {
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
