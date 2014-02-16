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
			updateRemoteInfo( json.remotes );
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

	function updateRemoteInfo( remotes ) {

		for ( var i=0; i<remotes.length; i++ ) {
			$('#remoteStatus'+(i+1)).html( remotes[i].connected?'CONNECTED':'DISCONNECTED' );
			$('#remoteStatus'+(i+1)).addClass( remotes[i].connected?'label-success':'label-danger' );
			$('#remoteStatus'+(i+1)).removeClass( remotes[i].connected?'label-danger':'label-success' );
		}

	}
});