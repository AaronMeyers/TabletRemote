$(document).on( 'ready', function() {

	var serverAddress = location.host.split( ":" )[0];
	socket = new WebSocket("ws://" + serverAddress + ":8080");
	socket.onopen = onSocketOpen;
	socket.onmessage = function( message ) {
		var json = JSON.parse( message.data );
		if ( json.type == 'registerServerControl' ) {
			$('#controlPanel').fadeIn();
		}
		else if ( json.type == 'remoteInfo' ) {
			console.log( json.remotes );
		}
	}

	function onSocketOpen() {

		console.log( 'server controls socket connection open' );
		sendSocketMessage( JSON.stringify({
			type: 	'registerServerControl'
		}));
	}

	function sendSocketMessage( jsonString ) {
		if ( socket.readyState == WebSocket.OPEN ) {
			socket.send( jsonString );
		}
		else {
			console.log( 'socket wasn\'t ready' );
		}
	}
});