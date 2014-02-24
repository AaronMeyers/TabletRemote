$(document).on( 'ready', function() {

	var width, height;

	$(document).on( 'touchmove', function( e ) {
		e.preventDefault();
	});


	$('.iphone').on( 'touchstart', onTouchStart );
	$(window).on( 'touchmove', onTouchMove );
	$(window).on( 'touchend', onTouchEnd );

	var activeTouches = {};
	var fingerWidth = $('#clonablefinger').width();
	var fingerHeight = $('#clonablefinger').height();
	var canvas = $('#mycanvas')[0];
	var framerate = 1000/60;
	var fingerImg = $('#clonablefinger').find('img')[0];
	$(window).on( 'resize', onResize );
	onResize();


	function loop() {
		var ctx = canvas.getContext( "2d" );
		ctx.fillStyle = "rgba(0,0,0,.05)";
		ctx.fillRect( 0, 0, width, height );
		var size = 64;
		var keys = Object.keys( activeTouches );
		for ( var i=0; i<keys.length; i++ ) {
			var touch = activeTouches[keys[i]];
			ctx.drawImage( fingerImg, touch.x - size/2, touch.y - size/2, size, size );
		}

		if ( requestAnimationFrame )
			requestAnimationFrame( loop, framerate );			
		else
			setTimeout( loop, framerate );
	}
	loop();

	function onTouchStart( e ) {
		var touchEvent = e.originalEvent;
		for ( var i=0; i<touchEvent.changedTouches.length; i++ ) {
			var touch = touchEvent.changedTouches[i];

			var finger = $('#clonablefinger')
				.clone()
				.attr( 'id', 'finger' + touch.identifier )
				.css({
					top: touch.clientY - fingerHeight/2,
					left: touch.clientX - fingerWidth/2,
					display: 'block'
				});
			$('.iphone').append( finger );

			if ( activeTouches[touch.identifier] == undefined ) {
				activeTouches[touch.identifier] = {
					x: touch.clientX,
					y: touch.clientY,
					div: finger
				}
			}
		}
	}

	function onTouchMove( e ) {
		var touchEvent = e.originalEvent;
		for ( var i=0; i<touchEvent.changedTouches.length; i++ ) {
			var touch = touchEvent.changedTouches[i];
			if ( activeTouches[touch.identifier] == undefined ) {
				console.log( 'uh oh undefined touch got moved' );
			}
			else {
				var activeTouch = activeTouches[touch.identifier];
				activeTouch.x = touch.clientX;
				activeTouch.y = touch.clientY;
				// console.log( touch );
				activeTouch.div.css({
					top: touch.clientY - fingerHeight/2,
					left: touch.clientX - fingerWidth/2
				});
			}


		}
	}

	function onTouchEnd( e ) {
		var touchEvent = e.originalEvent;
		for ( var i=0; i<touchEvent.changedTouches.length; i++ ) {
			var touch = touchEvent.changedTouches[i]
			if ( activeTouches[touch.identifier] ) {
				activeTouches[touch.identifier].div.fadeOut(200, function() {
					$(this).remove();
				});
				delete activeTouches[touch.identifier];
				console.log( activeTouches );
			}
		}
	}

	function onResize( e ) {
		width = $(window).width(),
		height = $(window).height();

		$('.iphone').css({
			width: width,
			height: height
		});
		// $('#mycanvas').width( width ).height( height );
		canvas.width = width;
		canvas.height = height;
	}
});