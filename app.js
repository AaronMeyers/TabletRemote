
/**
 * Module dependencies.
 */

var express = require('express')
  , engine = require( 'ejs-locals' )
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();
var sockets = {};
var socketCounter = 0;

var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({port: 8080});

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.engine('ejs', engine);
  // app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});



app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);
app.get( '/remote',  function( req, res ) {
  res.render( 'remote', { user: req.user });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});


wss.on('connection', function(ws) {
    var id = socketCounter++;
    ws.id = id;
    ws.remoteNum = 0;
    sockets[id] = ws;
    console.log( 'connection opened to ' + ws.id );

    ws.on('message', function(message) {
        // console.log('received from ' + ws.id + ': %s', message);

        var json = JSON.parse( message );

        if ( json.type == 'touchCoord' ) {
          console.log( 'touch: ' + json.x + ', ' + json.y );
        }

        if ( json.type == 'setRemoteNum' ) {
          console.log( 'remote set to ' + json.num );
          ws.remoteNum = json.num;
          ws.send( message );
        }
        
        // if ( json.type == 'joystick' ) {
        //   console.log( 'its a joystick message with x: ' + json.x + ' and y: ' + json.y );
        //   for ( s in sockets ) {
        //     sockets[s].send( JSON.stringify(json) );
        //   }
        // }

        if ( json.type.indexOf( 'Button' ) > -1 ) {
          for ( s in sockets ) {
            sockets[s].send( JSON.stringify(json) );
          }
        }

        // ws.send( 'i got a message from ' + ws.id + ' at ' + Date.now() );
    });
    ws.on('close', function() {
      console.log( 'socket closed with id: ' + ws.id );
      delete sockets[ws.id];
    });
});