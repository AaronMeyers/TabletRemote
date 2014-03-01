var socket;
var countdown;
var remoteNum = 0;
var isActive = false;
var touchInterval = 20;
var touchX = 0, touchY = 0;
var touchIntervalId;
var isTouched = false;
var activeTouches = {};
var canvas;
var fingerCanvas;
var fingerImg;
var caveImg;
var width, height;
var menu;

$(document).on( 'ready', function() {

	canvas = $('#canvas')[0];
	fingerCanvas = $('#fingercanvas')[0];
	fingerImg = $('#clonablefinger').find('img')[0];
	caveImg = $('#cave').find('img')[0];

	countdown = new Countdown();
	particleSystem = new ParticleSystem( canvas.getContext( '2d' ), 300 );
	touchIntervalId = setInterval( sendTouches, touchInterval );

	loop();
	initWebSocket();

	menu = new Menu();
	// menu.init( effectInfo2D.concat( effectInfo2D, effectInfo2D ) );
	// menu.hide(true);

	$('.iphone').on( 'touchstart', onTouchStart );
	$('.iphone').on( 'touchend', onTouchEnd );
	$('.iphone').on( 'touchmove', onTouchMove );

	$(document).on( 'touchstart', function( e ) {
		// e.preventDefault();
	});
	$(document).on( 'touchmove', function( e ) {
		e.preventDefault();
	});


	$(window).on( 'resize', onResize );
	onResize();

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
		socket.onmessage = onSocketMessage;
	}

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

	function onSocketMessage( message ) {

		var json = JSON.parse( message.data );

		// console.log( 'received a socket message of type ' + json.type );

		if ( json.type == 'setRemoteNum' ) {
			// FOR NOW, THIS IS WHERE THE MENU WILL BE LOADED
			// REMOTES 1 & 4 are 3D
			// REMOTES 2 & 3 are 2D
			remoteNum = json.num;
			console.log( 'remote set to ' + remoteNum );
			if ( remoteNum == 1 || remoteNum == 2 ) {
				// menu.show();
				menu.kill();
				menu = new Menu();
				menu.init( effectInfo3D.concat( effectInfo3D ) );
				menu.hide(true);
			}
			else if ( remoteNum == 3 || remoteNum == 4 ) {
				menu.kill();
				menu = new Menu();
				menu.init( effectInfo2D.concat( effectInfo2D ) );
				menu.hide(true);
			}
			document.title = remoteNum;
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
				// console.log( 'becoming inactive' );
				isActive = json.active;
			}
			else if ( !isActive && json.active ) {
				// console.log( 'becoming active' );
				// WHEN WE BECOME ACTIVE, SEND THE EFFECT WE ARE USING
				isActive = json.active;
			}
			// touchInterval = json.touchInterval;
			$('#activityStatus').text( (isActive?'ACTIVE/':'INACTIVE/') + remoteNum ).addClass( isActive?'btn-success':'btn-danger').removeClass( isActive?'btn-danger':'btn-success' );
		}
		else if ( json.type == 'startCountdown' ) {
			// console.log( 'start countdown with length: ' + json.length );
			countdown.begin( json.length );
		}
		else if ( json.type == 'activate' ) {
			console.log( 'received activate message' );
			activate();
		}
		else if ( json.type == 'deactivate' ) {
			console.log( 'received deactivate message' );
			deactivate(json);
		}
		else if ( json.type == 'reload' ) {
			location.reload();
		}
	}

	function activate() {
		// fade in canvas
		// $('#canvas').fadeIn(1000);
		$('#canvas').css({visibility: 'visible'});
		$('#canvas').css({
			'-webkit-filter': 'brightness(100%)',
			'-webkit-transition': '-webkit-filter 1s linear 1s'
		})
		.on( 'webkitTransitionEnd', function(e) {
			$(this).off( 'webkitTransitionEnd' );
		});
		// put away the countdown
		countdown.slideOut();
		// put away the menu
		menu.hide();
		isActive = true;
	}

	function deactivate( json ) {
		// fade out cave
		// $('#canvas').fadeOut(1000);
		$('#canvas').css({
			'-webkit-filter': 'brightness(0%)',
			'-webkit-transition': '-webkit-filter 1s linear 1s'
		})
		.on( 'webkitTransitionEnd', function(e) {
			$(this)
			.off( 'webkitTransitionEnd' )
			.css({visibility:'hidden'});
		});
		// bring out the countdown
		countdown.slideIn();
		countdown.begin( json.countdownLength );
		// bring out the menu
		menu.show();
		isActive = false;
	}

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
	

});