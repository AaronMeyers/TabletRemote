function Menu() {
	this.name = "menu";
	this.retracted = false;
	this.transitioning = false;
	this.itemWidth = 800;
	this.itemHeight = 150;
	this.items = [];

	this.trackTime;
	this.trackIdentifier;
	this.trackY;
	this.trackRotationOffset = 0;
	this.trackVelocity = 0.0;
	this.trackFrameRate = 1000 / 60;
}

Menu.prototype.init = function( items ) {
	for ( var i=0; i<items.length; i++ ) {
		var clone = $('#clonable-menu-item').clone();
		clone.attr( 'id', 'item'+i );
		var item = clone.find('.menu-item');
		var itemNum = (i%10+1);

		item.html( itemNum.toString() );
		var rotation = ( i / items.length ) * 360 + this.trackRotationOffset;
		item.css({
			visibility: 'visible',
			width: this.itemWidth,
			height: this.itemHeight,
			top: -this.itemHeight/2,
			// 'z-index': rotation
			// '-webkit-transform': 'rotateZ( ' + rotation + 'deg )'
		});
		item.attr( 'item-num', itemNum );
		$('#menu').append( clone );
		this.items.push( item );
	}
	// keep menu in scope
	var menu = this;

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
		// startTracking( e.originalEvent );
		menu.startTracking( e.originalEvent );
	});

	this.scroll();
}

Menu.prototype.startTracking = function( touchEvent ) {
	// console.log( 'startTracking: ' + this.name );
	var touch = touchEvent.changedTouches[0];
	this.trackIdentifier = touch.identifier;
	this.trackY = touch.clientY;
	this.trackTime = touchEvent.timeStamp;

	// preserve menu in scope
	var menu = this;

	$(window).on( 'touchmove', function(e) {
		// find the changed touch
		for ( var i=0; i<e.originalEvent.changedTouches.length; i++ ) {
			var touchEvent = e.originalEvent;
			var touch = touchEvent.changedTouches[i];
			if ( touch.identifier == menu.trackIdentifier ) {
				var deltaY = touch.clientY - menu.trackY;
				menu.trackY = touch.clientY;
				var deltaTime = touchEvent.timeStamp - menu.trackTime;
				menu.trackTime = touchEvent.timeStamp;

				menu.trackVelocity += deltaY * .025;
			}
		}
	});

	$(window).on( 'touchend', function(e) {
		$(window).off( 'touchend' );
		$(window).off( 'touchmove' );
	});
}

Menu.prototype.scroll = function() {
	// if ( trackVelocity == 0 )
	// 	return;
	// console.log( 'scrollMenu' );

	this.trackRotationOffset += menu.trackVelocity;
	this.trackVelocity *= .75;

	for ( var i=0; i<this.items.length; i++ ) {
		var item = this.items[i];
		var parent = item.parent();
		var rotation = ( ( i / this.items.length ) * 360 + this.trackRotationOffset ) % 360;
		var z = (rotation+90) % 360;
		item.css({
			'-webkit-transform': 'rotate( ' + rotation + 'deg ) translate3d( 0px, 0px, ' + z + 'px )',
		});
		item.attr( 'rotation', rotation );
	}

	requestAnimationFrame(this.scroll.bind(this));
}

Menu.prototype.loop = function() {
	// console.log( 'loop: ' + this );

	requestAnimationFrame(this.loop.bind(this));
}

Menu.prototype.open = function() {
	var menu = this;

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
}

Menu.prototype.close = function() {
	var menu = this;

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
}

Menu.prototype.hide = function() {
	this.close();
	$('#menu').css({
		left: '-400px',
		'-webkit-transition': 'left 1s ease-in-out'
	});
}

Menu.prototype.show = function( open ) {
	if ( open )
		this.open();
	$('#menu').css({
		left: '-100px',
		'-webkit-transition': 'left .5s ease-in-out'
	});
}

var menu = new Menu();

$(document).on( 'ready', function() {

	$(document).on( 'touchmove', function( e ) {
		e.preventDefault();
	});

	$('#menu').css( '-webkit-transform', 'translateY( ' + window.innerHeight / 2 + 'px )' );

	// initMenu();
	menu.init([1,2,3,4,5,6,7,8,9,10,1,2,3,4,5,6,7,8,9,10]);
	// scrollMenu();
});