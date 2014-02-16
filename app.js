
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

var stuff = require( './socketstuff' )();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.engine('ejs', engine);
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

// app.get('/', routes.index);
app.get( '/', function( req, res ) {
  res.render( 'index', {remotes: stuff.remotes} );
  // console.log( stuff.remotes );
  // res.render( 'index', {remotes: [0,0,1] } );
});
app.get( '/remote',  function( req, res ) {
  res.render( 'remote', { user: req.user });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

