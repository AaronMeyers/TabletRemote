var socket;

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
	var framerate = 1000/60;
	var fingerImg = $('#clonablefinger').find('img')[0];

	var mobileClient =  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

	var width, height;

	$(document).on( 'touchstart', function( e ) {
		// e.preventDefault();
	});
	$(document).on( 'touchmove', function( e ) {
		e.preventDefault();
	});

	function loop() {
		var ctx = canvas.getContext( "2d" );
		ctx.fillStyle = "rgba(0,0,0,.05)";
		ctx.fillRect( 0, 0, width, height );
		var size = 64;
		var keys = Object.keys( activeTouches );
		for ( var i=0; i<keys.length; i++ ) {
			var touch = activeTouches[keys[i]];
			ctx.drawImage( fingerImg, touch.x - size/2, touch.y - size/2, size, size );
		}

		if ( requestAnimationFrame )
			requestAnimationFrame( loop, framerate );			
		else
			setTimeout( loop, framerate );
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
				$('#settingsPanel').fadeIn();
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

			var finger = $('#clonablefinger')
				.clone()
				.attr( 'id', 'finger' + touch.identifier )
				.css({
					top: touch.clientY - fingerHeight/2,
					left: touch.clientX - fingerWidth/2,
					display: 'block'
				});
			$('.iphone').append( finger );

			if ( activeTouches[touch.identifier] == undefined ) {
				activeTouches[touch.identifier] = {
					x: touch.clientX,
					y: touch.clientY,
					div: finger
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
				activeTouch.div.css({
					top: touch.clientY - fingerHeight/2,
					left: touch.clientX - fingerWidth/2
				});
			}


		}
	}

	function onTouchEnd( e ) {
		var touchEvent = e.originalEvent;
		for ( var i=0; i<touchEvent.changedTouches.length; i++ ) {
			var touch = touchEvent.changedTouches[i]
			if ( activeTouches[touch.identifier] ) {
				var activeTouch = activeTouches[touch.identifier];
				activeTouch.div.fadeOut(200, function() {
					$(this).remove();
				});
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