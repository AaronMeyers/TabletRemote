$(document).on( 'ready', function() {

	var serverAddress = location.host.split( ":" )[0];
	socket = new WebSocket("ws://" + serverAddress + ":8080");
	socket.onopen = onSocketOpen;
	socket.onmessage = function( message ) {
		var json = JSON.parse( message.data );
		if ( json.type == 'registerServerControl' ) {
			var oscInfo = json.oscAddress + ':' + json.oscPort;
			$('#oscAddressInput').val( oscInfo );
			$('#controlPanel').fadeIn();
			$('#heartbeatToggle').prop( 'checked', json.heartbeat?'checked':'' );
		}
		else if ( json.type == 'remoteInfo' ) {
			updateRemoteInfo( json.remotes );
		}
		else if ( json.type == 'setOscInfo' ) {
			console.log( 'osc info: ' + json.oscInfo );
			$('#oscAddressInput').val( json.oscInfo );
			$('#oscAddressInput').removeAttr( 'disabled' );
			$('#oscAddressButton').removeAttr( 'disabled' );
		}
		else if ( json.type == 'setHeartbeat' ) {
			$('#heartbeatToggle').prop( 'checked', json.heartbeat?'checked':'' );
		}
	}


	$('#oscAddressInput').bind( 'enterKey', oscInfoEntered );
	$('#oscAddressInput').keyup(function(e){
		if ( e.keyCode == 13 ) {
			$(this).trigger('enterKey');
			e.preventDefault();
		}
	});
	$('#oscAddressButton').on( 'click', oscInfoEntered );

	$('#heartbeatToggle').change(function() {
		console.log( 'heartbeat toggled: ' + $(this).is(':checked') );
		sendSocketMessage( JSON.stringify({
			type: 'setHeartbeat',
			heartbeat: $(this).prop('checked')
		}));
	});

	// disable form submit behavior
	$('form').submit( function(e) {
		e.preventDefault();
		return false;
	});

	function oscInfoEntered() {
		console.log( 'oscInfoEntered' );
		$('#oscAddressInput').blur();
		$('#oscAddressButton').blur();
		$('#oscAddressInput').attr( 'disabled', 'disabled' );
		$('#oscAddressButton').attr( 'disabled', 'disabled' );
		sendSocketMessage( JSON.stringify({
			type: 'setOscInfo',
			oscInfo: $('#oscAddressInput').val()
		}));
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