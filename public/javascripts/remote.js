var socket;

$(document).on( 'ready', function() {

	var remoteNum = 0;
	var isActive = false;
	var touchInterval = 20;
	var touchX = 0, touchY = 0;
	var touchIntervalId;

	var mobileClient =  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

	var width, height;

	$(document).on( 'touchstart', function( e ) {
		// e.preventDefault();
	});
	$(document).on( 'touchmove', function( e ) {
		e.preventDefault();
	});

	var serverAddress = location.host.split( ":" )[0];
	socket = new WebSocket("ws://" + serverAddress + ":8080");
	socket.onopen = onSocketOpen;
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

	if ( mobileClient ) {
		$('.iphone').on( 'touchstart', onTouchDown );
		$(window).on( 'touchend', onTouchUp );
		$(window).on( 'touchmove', onTouchMove );
	}
	else {
		$('.iphone').on( 'mousedown', onTouchDown );
		$(window).on( 'mouseup', onTouchUp );
		$(window).on( 'mousemove', onTouchMove );
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

	var isTouched = false;

	function onResize( e ) {
		width = $(window).width(),
		height = $(window).height();

		$('.iphone').css({
			width: width,
			height: height
		});
	}

	function sendSocketMessage( jsonString ) {
		if ( socket.readyState == WebSocket.OPEN ) {
			socket.send( jsonString );
		}
		else {
			console.log( 'socket wasn\'t ready' );
		}
	}

	function onSocketOpen() {
		sendSocketMessage( JSON.stringify({
			type: 	'registerRemoteControl'
		}));
	}

	function onTouchDown( event ) {
		console.log( 'on touch down' );
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

	function sendTouch( phase ) {
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

});