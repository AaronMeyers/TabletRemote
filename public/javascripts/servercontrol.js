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

	// $('.btn').button();


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

	// $('.active3DToggle').change(function() {
	$('.active3DButton').click(function() {
		if ( $(this).hasClass( 'btn-success' ) )
			return;
		var remoteNum = $(this).attr('remote');
		sendSocketMessage(JSON.stringify({
			type: 'setRemote3D',
			num: remoteNum
		}));
	});

	$('.active2DButton').click(function(){
		if ( $(this).hasClass('btn-success') )
			return;
		var remoteNum = $(this).attr('remote');
		sendSocketMessage(JSON.stringify({
			type: 'setRemote2D',
			num: remoteNum
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
			var remoteBox = $('#remoteBox'+(i+1));

			$('#remoteStatus'+(i+1)).html( remotes[i].connected?'CONNECTED':'DISCONNECTED' );
			$('#remoteStatus'+(i+1)).addClass( remotes[i].connected?'label-success':'label-danger' );
			$('#remoteStatus'+(i+1)).removeClass( remotes[i].connected?'label-danger':'label-success' );

			if ( remotes[i].connected ) {
				remoteBox.find('.btn').removeAttr( 'disabled' );
				var is3D = remotes[i].remote3D;
				var is2D = remotes[i].remote2D;
				remoteBox.find('.active3DButton').addClass( is3D?'btn-success':'' ).removeClass( is3D?'':'btn-success');
				remoteBox.find('.active2DButton').addClass( is2D?'btn-success':'' ).removeClass( is2D?'':'btn-success');
			}
			else {
				remoteBox.find('.btn').attr( 'disabled', 'disabled' ).removeClass( 'btn-success' );
			}
		}

	}
});