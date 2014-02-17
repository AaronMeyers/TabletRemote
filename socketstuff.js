module.exports = function( params ) {

	var stuff = {};
	// create websocket stuff
	var fs = require('fs');

	var WebSocketServer = require('ws').Server
	, wss = new WebSocketServer({port: 8080});
	// create osc stuff
	var osc = require('osc-min')
	, dgram = require('dgram')
	, udp = dgram.createSocket( 'udp4' );

	var sockets = {};
	var socketCounter = 0;
	var remotes = new Array( 4 );
	stuff.remotes = remotes;

	var oscAddress = '127.0.0.1';
	var oscPort = '12000';
	var touchInterval = 20;
	var heartbeat = true;

	loadSettings();

	function loadSettings() {
		fs.readFile( 'settings.json', function(err, data) {
			if ( err )
				console.log( err );
			else {
				var settings = JSON.parse( data );
				oscAddress = settings.oscAddress;
				oscPort = settings.oscPort;
				touchInterval = settings.touchInterval;
			}
		});
	}

	function saveSettings() {
		var settings = JSON.stringify({
			oscAddress: oscAddress,
			oscPort: oscPort,
			touchInterval: touchInterval
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
		console.log( 'connection opened to ' + ws.id );

		ws.on('message', function(message) {
			// HANDLE INCOMING MESSAGES
			var json = JSON.parse( message );

			if ( json.type == 'touchCoord' ) {

				if ( ws.remote3D ) {
					sendOscTouch( '/touch3D', json.x, json.y );
				}
				if ( ws.remote3D ) {
					sendOscTouch( '/touch2D', json.x, json.y );
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
			}
			else if ( json.type == 'registerServerControl' ) {
				console.log( 'registered a server control' );
				json.oscAddress = oscAddress;
				json.oscPort = oscPort;
				json.heartbeat = heartbeat;
				json.touchInterval = touchInterval;
				ws.serverControl = true;
				ws.send( JSON.stringify(json) );
				sendRemoteStatuses();
			}
			else if ( json.type == 'setHeartbeat' ) {
				heartbeat = json.heartbeat;
				console.log( 'heartbeat: ' + heartbeat );
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
		});

		ws.on('close', function() {
			console.log( 'socket closed with id: ' + ws.id );
			// if its a remote, clean it up
			for ( var i=0; i<remotes.length; i++ ) {
				if ( remotes[i] == ws )
					remotes[i] = undefined
			}
			delete sockets[ws.id];
			sendRemoteStatuses();
		});
	});

	function sendRemoteStatuses() {

		var remoteInfos = new Array();
		// fill in whatever info about each remote we want to send
		for ( var i=0; i<remotes.length; i++ ) {
			var exists = remotes[i]!=undefined;
			remoteInfos.push({
				connected: exists,
				remote3D: exists?remotes[i].remote3D:false,
				remote2D: exists?remotes[i].remote2D:false
			});
		}

		for ( s in sockets ) {
			if ( sockets[s].serverControl ) {
				console.log( s + ' server control' );
				sockets[s].send( JSON.stringify({
					type: 'remoteInfo',
					remotes: remoteInfos
				}));
			}
		}

		for ( var i=0; i<remotes.length; i++ ) {
			if ( remotes[i] == undefined )
				continue;
			remotes[i].send(JSON.stringify({
				type: 'setActive',
				active: remotes[i].remote3D || remotes[i].remote2D,
				touchInterval: touchInterval
			}));
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

	function sendOscTouch( address, x, y ) {
		var buf = osc.toBuffer({
			address: address,
			args: [
				x,
				y
			]
		});
		udp.send( buf, 0, buf.length, oscPort, oscAddress );
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