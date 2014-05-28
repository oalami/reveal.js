/**
 * Handles opening of and synchronization with the reveal.js
 * notes window.
 */
var firebaseLogin = null;
var firebaseLogout = null;

(function() {
  function loadScript(url, callback) {
    // Adding the script tag to the head as suggested before
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = callback;
    script.onload = callback;

    // Fire the loading
    head.appendChild(script);
  }

  var callback = function() {
    if(typeof Firebase !== 'undefined' && typeof FirebaseSimpleLogin !== 'undefined') {
      RevealFirebase()
    }
  }

  loadScript("https://cdn.firebase.com/js/client/1.0.15/firebase.js", callback);
  loadScript("https://cdn.firebase.com/js/simple-login/1.4.1/firebase-simple-login.js", callback);
})();

var RevealFirebase = (function() {
  var rootRef = new Firebase('https://slideF.firebaseio.com/');
  var controlKey = 'control';
  var currentKey = 'current';
  var controlRef = null;
  var currentRef = null;
  var loggedIn = false;
  var uid = null;  

  var auth = new FirebaseSimpleLogin(rootRef, function(error, user) {
    if (error) {
      // an error occurred while attempting login
      console.log(error);
      uid = null;
      loggedIn = false;
    } else if (user) {
      // user authenticated with Firebase
      console.log('User ID: ' + user.uid + ', Provider: ' + user.provider);
      uid = user.uid;
      loggedIn = true

      init();
    } else {
      // user is logged out
      uid = null;
      loggedIn = false;
    }
  });

  function init() {
    controlRef = rootRef.child(uid).child(controlKey);
    currentRef = rootRef.child(uid).child(currentKey);

    controlRef.set(null);
    currentRef.set(getMessageData());
    controlRef.on('child_added', function(snapshot) {
      var msgData = snapshot.val();
      if(msgData === 'next') {
        Reveal.next();
      } else if(msgData === 'prev') {
        Reveal.prev();
      }
    });

    // Fires when slide is changed
    Reveal.addEventListener('slidechanged', update);

    // Fires when a fragment is shown
    Reveal.addEventListener('fragmentshown', update);

    // Fires when a fragment is hidden
    Reveal.addEventListener('fragmenthidden', update);

    /**
     * Posts the current slide data to the notes window
     */
    function update() {
      if(loggedIn) {
        currentRef.set(getMessageData());
      }
    }
  }

  function getMessageData() {
    var slideElement = Reveal.getCurrentSlide(),
      slideIndices = Reveal.getIndices(),
      messageData;

    var notes = slideElement.querySelector('aside.notes'),
      nextindexh,
      nextindexv;

    if(slideElement.nextElementSibling && slideElement.parentNode.nodeName == 'SECTION') {
      nextindexh = slideIndices.h;
      nextindexv = slideIndices.v + 1;
    } else {
      nextindexh = slideIndices.h + 1;
      nextindexv = 0;
    }

    var messageData = {
      'notes': notes ? notes.innerHTML : '',
      'indexh': slideIndices.h || null,
      'indexv': slideIndices.v || null,
      'indexf': slideIndices.f || null,
      'nextindexh': nextindexh || null,
      'nextindexv': nextindexv || null,
      'markdown': notes ? typeof notes.getAttribute('data-markdown') === 'string' : false
    };

    return messageData;
  }

  firebaseLogin = function login() {
    auth.login('google');
  }

  firebaseLogout = function logout() {
    auth.logout();
    if(currentRef)  {
      currentRef.off();
    }
    if(controlRef) {
      controlRef.off();
    }
  }
});

