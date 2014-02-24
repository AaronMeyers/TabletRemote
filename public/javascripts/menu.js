var menu = {
	retracted: false,
	transitioning: false,
	itemWidth: 800,
	itemHeight: 150,

	close: function() {
		$('.menu-item').css({
			width: '170px',
			'-webkit-transition': 'width .5s ease-in-out'
		});
		$('#menu-button').css({
			background: 'white',
			'-webkit-transition': 'background 1s'
		});
		$('#menu-button').on( 'webkitTransitionEnd', function(e) {
			$(this).off( 'webkitTransitionEnd' );
			menu.retracted = true;
			menu.transitioning = false;
		});
		menu.transitioning = true;
	},

	open: function() {
		$('.menu-item').css({
			width: this.itemWidth+'px',
			'-webkit-transition': 'width .5s ease-in-out'
		});
		$('#menu-button').css({
			background: 'black',
			'-webkit-transition': 'background .5s'
		});
		$('#menu-button').on( 'webkitTransitionEnd', function(e) {
			$(this).off( 'webkitTransitionEnd' );
			menu.retracted = false;
			menu.transitioning = false;
		});
		menu.transitioning = true;
	},

	hide: function() {
		this.close();
		$('#menu').css({
			left: '-400px',
			'-webkit-transition': 'left 1s ease-in-out'
		});
	},

	show: function( open ) {
		if ( open )
			this.open();
		$('#menu').css({
			left: '-100px',
			'-webkit-transition': 'left .5s ease-in-out'
		});
	}

};

$(document).on( 'ready', function() {

	$(document).on( 'touchmove', function( e ) {
		e.preventDefault();
	});

	var numItems = 10 * 2;
	var menuItems = [];

	$('#menu').css( '-webkit-transform', 'translateY( ' + window.innerHeight / 2 + 'px )' );


	var trackTime;
	var trackIdentifier;
	var trackX, trackY;
	var trackRotationOffset = 0;
	var trackVelocity = 0.0;
	var maxTrackVelocity = 1.0;
	var trackFrameRate = 1000 / 60;

	initMenu();
	scrollMenu();

	function startTracking( touchEvent ) {
		var touch = touchEvent.changedTouches[0];
		trackIdentifier = touch.identifier;
		trackX = touch.clientX;
		trackY = touch.clientY;
		trackTime = touchEvent.timeStamp;

		$(window).on( 'touchmove', function(e) {
			// find the changed touch
			for ( var i=0; i<e.originalEvent.changedTouches.length; i++ ) {
				var touchEvent = e.originalEvent;
				var touch = touchEvent.changedTouches[i];
				if ( touch.identifier == trackIdentifier ) {
					var deltaY = touch.clientY - trackY;
					trackY = touch.clientY;
					var deltaTime = touchEvent.timeStamp - trackTime;
					trackTime = touchEvent.timeStamp;

					trackVelocity += deltaY * .025;
				}
			}
		});

		$(window).on( 'touchend', function(e) {
			$(window).off( 'touchend' );
			$(window).off( 'touchmove' );
		});
	}

	function scrollMenu() {

		// if ( trackVelocity == 0 )
		// 	return;
		// console.log( 'scrollMenu' );

		trackRotationOffset += trackVelocity;
		trackVelocity *= .75;

		for ( var i=0; i<menuItems.length; i++ ) {
			var item = menuItems[i];
			var parent = item.parent();
			var rotation = ( ( i / menuItems.length ) * 360 + trackRotationOffset ) % 360;
			var z = (rotation+90) % 360;
			item.css({
				'-webkit-transform': 'rotate( ' + rotation + 'deg ) translate3d( 0px, 0px, ' + z + 'px )',
			});
			item.attr( 'rotation', rotation );
		}

		if ( requestAnimationFrame )
			requestAnimationFrame( scrollMenu, trackFrameRate );
		else
			setTimeout( scrollMenu, trackFrameRate );
	}

	function initMenu() {

		for ( var i=0; i<numItems; i++ ) {
			var clone = $('#clonable-menu-item').clone();
			clone.attr( 'id', 'item'+i );
			var item = clone.find('.menu-item');
			var itemNum = (i%10+1);

			item.html( itemNum.toString() );
			var rotation = ( i / numItems ) * 360 + trackRotationOffset;
			item.css({
				visibility: 'visible',
				width: menu.itemWidth,
				height: menu.itemHeight,
				top: -menu.itemHeight/2,
				// 'z-index': rotation
				// '-webkit-transform': 'rotateZ( ' + rotation + 'deg )'
			});
			item.attr( 'item-num', itemNum );
			$('#menu').append( clone );
			menuItems.push( item );
		}

		$('#menu-button').on( 'touchstart', function(e) {
			if ( menu.transitioning )
				return;

			if ( menu.retracted )
				menu.open();
			else
				menu.close();
		});

		$('.menu-item').on( 'touchstart', function(e) {
			console.log( 'item touch start: ' + $(this).attr( 'item-num' ) + ' rotation: ' + $(this).attr( 'rotation' ) );
			// console.log( $(this).css( '-webkit-transform' ) );
		});

		$('.menu-item').on( 'touchend', function(e) {
			// console.log( 'item touch end: ' + $(this).attr( 'item-num' ) );
		});

		$('#menu-bg').on( 'touchstart', function(e) {
			startTracking( e.originalEvent );
		});
	}
});