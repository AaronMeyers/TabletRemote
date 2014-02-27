var socket;
var countdown;

$(document).on( 'ready', function() {

	var remoteNum = 0;
	var isActive = false;
	var touchInterval = 20;
	var touchX = 0, touchY = 0;
	var touchIntervalId;

	var activeTouches = {};
	var fingerWidth = $('#clonablefinger').width();
	var fingerHeight = $('#clonablefinger').height();
	var canvas = $('#canvas')[0];
	var fingerCanvas = $('#fingercanvas')[0];
	var framerate = 1000/60;
	var fingerImg = $('#clonablefinger').find('img')[0];
	var caveImg = $('#cave').find('img')[0];

	countdown = new Countdown();
	particleSystem = new ParticleSystem( canvas.getContext( '2d' ), 300 );

	var width, height;

	$(document).on( 'touchstart', function( e ) {
		// e.preventDefault();
	});
	$(document).on( 'touchmove', function( e ) {
		e.preventDefault();
	});

	function loop() {
		var fingerctx = fingerCanvas.getContext( "2d" );
		var ctx = canvas.getContext( "2d" );

		fingerctx.fillStyle = "rgba(0,0,0,.025)";
		fingerctx.fillRect( 0, 0, width, height );

		// ctx.clearRect( 0, 0, width, height );
		ctx.fillStyle = 'black';
		ctx.fillRect( 0, 0, width, height );

		ctx.globalCompositeOperation = 'source-over';
		ctx.drawImage( caveImg, 0, 120, caveImg.width, caveImg.height );

		// switch to multiply blending

		var size = 64;
		size = 200;
		var keys = Object.keys( activeTouches );
		for ( var i=0; i<keys.length; i++ ) {
			var touch = activeTouches[keys[i]];
			particleSystem.spawnParticles( 5, touch.x, touch.y );
			fingerctx.drawImage( fingerImg, touch.x - size/2, touch.y - size/2, size, size );
		}
		ctx.globalCompositeOperation = 'soft-light';
		ctx.drawImage( fingerCanvas, 0, 0, width, height );
		ctx.globalCompositeOperation = 'source-over';
		particleSystem.update( ctx );
		requestAnimationFrame( loop );
	}
	loop();

	function initWebSocket() {
		var serverAddress = location.host.split( ":" )[0];
		socket = new WebSocket("ws://" + serverAddress + ":8080");
		socket.onopen = function() {
			sendSocketMessage( JSON.stringify({
				type: 	'registerRemoteControl'
			}));
		};
		socket.onclose = function( e ) {
			if ( socket.readyState != WebSocket.OPEN ) {
				$('#activityStatus').text( 'DISCONNECTED' ).addClass( 'btn-danger' ).removeClass( 'btn-success' );
				// initWebSocket();
				setTimeout( initWebSocket, 1000 );
			}
			
		}
		socket.onerror = function( e ) {
			console.log( 'socket error' );
		}
		socket.onmessage = function( message ) {

			var json = JSON.parse( message.data );
			if ( json.type == 'setRemoteNum' ) {
				remoteNum = json.num;
				console.log( 'remote set to ' + remoteNum );
				// $('#settingsPanel').fadeOut();
				$('#activityStatus').text( isActive?'ACTIVE/':'INACTIVE/' + remoteNum );

			}
			else if ( json.type == 'registerRemoteControl' ) {

				// $('#settingsPanel').fadeIn();
			}
			else if ( json.type == 'showSettings' ) {
				if ( $('#settingsPanel').is(':visible') )
					$('#settingsPanel').fadeOut();
				else
					$('#settingsPanel').fadeIn();
			}
			else if ( json.type == 'setActive' ) {
				if ( isActive && !json.active ) {
					console.log( 'becoming inactive' );
					isActive = json.active;
				}
				else if ( !isActive && json.active ) {
					console.log( 'becoming active' );
					isActive = json.active;
				}
				touchInterval = json.touchInterval;
				$('#activityStatus').text( (isActive?'ACTIVE/':'INACTIVE/') + remoteNum ).addClass( isActive?'btn-success':'btn-danger').removeClass( isActive?'btn-danger':'btn-success' );
			}
			else if ( json.type == 'startCountdown' ) {
				// console.log( 'start countdown with length: ' + json.length );
				countdown.begin( json.length );
			}

			$(window).on( 'resize', onResize );
			onResize();
		}
	}
	initWebSocket();

	$('.iphone').on( 'touchstart', onTouchStart );
	$(window).on( 'touchend', onTouchEnd );
	$(window).on( 'touchmove', onTouchMove );

	$('.remoteNumButton').on( 'click', function( event ) {
		var num = parseInt( event.target.innerHTML );
		console.log( num );
		sendSocketMessage( JSON.stringify({
			type: 	'setRemoteNum',
			num: 	num
		}) );
	});

	$('#hideSettingsButton').on( 'click', function(event) {
		console.log( 'hello' );
		$('#settingsPanel').fadeOut();
	});

	var isTouched = false;

	function onResize( e ) {
		width = $(window).width(),
		height = $(window).height();

		$('.iphone').css({
			width: width,
			height: height
		});
		canvas.width = width;
		canvas.height = height;

		fingerCanvas.width = width;
		fingerCanvas.height = height;
	}

	function sendSocketMessage( jsonString ) {
		if ( socket.readyState == WebSocket.OPEN ) {
			socket.send( jsonString );
		}
		else {
			console.log( 'socket wasn\'t ready' );
		}
	}

	function onTouchStart( e ) {
		var touchEvent = e.originalEvent;
		for ( var i=0; i<touchEvent.changedTouches.length; i++ ) {


			var touch = touchEvent.changedTouches[i];

			if ( activeTouches[touch.identifier] == undefined ) {
				activeTouches[touch.identifier] = {
					x: touch.clientX,
					y: touch.clientY,
				}
			}

			sendTouch( 'start', Object.keys(activeTouches).length-1, touch.clientX, touch.clientY );
		}
	}

	function onTouchMove( e ) {
		var touchEvent = e.originalEvent;
		for ( var i=0; i<touchEvent.changedTouches.length; i++ ) {
			var touch = touchEvent.changedTouches[i];
			if ( activeTouches[touch.identifier] != undefined ) {
				var activeTouch = activeTouches[touch.identifier];
				activeTouch.x = touch.clientX;
				activeTouch.y = touch.clientY;
			}


		}
	}

	function onTouchEnd( e ) {
		var touchEvent = e.originalEvent;
		for ( var i=0; i<touchEvent.changedTouches.length; i++ ) {
			var touch = touchEvent.changedTouches[i]
			if ( activeTouches[touch.identifier] ) {
				var activeTouch = activeTouches[touch.identifier];
				var index = Object.keys(activeTouches).indexOf( touch.identifier.toString() );

				sendTouch( 'end', index, touch.clientX, touch.clientY );
				delete activeTouches[touch.identifier];
			}
		}
	}


	touchIntervalId = setInterval( sendTouches, touchInterval );

	function sendTouches() {
		var keys = Object.keys( activeTouches );
		if ( keys.length == 0 )
			return;

		for ( var i=0; i<keys.length; i++ ) {
			var touch = activeTouches[keys[i]];
			sendTouch( 'move', i, touch.x, touch.y );
		}
	}

	function sendTouch( phase, index, x, y ) {
		if ( !isActive )
			return;

		sendSocketMessage(JSON.stringify({
			type: 'touchCoord',
			index: index,
			phase: phase,
			x: x,
			y: y,
			w: width,
			h: height
		}));
	}

	/*
	function onTouchDown( event ) {
		var isMobile = event.originalEvent instanceof TouchEvent;
		if ( isMobile ) {
			var touchEvent = event.originalEvent;
			if ( touchEvent.changedTouches[0] == touchEvent.touches[0] ) {
				// if the touch starting is the first finger
				isTouched = true;
				touchX = touchEvent.touches[0].clientX;
				touchY = touchEvent.touches[0].clientY;
				touchStarted();
			}
		}
		else {
			isTouched = true;
			touchX = event.clientX;
			touchY = event.clientY;
			touchStarted();
		}
	}

	function touchStarted() {
		clearInterval( touchIntervalId );
		touchIntervalId = setInterval( sendTouch, touchInterval );
		$('.finger').css('left', touchX - $('.finger').width()/2 + 'px' );
		$('.finger').css('top', touchY - $('.finger').height()/2 + 'px' );
		$('.finger').show();
		sendTouch( 'start' );
	}

	function onTouchUp( event ) {
		var isMobile = event.originalEvent instanceof TouchEvent;
		if ( isMobile ) {
			var touchEvent = event.originalEvent;
			// console.log( 'on touch up: ' + touchEvent.changedTouches.length + '/' + touchEvent.touches.length );
			// if ( touchEvent.changedTouches[0] == touchEvent.touches[0] ) {
			if ( touchEvent.touches.length == 0 ) {
				isTouched = false;
				touchEnded();
			}
		}
		else {
			isTouched = false;
			touchX = event.clientX;
			touchY = event.clientY;
			touchEnded();
		}
	}

	function touchEnded() {
		clearInterval( touchIntervalId );
		$('.finger').fadeOut();
		sendTouch( 'end' );
	}


	function onTouchMove( event ) {
		var isMobile = event.originalEvent instanceof TouchEvent;

		if ( isMobile ) {
			var touchEvent = event.originalEvent;
			// for ( var t in touchEvent.changedTouches ) {
			touchX = touchEvent.touches[0].clientX;
			touchY = touchEvent.touches[0].clientY;
		}
		else {
			touchX = event.clientX;
			touchY = event.clientY;
		}

		$('.finger').css('left', touchX - $('.finger').width()/2 + 'px' );
		$('.finger').css('top', touchY - $('.finger').height()/2 + 'px' );
	}
	function sendTouch( phase, index ) {
		if ( isActive && ( isTouched || phase == "end" ) ) {


			if ( phase == undefined )
				phase = 'move';

			sendSocketMessage( JSON.stringify({
				type: 	'touchCoord',
				phase:  phase,
				x: 		touchX,
				y: 		touchY,
				w: 		width,
				h: 		height,
			}) );
		}
	}
	*/

	

});