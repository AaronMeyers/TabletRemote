module.exports = function( params ) {

	var stuff = {};
	// create websocket stuff
	var fs = require('fs');
	var DMX = require('dmx');
	var dmx = new DMX();

	var universe = dmx.addUniverse('demo', 'enttec-usb-dmx-pro', 0);
	// var universe = dmx.addUniverse('demo', 'null');

	// universe.update({0: 1, 1: 0});
	// universe.update({15: 1, 16: 255});
	// universe.update({1: 255, 3: 120, 4: 230, 5: 30, 6: 110, 7: 255, 8: 10, 9: 255, 10: 255, 11: 0});

	console.log( dmx );

	var WebSocket = require('ws');
	// var WebSocketServer = require('ws').Server
	var WebSocketServer = WebSocket.Server
	, wss = new WebSocketServer({port: 8080});
	// create osc stuff
	var osc = require('osc-min')
	, dgram = require('dgram')
	, udp = dgram.createSocket( 'udp4' );

	var sockets = {};
	var socketCounter = 0;
	var remotes = new Array( 4 );
	var turnLength = 90;
	var welcomeLength = 15;
	var exitLength = 15;
	var turnTicks = 0;
	var autoSequence = true;
	var turnTickIntervalId;
	stuff.remotes = remotes;

	var oscAddress = '127.0.0.1';
	var oscPort = '12000';
	var touchInterval = 20;
	var heartbeat = true;
	var remoteAddresses = new Array(4);

	var activeRemote3DIndex;
	var activeRemote2DIndex;

	loadSettings();

	function loadSettings() {
		fs.readFile( 'settings.json', function(err, data) {
			if ( err )
				console.log( err );
			else {
				var settings = JSON.parse( data );
				oscAddress = settings.oscAddress;
				oscPort = settings.oscPort;
				heartbeat = settings.heartbeat;
				touchInterval = settings.touchInterval;
				autoSequence = settings.autoSequence;
				welcomeLength = settings.welcomeLength;
				turnLength = settings.turnLength;
				exitLength = settings.exitLength;
			}
		});
	}

	function saveSettings() {
		var settings = JSON.stringify({
			oscAddress: oscAddress,
			oscPort: oscPort,
			heartbeat: heartbeat,
			touchInterval: touchInterval,
			autoSequence: autoSequence,
			welcomeLength: welcomeLength,
			turnLength: turnLength,
			exitLength: exitLength
		}, null, 4);
		fs.writeFile( 'settings.json', settings, function(err) {
			if ( err )
				console.log( 'error saving settings' );
		});
	}

	wss.on('connection', function(ws) {
		var id = socketCounter++;
		ws.id = id;
		ws.remoteNum = 0;
		ws.serverControl = false;
		ws.removeControl = false;
		ws.remote3D = false;
		ws.remote2D = false;
		ws.effectIndex = 0;
		ws.deviceName = '';
		sockets[id] = ws;
		// console.log( 'connection opened to ' + ws.id + ' at ' + ws.url );
		console.log( 'made a connection' );
		console.log( 'web socket remoteAddress: ' + ws._socket.remoteAddress );

		ws.on( 'message', ws.onSocketMessage.bind(ws) );

		ws.on('close', function() {
			console.log( 'socket closed with id: ' + ws.id );
			// if its a remote, clean it up
			for ( var i=0; i<remotes.length; i++ ) {
				if ( remotes[i] == ws )
					remotes[i] = undefined
			}
			delete sockets[ws.id];
			sendRemoteStatuses( false );
		});
	});

	WebSocket.prototype.onSocketMessage = function( message ) {

		var json = JSON.parse( message );

		// console.log( 'received socket message: ' + json.type );

		if ( json.type == 'touchCoord' ) {

			if ( this.remote3D ) {
				sendOscTouch( '/touch3D', json.phase, json.index, json.x, json.y, json.w, json.h );
			}
			if ( this.remote2D ) {
				sendOscTouch( '/touch2D', json.phase, json.index, json.x, json.y, json.w, json.h );
			}
		}
		else if ( json.type == 'setRemoteNum' ) {
			setRemoteNum( this, json.num );
			this.send( message );
		}
		else if ( json.type == 'registerRemoteControl' ) {
			console.log( 'registered a remote control: ' + json.name );
			this.deviceName = json.name;
			this.remoteControl = true;
			this.send( message );

			// temporary solution for auto-assigning remote #'s and making them active
			// first find the next available slot
			var remoteNum;
			var remote3D = false;
			var remote2D = false;
			for ( var i=0; i<remotes.length; i++ ) {
				if ( remotes[i] == undefined && remoteNum == undefined )
					remoteNum = i+1;
				if ( remotes[i] != undefined && remotes[i].remote3D )
					remote3D = true;
				if ( remotes[i] != undefined && remotes[i].remote2D )
					remote2D = true;
			}

			if ( json.name.split('aaRemote').length > 1 ) {
				remoteNum = parseInt(json.name.split('aaRemote')[1]);
			}

			setRemoteNum( this, remoteNum );
			this.send(JSON.stringify({
				type: 'setRemoteNum',
				num: remoteNum
			}));
			// if there is not active 3D remote, activate this one
			if ( !remote3D && (remoteNum == 1 || remoteNum == 2 ) ) {
				setRemote3D( this );
				sendRemoteStatuses();
			}
			else if ( !remote2D && (remoteNum == 3 || remoteNum == 4 ) ) {
				setRemote2D( this );
				sendRemoteStatuses();
			}
			// next make it active
		}
		else if ( json.type == 'registerServerControl' ) {
			console.log( 'registered a server control' );
			json.oscAddress = oscAddress;
			json.oscPort = oscPort;
			json.heartbeat = heartbeat;
			json.touchInterval = touchInterval;
			json.autoSequence = autoSequence;
			json.welcomeLength = welcomeLength;
			json.turnLength = turnLength;
			json.exitLength = exitLength;
			this.serverControl = true;
			this.send( JSON.stringify(json) );
			sendRemoteStatuses();
		}
		else if ( json.type == 'setHeartbeat' ) {
			heartbeat = json.heartbeat;
			saveSettings();
			this.send( message );
		}
		else if ( json.type == 'setAutoSequence' ) {
			autoSequence = json.autoSequence;
			saveSettings();
			this.send( message );
		}
		else if ( json.type == 'setTouchInterval' ) {
			// validate the touch interval
			var regex = /[0-9]|\./;
			if ( regex.test( json.touchInterval ) )
				touchInterval = json.touchInterval;
			else
				console.log ('invalid touch interval' );
			json.touchInterval = touchInterval;
			saveSettings();
			this.send( JSON.stringify( json ) );
		}
		else if ( json.type == 'setTurnLength' ) {
			turnLength = json.value;
			saveSettings();
			this.send( JSON.stringify( json ) );
		}
		else if ( json.type == 'setWelcomeLength' ) {
			welcomeLength = json.value;
			saveSettings();
			this.send( JSON.stringify( json ) );
		}
		else if ( json.type == 'setExitLength' ) {
			exitLength = json.value;
			saveSettings();
			this.send(JSON.stringify(json));
		}
		else if ( json.type == 'setOscInfo' ) {
			if ( validateIpAndPort( json.oscInfo ) ) {
				console.log( 'valid osc info' );
				var parts = json.oscInfo.split( ':' );
				oscAddress = parts[0];
				oscPort = parts[1];
				saveSettings();
			}
			else
				console.log( 'invalid' );
			json.oscInfo = oscAddress + ':' + oscPort;
			this.send( JSON.stringify( json ) );
		}
		else if ( json.type == 'setRemote3D' ) {
			setRemote3D( remotes[json.num-1] );
			sendRemoteStatuses();
		}
		else if ( json.type == 'setRemote2D' ) {
			setRemote2D( remotes[json.num-1] );
			sendRemoteStatuses();
		}
		else if ( json.type == 'showSettings' ) {
			if ( remotes[json.num-1] != undefined ) {
				remotes[json.num-1].send(JSON.stringify({
					type: 'showSettings'
				}));
			}
		}
		else if ( json.type == 'startCountdown' ) {
			if ( remotes[json.num-1] != undefined ) {
				remotes[json.num-1].send(JSON.stringify({
					type: 'startCountdown',
					length: turnLength
				}));
			}
		}
		else if ( json.type == 'activateRemotes' ) {
			var remote3DIndex = json.remote3D - 1;
			var remote2DIndex = json.remote2D - 1;

			activateRemotes( remote3DIndex, remote2DIndex );
		}
		else if ( json.type == 'reloadRemotes' ) {

			clearTimeout( turnTickIntervalId );

			remotes.forEach(function(r){
				if ( !r )
					return;
				if ( r.readyState != WebSocket.OPEN )
					return;
				r.send(JSON.stringify({
					type: 'reload'
				}));
			});
		}
		else if ( json.type == 'effectChosen' ) {
			console.log( 'remote ' + (remotes.indexOf(this)+1) + ' chose ' + json.name + ' at index ' + json.index );
			this.effectIndex = json.index;
		}
	}

	function countdownTick() {
		turnTicks++;
		console.log( 'countdown tick: ' + turnTicks + '/' + turnLength );
		if ( turnTicks >= turnLength ) {
			if ( autoSequence ) {
				console.log( 'time to switch!' );
				var newRemote3DIndex = activeRemote3DIndex==0?1:0;
				var newRemote2DIndex = activeRemote2DIndex==3?2:3;
				activateRemotes( newRemote3DIndex, newRemote2DIndex );
			}
		}
		else {
			turnTickIntervalId = setTimeout( countdownTick, 1000 );
		}

	}

	function activateRemotes( remote3DIndex, remote2DIndex ) {

		console.log( 'activating 3D on index ' + remote3DIndex );
		console.log( 'activating 2D on index ' + remote2DIndex );

		clearTimeout( turnTickIntervalId );

		// ensure the right remotes get switched off
		var deactivate3DIndex = remote3DIndex==0?1:0;
		var deactivate2DIndex = remote2DIndex==3?2:3;

		var deactivationMsg = JSON.stringify({
				type: 'deactivate',
				countdownLength: turnLength,
				welcomeLength: welcomeLength,
				exitLength: exitLength
		});

		// send the old remotes deactivation messages
		if ( remotes[deactivate3DIndex] ) {
			remotes[deactivate3DIndex].send(deactivationMsg);
		}
		if ( remotes[deactivate2DIndex] ) {
			remotes[deactivate2DIndex].send(deactivationMsg);
		}

		// send the remotes activation messages
		if ( remotes[remote3DIndex] ) {
			setRemote3D( remotes[remote3DIndex] );
			remotes[remote3DIndex].send(JSON.stringify({
				type: 'activate',
				effectType: '3D'
			}));
			sendOscEffectChange( '/effect3D', remotes[remote3DIndex].effectIndex );
		}
		if ( remotes[remote2DIndex] ) {
			setRemote2D( remotes[remote2DIndex] );
			remotes[remote2DIndex].send(JSON.stringify({
				type: 'activate',
				effectType: '2D'
			}));
			sendOscEffectChange( '/effect2D', remotes[remote2DIndex].effectIndex );
		}

		turnTicks = 0;
		turnTickIntervalId = setTimeout( countdownTick, 1000 );

		sendRemoteStatuses();

	}

	function sendRemoteStatuses( messageRemotes ) {

		messageRemotes = ( typeof messageRemotes === 'undefined' ) ? true : messageRemotes;

		var remoteInfos = new Array();
		// fill in whatever info about each remote we want to send
		for ( var i=0; i<remotes.length; i++ ) {
			var exists = remotes[i]!=undefined;
			if ( exists ) {
				// console.log( 'socket ' + remotes[i]._socket.remoteAddress );
				// console.log( 'socket address: ' + remotes[i].address );
			}
			remoteInfos.push({
				connected: exists,
				address: exists?remotes[i].address:undefined,
				remote3D: exists?remotes[i].remote3D:false,
				remote2D: exists?remotes[i].remote2D:false,
				ip: exists?remotes[i]._socket.remoteAddress:'0.0.0.0',
				deviceName: exists?remotes[i].deviceName:''
			});
		}

		// this is for sending info about the remotes to server control pages
		for ( s in sockets ) {
			if ( sockets[s].serverControl ) {
				console.log( s + ' server control' );
				sockets[s].send( JSON.stringify({
					type: 'remoteInfo',
					remotes: remoteInfos
				}));
			}
		}

		if ( messageRemotes ) {
			// this is for sending each remote its status as active or inactive
			for ( var i=0; i<remotes.length; i++ ) {
				if ( remotes[i] == undefined || remotes[i].readyState != WebSocket.OPEN )
					continue;

				// console.log( Object.keys(remotes[i]) );
				remotes[i].send(JSON.stringify({
					type: 'setActive',
					active: remotes[i].remote3D || remotes[i].remote2D,
					touchInterval: touchInterval
				}));
			}
		}
	}

	function removeRemote( ws ) {
		if ( ws.remoteNum > 0 && remotes[ws.remoteNum-1] == ws ) {
			remote[ws.remoteNum-1] = undefined;
		}
	}

	function setRemote3D( ws ) {
		if ( ws == undefined ) {
			console.log( 'remote for 3D was undefined')
			return;
		}
		ws.remote3D = true;
		// make sure no other remotes have their remote3D flag on
		for ( var i=0; i<remotes.length; i++ ) {
			if ( remotes[i] != undefined && remotes[i].remote3D && remotes[i] != ws ) 
				remotes[i].remote3D = false;
		}
		activeRemote3DIndex = remotes.indexOf( ws );
	}
	function setRemote2D( ws ) {
		if ( ws == undefined ) {
			console.log( 'remote for 2D was undefined')
			return;
		}
		ws.remote2D = true;
		// make sure no other remotes have their remote3D flag on
		for ( var i=0; i<remotes.length; i++ ) {
			if ( remotes[i] != undefined && remotes[i].remote2D && remotes[i] != ws ) 
				remotes[i].remote2D = false;
		}
		activeRemote2DIndex = remotes.indexOf( ws );
	}

	function setRemoteNum( ws, num ) {
		if ( ws.remoteNum > 0 ) {
			if ( remotes[ws.remoteNum-1] == ws ) {
				console.log( 'switching off old remote' );
				remotes[ws.remoteNum-1] = undefined;
			}
		}
		ws.remoteNum = num;
		remotes[num-1] = ws;
		sendRemoteStatuses();
	}

	function validateIpAndPort(input) {
	    var parts = input.split(":");
	    var ip = parts[0].split(".");
	    var port = parts[1];
	    return validateNum(port, 1, 65535) &&
	        ip.length == 4 &&
	        ip.every(function (segment) {
	            return validateNum(segment, 0, 255);
	        });
	}

	function validateNum(input, min, max) {
	    var num = +input;
	    return num >= min && num <= max && input === num.toString();
	}

	function sendOscEffectChange( address, index ) {
		var buf = osc.toBuffer({
			address: address,
			args: [
				index
			]
		});
		var thePort = (address=='/effect3D'?parseInt(oscPort):parseInt(oscPort)+10) + 9;

		udp.send( buf, 0, buf.length, thePort, oscAddress );
	}

	function sendOscTouch( address, phase, index, x, y, w, h ) {
		if ( index > 8 ) // ignoring fingers 9 and 10
			return;

		console.log( 'the phase: ' + phase + ' the index: ' + index + ' the x: ' + x + ' the y: ' + y );

		var buf = osc.toBuffer({
			address: address,
			args: [
				phase,
				x,
				y,
				w,
				h
			]
		});
		var thePort = (address=='/touch3D'?parseInt(oscPort):parseInt(oscPort)+10) + index;
		console.log( 'the port: ' + thePort + ' the address ' + address );

		udp.send( buf, 0, buf.length, thePort, oscAddress );
	}

	function sendOscHeartbeat() {
		if ( !heartbeat )
			return;

		var epoch = (new Date()).getTime().toString();
		var buf = osc.toBuffer({
			address: '/heartbeat',
			args: [
				epoch
			]
		});
		udp.send( buf, 0, buf.length, oscPort, oscAddress );
	}

	setInterval( sendOscHeartbeat, 1000 );

	return stuff;
}