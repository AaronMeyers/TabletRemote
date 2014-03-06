var socket;

$(document).on( 'ready', function() {
	function initWebSocket() {
		var serverAddress = location.host.split( ":" )[0];
		socket = new WebSocket("ws://" + serverAddress + ":8080");
		socket.onopen = function() {
			$('#server-panel-title').html( 'SERVER CONTROL' );

			console.log( 'server controls socket connection open' );
			sendSocketMessage(JSON.stringify({
				type: 	'registerServerControl'
			}));
		}
		socket.onclose = function() {
			if ( socket.readyState != WebSocket.OPEN ) {
				$('#server-panel-title').html( 'SERVER CONTROL - DISCONNECTED' );
			}
			var fakeRemotes = [];
			for ( var i=0; i<4; i++ )
				fakeRemotes.push( {connected:false} );
			updateRemoteInfo(fakeRemotes);

			setTimeout( initWebSocket, 1000 );
		}
		socket.onmessage = onSocketMessage;
	}
	initWebSocket();

	$('#touchIntervalInput').bind( 'enterKey', touchIntervalEntered ).keyup( enterKeyCallback );
	$('#touchIntervalButton').on( 'click', touchIntervalEntered );

	$('#turnLengthInput').bind('enterKey', valueEntered ).keyup( enterKeyCallback );
	$('#welcomeLengthInput').bind('enterKey', valueEntered ).keyup( enterKeyCallback );
	$('#exitLengthInput').bind('enterKey', valueEntered ).keyup( enterKeyCallback );
	$('#dmxChannelInput').bind('enterKey', sendDMXMessage ).keyup( enterKeyCallback ).val(100);
	$('#dmxValueInput').bind('enterKey', sendDMXMessage ).keyup( enterKeyCallback ).val(50);
	$('#sendDMXButton').bind('click', sendDMXMessage );
	$('#oscAddressInput').bind( 'enterKey', oscInfoEntered ).keyup( enterKeyCallback );

	$('#heartbeatToggle').change(function() {
		console.log( 'heartbeat toggled: ' + $(this).is(':checked') );
		sendSocketMessage( JSON.stringify({
			type: 'setHeartbeat',
			heartbeat: $(this).prop('checked')
		}));
	});
	$('#autoSequenceToggle').change(function(){
		sendSocketMessage(JSON.stringify({
			type: 'setAutoSequence',
			autoSequence: $(this).prop('checked')
		}));
	});

	$('.reloadButton').click(function() {
		sendSocketMessage(JSON.stringify({
			type: 'reloadRemotes'
		}));
	});

	$('.activationButton').click(function(){
		var remote3D = $(this).attr('remote3D');
		var remote2D = $(this).attr('remote2D');

		sendSocketMessage(JSON.stringify({
			type: 'activateRemotes',
			remote3D: remote3D,
			remote2D: remote2D
		}));
	});

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

	$('.showSettingsButton').click(function() {
		sendSocketMessage(JSON.stringify({
			type:'showSettings',
			num: $(this).attr('remote')
		}));
	});

	$('.openMenuButton').click(function() {
		sendSocketMessage(JSON.stringify({
			type:'openMenu',
			num: $(this).attr('remote')
		}));
	});

	$('.closeMenuButton').click(function() {
		sendSocketMessage(JSON.stringify({
			type:'closeMenu',
			num: $(this).attr('remote')
		}));
	});

	$('.startCountdownButton').click(function() {
		sendSocketMessage(JSON.stringify({
			type:'startCountdown',
			num: $(this).attr('remote')
		}))
	});

	// disable form submit behavior
	$('form').submit( function(e) {
		e.preventDefault();
		return false;
	});

	function sendDMXMessage() {
		var channel = $('#dmxChannelInput').blur().val();
		var value = $('#dmxValueInput').blur().val();
		sendSocketMessage(JSON.stringify({
			type: 'setDMX',
			channel: channel,
			value: value
		}));
	}

	function enterKeyCallback( e ) {
		if ( e.keyCode == 13 ) {
			$(this).trigger('enterKey');
			e.preventDefault();
		}
	}

	function onSocketMessage( message ) {
		var json = JSON.parse( message.data );
		if ( json.type == 'registerServerControl' ) {
			console.log( 'welcome length: ' + json.welcomeLength );
			var oscInfo = json.oscAddress + ':' + json.oscPort;
			$('#oscAddressInput').val( oscInfo );
			$('#controlPanel').fadeIn();
			$('#touchIntervalInput').val( json.touchInterval );
			$('#welcomeLengthInput').val( json.welcomeLength );
			$('#turnLengthInput').val( json.turnLength );
			$('#exitLengthInput').val( json.exitLength );
			$('#heartbeatToggle').prop( 'checked', json.heartbeat?'checked':'' );
			$('#autoSequenceToggle').prop( 'checked', json.autoSequence?'checked':'' );
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
		else if ( json.type == 'setTouchInterval' ) {
			$('#touchIntervalInput').val( json.touchInterval );
			$('#touchIntervalInput').removeAttr( 'disabled' );
			$('#touchIntervalButton').removeAttr( 'disabled' );
		}
		else if ( json.type == 'setHeartbeat' ) {
			$('#heartbeatToggle').prop( 'checked', json.heartbeat?'checked':'' );
		}
		else if ( json.type == 'setAutoSequence' ) {
			$('#autoSequenceToggle').prop( 'checked', json.autoSequence?'checked':'' );
		}
	}

	function touchIntervalEntered() {
		$('#touchIntervalInput').blur();
		$('#touchIntervalButton').blur();
		$('#touchIntervalInput').attr( 'disabled', 'disabled' );
		$('#touchIntervalButton').attr( 'disabled', 'disabled' );
		sendSocketMessage(JSON.stringify({
			type: 'setTouchInterval',
			touchInterval: $('#touchIntervalInput').val()
		}))
	}

	function valueEntered( e ) {
		console.log( $(this).attr('messageType') );
		$(this).blur();
		sendSocketMessage( JSON.stringify({
			type: $(this).attr('messageType'),
			value: $(this).val()
		}));
	}

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
			$('#remoteAddress'+(i+1)).html( remotes[i].ip );
			$('#deviceName'+(i+1)).html( remotes[i].deviceName );
			// $('#remoteAddress'+(i+1)).html( 'Address: ' + remotes[i].address );

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