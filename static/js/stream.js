/* captures data from client and sends over to server
   receives data from server and updates client
*/

var video; // video stream
var ocanvas; // offscreen canvas for video stream
var ocontext; //offscreen canvas context
var img; // offscreen canvas image
var fps = 10; //drawing fps
var streamTimer; // data sending and receiving timer
var owidth = 640; // offscreen canvas width
var oheight = 480; // offscren canvas height

// initialize video stream
window.addEventListener('load', initStream, false);

/* socket.io setup */
namespace = '/cdata'; // (client data) change to an empty string to use the global namespace
// the socket.io documentation recommends sending an explicit package upon connection
// this is specially important when using the global namespace
var socket = io.connect('http://' + document.domain + ':' + location.port + namespace);
socket.on('connect', function() { socket.emit('event', {data: 'client connected!'});});

/* Initialize streaming */
function initStream() {

	if (userMediaSupported()) {
		startStream();
        
	} else {
		alert("getUserMedia() Not Supported");
	}
}

/* Start video stream */
function userMediaSupported() {
  	return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
              navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

// select last video source (rear camera on mobile phones)
function gotSources(sourceInfos) {
    for (var i = 0; i != sourceInfos.length; ++i) {
        var sourceInfo = sourceInfos[i];
        if (sourceInfo.kind === 'video') {
            console.log(sourceInfo.id, sourceInfo.label || 'camera');
            videoSource = sourceInfo.id;
            alert(videoSource);
        }        
    }
}

function mediaSuccess(videoStream) {
	window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
    video.src = window.URL.createObjectURL(videoStream);
    video.onloadedmetadata = streamData;
}

function mediaFail(error) {
	//error code 1 = permission Denied
	alert("Failed To get user media:" + error.code);
}

function startStream() {

    // initialized video stream
	video = document.createElement("video");
    video.setAttribute("width", owidth);
    video.setAttribute("height", oheight);

    // initialize offscreen canvas 
    ocanvas = document.createElement("canvas");
    ocanvas.setAttribute("width", owidth);
    ocanvas.setAttribute("height", oheight);
    ocontext = ocanvas.getContext("2d");
    
    // select last camera on device as video source (rear camera for mobile phones/tablets) 
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    if (typeof MediaStreamTrack === 'undefined'){
        alert('This browser does not support MediaStreamTrack.\n\nTry Chrome Canary.');
    } else {
        MediaStreamTrack.getSources(function(sourceInfos) {
            var videoSource = null;

            for (var i = 0; i != sourceInfos.length; ++i) {
                var sourceInfo = sourceInfos[i];
                if (sourceInfo.kind === 'video') {
                    console.log(sourceInfo.id, sourceInfo.label || 'camera');
                    videoSource = sourceInfo.id;
                }
            }

            sourceSelected(videoSource);
        });

        function sourceSelected(videoSource) {
            var constraints = {
                video: {
                    optional: [{sourceId: videoSource}]
                },
                audio:false
            };

            navigator.getUserMedia(constraints, mediaSuccess, mediaFail);
        }
    }
}


/* stream data to server */

// check canvas support 
function canvasSupport () {
  	return Modernizr.canvas;
}

// send video frame to server
function sendData() {

    ocontext.drawImage(video, 0, 0, ocanvas.width, ocanvas.height);
    socket.emit('frame', { data: ocanvas.toDataURL('image/jpeg', 0.7) });
    
}

function streamData() {
	if (!canvasSupport()) {
		return;
  	}

    video.play();
    
    streamTimer = setInterval(function(){ sendData(); }, Math.round(1000 / fps));
}
