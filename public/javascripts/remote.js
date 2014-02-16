var socket;

$(document).on( 'ready', function() {

	var serverAddress = location.host.split( ":" )[0];
	socket = new WebSocket("ws://" + serverAddress + ":8080");
	socket.onopen = onSocketOpen;
	socket.onmessage = function( message ) {

		var json = JSON.parse( message.data );
		if ( json.type == 'setRemoteNum' ) {

			// $('#settingsPanel').fadeOut();

		}

	}

	// socket.onmessage = function (event) {
	// 	console.log(event.data);
	// }

	$(window).on( 'mousedown', onTouchDown );
	$(window).on( 'mouseup', onTouchUp );
	$(window).on( 'mousemove', onTouchMove );

	$('.remoteNumButton').on( 'click', function( event ) {
		var num = parseInt( event.target.innerHTML );
		console.log( num );
		sendSocketMessage( JSON.stringify({
			type: 	'setRemoteNum',
			num: 	num
		}) );

	});

	var isTouched = false;

	function sendSocketMessage( jsonString ) {
		if ( socket.readyState == WebSocket.OPEN ) {
			socket.send( jsonString );
		}
		else {
			console.log( 'socket wasn\'t ready' );
		}
	}

	function onSocketOpen() {
		$('#settingsPanel').fadeIn();
	}

	function onTouchDown( event ) {
		isTouched = true;
	}

	function onTouchUp( event ) {
		isTouched = false;
	}

	function onTouchMove( event ) {
		if ( isTouched ) {
			sendSocketMessage( JSON.stringify({
				type: 	'touchCoord',
				x: 		event.clientX,
				y: 		event.clientY
			}) );


		}
	}

});