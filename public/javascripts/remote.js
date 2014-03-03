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
var wireCanvas;
var caveImg;
var width, height;
var menu;
var welcomeTimeout;
var goAwayTimeout;
var chosenEffectName;
var chosenEffectIndex = 0;
var imgWidth, imgHeight;
var welcomeLength

$(document).on( 'ready', function() {

	canvas = $('#canvas')[0];
	fingerCanvas = $('#fingercanvas')[0];
	wireCanvas = $('#wirecanvas')[0];
	fingerImg = $('#clonablefinger').find('img')[0];
	// caveImg = $('#cave').find('img')[0];
	caveImg = $('#wireframeCave')[0];
	shadedImg = $('#shadedCave')[0];
	imgWidth = 1024;
	console.log( caveImg.width +',' + caveImg.height );
	imgHeight = (imgWidth/caveImg.width) * caveImg.height;

	// $('.canvasImage').width(window.innerHeight);

	countdown = new Countdown({finalCountdownCallback:finalCountdown});
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

	$(document).on( 'keydown', function( e ) {
		var key = String.fromCharCode( e.keyCode );
		if ( key == 'O' ) {
			menu.open();
		}
		else if ( key == 'C' ) {
			menu.close();
		}
		else if ( key == 'A' ) {
			activate( '3D' );
		}
		else if ( key == 'D' ) {
			deactivate({
				countdownLength: 90,
				welcomeLength: 15,
				leaveLength: 15,
			});
		}
	});


	$(window).on( 'resize', onResize );
	onResize();

	function finalCountdown() {
		menu.close();
		countdown.slideOut();
		$('#welcome').fadeOut();
		$('#effectChosen').fadeOut();
		$('#big-countdown').fadeIn();
	}

	function loop() {

		if ( !isActive ) {
			requestAnimationFrame( loop );
			return;
		}
		var fingerctx = fingerCanvas.getContext( "2d" );
		var ctx = canvas.getContext( "2d" );
		var wirectx = wireCanvas.getContext( "2d" );

		// first deal with fingers
		fingerctx.fillStyle = "rgba(0,0,0,.025)";
		fingerctx.fillRect( 0, 0, width, height );

		var size = 64;
		size = 200;
		var keys = Object.keys( activeTouches );
		for ( var i=0; i<keys.length; i++ ) {
			var touch = activeTouches[keys[i]];
			particleSystem.spawnParticles( 5, touch.x, touch.y );
			fingerctx.drawImage( fingerImg, touch.x - size/2, touch.y - size/2, size, size );
		}


		// // ctx.clearRect( 0, 0, width, height );
		// // fill it with black
		ctx.fillStyle = 'black';
		ctx.fillRect( 0, 0, width, height );

		// // draw the base shaded image
		ctx.globalCompositeOperation = 'source-over';
		ctx.drawImage( shadedImg, 0, 120, 1024, (1024/caveImg.width)*caveImg.height );

		ctx.globalCompositeOperation = 'multiply';
		ctx.drawImage( fingerCanvas, 0, 0, width, height );

		wirectx.fillStyle = 'black';
		wirectx.fillRect( 0, 0, width, height );

		wirectx.globalCompositeOperation = 'source-over';
		wirectx.drawImage( caveImg, 0, 120, 1024, (1024/caveImg.width)*caveImg.height );

		wirectx.globalCompositeOperation = 'soft-light';
		wirectx.drawImage( fingerCanvas, 0, 0, width, height );

		ctx.globalCompositeOperation = 'lighten';
		ctx.drawImage( wireCanvas, 0, 0, width, height );

		// ctx.globalCompositeOperation = 'soft-light';
		// ctx.drawImage( fingerCanvas, 0, 0, width, height );
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
		console.log( 'receved socket message: ' + json.type );

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
				menu = new Menu({boxTouchCallback:effectChosen});
				menu.init( effectInfo3D );
				menu.close(true);
				// menu.hide(true);
			}
			else if ( remoteNum == 3 || remoteNum == 4 ) {
				menu.kill();
				menu = new Menu({boxTouchCallback:effectChosen});
				menu.init( effectInfo2D );
				menu.close(true);
				// menu.hide(true);
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
			activate(json.effectType);
		}
		else if ( json.type == 'deactivate' ) {
			console.log( 'received deactivate message' );
			deactivate(json);
		}
		else if ( json.type == 'reload' ) {
			location.reload();
		}
	}

	function activate(effectType) {
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

		console.log( 'activating -- effect index: ' + chosenEffectIndex + ' type: ' + effectType );
		var instruction = effectType=='3D'?effectInfo3D[chosenEffectIndex].instruction:effectInfo2D[chosenEffectIndex].instruction;
		$('#effect-instruction').html(instruction).delay(1000).fadeIn().delay(10000).fadeOut();

		menu.close();
		countdown.slideOut();
		$('#welcome').fadeOut();
		$('#effectChosen').fadeOut();
		$('#big-countdown').delay(1000).fadeOut();

		isActive = true;
	}

	function deactivate( json ) {
		// fade out cave
		// $('#canvas').fadeOut(1000);
		$('#canvas').css({
			'-webkit-filter': 'brightness(0%)',
			// '-webkit-transition': '-webkit-filter 1s linear 1s'
			'-webkit-transition': '-webkit-filter .5s'
		})
		.on( 'webkitTransitionEnd', function(e) {
			$(this)
			.off( 'webkitTransitionEnd' )
			.css({visibility:'hidden'});
		});
		// bring out the countdown
		// countdown.slideIn();
		$('#big-countdown').hide();
		menu.close();
		countdown.slideOut();
		countdown.begin( json.countdownLength );
		welcomeLength = json.welcomeLength;

		$('#goaway').fadeIn();
		$('#goaway').on( 'touchstart', killGoAway );
		goAwayTimeout = setTimeout( killGoAway, 1000 * json.leaveLength );
		
		// bring out the menu
		// menu.show();
		isActive = false;
	}

	function doWelcome() {

		$('#welcome').fadeIn();
		$('#welcome').on( 'touchstart', killWelcome );
		welcomeTimeout = setTimeout( killWelcome, 1000 * welcomeLength );
	}

	function killGoAway() {
		clearTimeout( goAwayTimeout );
		$('#goaway')
		.off( 'touchstart' )
		.fadeOut();

		doWelcome();
	}

	function killWelcome() {
		clearTimeout( welcomeTimeout );

		$('#welcome')
		.off( 'touchstart' )
		.fadeOut();

		countdown.slideIn();
		menu.open();
	}

	function killChosen() {
		$('#effectChosen')
		.off( 'touchstart' )
		.fadeOut();

		countdown.slideIn();
		menu.open();
	}

	function effectChosen( menuBox ) {

		chosenEffectName = menuBox.attr( 'effect-name' );
		chosenEffectIndex = menuBox.attr( 'index' );
		console.log( 'effectChosen: ' + menuBox.attr( 'effect-name' ) + ' at index ' + menuBox.attr( 'index' ) );
		menu.close();
		countdown.slideOut();
		$('#chosenEffectName').html( menuBox.attr( 'effect-name' ) );
		$('#effectChosen').on( 'touchstart', killChosen );
		$('#effectChosen').fadeIn();
		sendSocketMessage(JSON.stringify({
			type: 'effectChosen',
			name: chosenEffectName,
			index: chosenEffectIndex
		}));
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

		wireCanvas.width = width;
		wireCanvas.height = height;
	}

	function sendSocketMessage( jsonString ) {
		if ( socket.readyState == WebSocket.OPEN ) {
			// console.log( 'sending socket message: ' + JSON.parse(jsonString).type );
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