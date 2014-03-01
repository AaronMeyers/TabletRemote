module.exports = function( params ) {

	var stuff = {};
	// create websocket stuff
	var fs = require('fs');

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
	var turnLength = 15;
	var welcomeLength = 5;
	var turnTicks = 0;
	var autoSequence = true;
	var turnTickIntervalId;
	stuff.remotes = remotes;

	var oscAddress = '127.0.0.1';
	var oscPort = '12000';
	var touchInterval = 20;
	var heartbeat = true;

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
			}
		});
	}

	function saveSettings() {
		var settings = JSON.stringify({
			oscAddress: oscAddress,
			oscPort: oscPort,
			heartbeat: heartbeat,
			touchInterval: touchInterval,
			autoSequence: autoSequence
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
		sockets[id] = ws;
		// console.log( 'connection opened to ' + ws.id + ' at ' + ws.url );
		console.log( 'made a connection' );
		console.log( 'web socket connected at ' + ws._socket.remoteAddress );

		ws.on('message', function(message) {
			// HANDLE INCOMING MESSAGES
			var json = JSON.parse( message );

			if ( json.type == 'touchCoord' ) {

				// if ( json.phase == 'start' )
				// 	console.log( 'touch started');
				// if ( json.phase == 'end' )
				// 	console.log( 'touch ended' );

				if ( ws.remote3D ) {
					sendOscTouch( '/touch3D', json.phase, json.index, json.x, json.y, json.w, json.h );
				}
				if ( ws.remote2D ) {
					sendOscTouch( '/touch2D', json.phase, json.index, json.x, json.y, json.w, json.h );
				}
			}
			else if ( json.type == 'setRemoteNum' ) {
				// console.log ( 'sockets length: ' + sockets.length );
				setRemoteNum( ws, json.num );
				ws.send( message );
			}
			else if ( json.type == 'registerRemoteControl' ) {
				console.log( 'registered a remote control' );
				ws.remoteControl = true;
				ws.send( message );

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

				console.log( 'remote3D: ' + remote3D );
				console.log( 'remote2D: ' + remote2D );
				setRemoteNum( ws, remoteNum );
				ws.send(JSON.stringify({
					type: 'setRemoteNum',
					num: remoteNum
				}));
				// if there is not active 3D remote, activate this one
				if ( !remote3D ) {
					setRemote3D( ws );
					sendRemoteStatuses();
				}
				else if ( !remote2D ) {
					setRemote2D( ws );
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
				ws.serverControl = true;
				ws.send( JSON.stringify(json) );
				sendRemoteStatuses();
			}
			else if ( json.type == 'setHeartbeat' ) {
				heartbeat = json.heartbeat;
				saveSettings();
				ws.send( message );
			}
			else if ( json.type == 'setAutoSequence' ) {
				autoSequence = json.autoSequence;
				saveSettings();
				ws.send( message );
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
				ws.send( JSON.stringify( json ) );
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
				ws.send( JSON.stringify( json ) );
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
					if ( r && r.readyState != WebSocket.OPEN )
						return;
					r.send(JSON.stringify({
						type: 'reload'
					}));
				});
			}
		});

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
				welcomeLength: welcomeLength
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
				type: 'activate'
			}));
		}
		if ( remotes[remote2DIndex] ) {
			setRemote2D( remotes[remote2DIndex] );
			remotes[remote2DIndex].send(JSON.stringify({
				type: 'activate'
			}));
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
				// console.log( 'socket address: ' + remotes[i].address );
			}
			remoteInfos.push({
				connected: exists,
				address: exists?remotes[i].address:undefined,
				remote3D: exists?remotes[i].remote3D:false,
				remote2D: exists?remotes[i].remote2D:false
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

	function sendOscTouch( address, phase, index, x, y, w, h ) {
		var buf = osc.toBuffer({
			address: address,
			args: [
				phase,
				index,
				x,
				y,
				w,
				h
			]
		});
		udp.send( buf, 0, buf.length, (address=='/touch3D'?oscPort:parseInt(oscPort)+1), oscAddress );
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