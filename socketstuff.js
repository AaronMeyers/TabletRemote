module.exports = function( params ) {

	var stuff = {};
	// create websocket stuff
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

	wss.on('connection', function(ws) {
		var id = socketCounter++;
		ws.id = id;
		ws.remoteNum = 0;
		ws.serverControl = false;
		ws.removeControl = false;
		sockets[id] = ws;
		console.log( 'connection opened to ' + ws.id );

		ws.on('message', function(message) {
			// HANDLE INCOMING MESSAGES
			var json = JSON.parse( message );

			if ( json.type == 'touchCoord' ) {
				console.log( 'touch: ' + json.x + ', ' + json.y );
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
				ws.serverControl = true;
				ws.send( JSON.stringify(json) );
			}
			else if ( json.type == 'setOscInfo' ) {
				if ( validateIpAndPort( json.oscInfo ) ) {
					console.log( 'valid osc info' );
					var parts = json.oscInfo.split( ':' );
					oscAddress = parts[0];
					oscPort = parts[1];
				}
				else
					console.log( 'invalid' );
				json.oscInfo = oscAddress + ':' + oscPort;
				ws.send( JSON.stringify( json ) );
			}
		});

		ws.on('close', function() {
			console.log( 'socket closed with id: ' + ws.id );
			delete sockets[ws.id];
		});
	});

	function sendRemoteStatuses() {

		var remoteInfos = new Array();
		// fill in whatever info about each remote we want to send
		for ( var i=0; i<remotes.length; i++ ) {
			remoteInfos.push({
				connected: remotes[i]!=undefined
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
			else
				console.log( s + ' not server control' );
		}

		var outport = 12000;
		var buf = osc.toBuffer({
			address: '/heartbeat',
			args: [
				12,
				'sttttring',
				new Buffer( 'beat' ),
				{type: 'integer', value: 7}
			]
		});
		udp.send( buf, 0, buf.length, outport, '127.0.0.1' );
	}

	function removeRemote( ws ) {
		if ( ws.remoteNum > 0 && remotes[ws.remoteNum-1] == ws ) {
			remote[ws.remoteNum-1] = undefined;
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

		// console.log( 'remote set to ' + num );
		// for ( var i=0; i<remotes.length; i++ ) {
		// 	if ( remotes[i] == undefined )
		// 		console.log( i + ' -- undefined' );
		// 	else if ( remotes[i] == null )
		// 		console.log( i + ' -- null' );
		// 	else
		// 		console.log( i + ' -- something' );
		// }
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

	return stuff;
}