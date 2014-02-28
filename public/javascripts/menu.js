var effectInfo2D = [
	{
		name: '2D effect 1',
		img: '01.gif'
	},
	{
		name: '2D effect 2',
		img: '02.gif'
	},
	{
		name: '2D effect 3',
		img: '03.gif'
	},
	{
		name: '2D effect 4',
		img: '04.gif'
	},
	{
		name: '2D effect 5',
		img: '05.gif'
	},
	{
		name: '2D effect 6',
		img: '06.gif'
	},
	{
		name: '2D effect 7',
		img: '07.gif'
	},
	{
		name: '2D effect 8',
		img: '07.gif'
	},
	{
		name: '2D effect 9',
		img: '07.gif'
	},
	{
		name: '2D effect 10',
		img: '07.gif'
	},
];

var effectInfo3D = [
	{
		name: '3D effect 1',
		img: '01.gif'
	},
	{
		name: '3D effect 2',
		img: '02.gif'
	},
	{
		name: '3D effect 3',
		img: '03.gif'
	},
	{
		name: '3D effect 4',
		img: '04.gif'
	},
	{
		name: '3D effect 5',
		img: '05.gif'
	},
	{
		name: '3D effect 6',
		img: '06.gif'
	},
	{
		name: '3D effect 7',
		img: '07.gif'
	},
	{
		name: '3D effect 8',
		img: '07.gif'
	},
	{
		name: '3D effect 9',
		img: '07.gif'
	},
	{
		name: '3D effect 10',
		img: '07.gif'
	},
];

var menuInstance = 0;

function Menu( itemWidth, itemHeight ) {
	itemWidth = (typeof itemWidth === "undefined") ? 800 : itemWidth
	itemHeight = (typeof itemHeight === "undefined") ? 150 : itemHeight

	this.name = "menu" + menuInstance++;
	this.retracted = false;
	this.transitioning = false;
	this.itemWidth = itemWidth;
	this.itemHeight = itemHeight;
	this.items = [];
	this.dynamicWidth = true;

	this.trackTime;
	this.trackIdentifier;
	this.trackY;
	this.trackRotationOffset = 0;
	this.trackVelocity = 0.0;
	this.trackFrameRate = 1000 / 60;

	this.initialized = false;
	this.dead = false;

	$('#menu').css( '-webkit-transform', 'translateY( ' + window.innerHeight / 2 + 'px )' );
}

Menu.prototype.kill = function() {
	this.clear();
	this.dead = true;
}

Menu.prototype.clear = function() {

	while ( this.items.length > 0 ) {
		var item = this.items[0];
		item.remove();
		this.items.splice(0,1);
	}

	$('#menu-bg').off( 'touchstart' );
	$('#menu-button').off( 'touchstart' );
}

Menu.prototype.init = function( items ) {

	if ( this.initialized ) {
		console.log( 'clearing!' );
		this.clear();
	}

	for ( var i=0; i<items.length; i++ ) {
		var clone = $('#clonable-menu-item').clone();
		clone.attr( 'id', 'item'+i );
		var item = clone.find('.menu-item');
		var itemNum = (i%10+1);

		item.find('.menu-item-title').html( items[i].name );
		// item.find('img').attr( 'src', 'images/effect-thumbs/' + items[i].img );

		// var rotation = ( i / items.length ) * 360 + this.trackRotationOffset;
		var rotation = ( ( i / items.length ) * 360 + this.trackRotationOffset ) % 360;
		if ( rotation > 180 )
			rotation = rotation - 360;

		item.css({
			visibility: 'visible',
			// visibility: 'hidden',
			width: this.itemWidth,
			height: this.itemHeight,
			top: -this.itemHeight/2,
			// '-webkit-transform'
		});
		item.attr( 'item-num', itemNum );
		item.attr( 'rotation', rotation );
		$('#menu').append( clone );
		this.items.push( item );
	}
	// keep menu in scope
	var menu = this;

	$('.menu-item img').height( this.itemHeight - 30 ).css({
		'margin-top': '-14px'
	});

	$('#menu-button').on( 'touchstart', function(e) {
		if ( menu.transitioning ) {
			console.log( 'button touch ignored -- transitioning' );
			return;
		}

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

	if ( !this.initialized ) {
		this.scroll();
		this.close( true );
		this.initialized = true;
	}
	else {
		this.trackRotationOffset = 0;
	}

}

Menu.prototype.startTracking = function( touchEvent ) {
	console.log( 'startTracking: ' + this.name );
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

	if ( this.dead )
		return;

	// console.log( 'scroll' );

	if ( this.retracted || this.transitioning ) {
		requestAnimationFrame(this.scroll.bind(this));
		return;
	}

	this.trackRotationOffset += this.trackVelocity;
	this.trackVelocity *= .75;

	for ( var i=0; i<this.items.length; i++ ) {
		var item = this.items[i];
		var parent = item.parent();
		var rotation = ( ( i / this.items.length ) * 360 + this.trackRotationOffset ) % 360;
		if ( rotation > 180 )
			rotation = rotation - 360;

		if ( Math.abs(rotation) > 90 && item.is(':visible') ) {
			item.hide();
			continue;
		}
		else if ( Math.abs(rotation) < 90 && !item.is(':visible') ) {
			item.show();
			continue;
		}

		var z = (rotation+90) % 360;

		var theWidth = this.getItemWidthForRotation( rotation );

		var extend = this.getXPosForRotation( rotation );
		// item.find( '.menu-item-debug' ).html( 'rotation: ' + rotation.toFixed(1) + '<br/>width: ' + theWidth.toFixed(1) );
		var transform = 'rotate( ' + rotation + 'deg ) translate3d( ' + extend + 'px, 0px, ' + z + 'px )';
		// if ( i==0 )
		// 	console.log( this.transitioning + ' ' + transform );

		item.css({
			'-webkit-transform': transform,
			// width: (this.dynamicWidth&&!this.transitioning)?theWidth:undefined,
		});
		item.attr( 'rotation', rotation );
	}

	requestAnimationFrame(this.scroll.bind(this));
}

Menu.prototype.getXPosForRotation = function( rotation ) {

	return this.dynamicWidth?utils.cmap( Math.abs( rotation ), 90, 0, -500, 0 ):0;
}

Menu.prototype.getItemWidthForRotation = function( rotation ) {

	return this.dynamicWidth?utils.cmap( Math.abs( rotation ), 90, 0, 300, this.itemWidth ):this.itemWidth;
}

Menu.prototype.open = function() {
	var menu = this;
	for ( var i=0; i<this.items.length; i++ ) {
		var item = this.items[i];
		if ( !item.is(':visible') )
			continue;
		var rotation = item.attr('rotation');
		var delay = utils.cmap( Math.abs( rotation ), 0, 90, 0, 300 );
		var z = (rotation+90) % 360;
		var extend = this.getXPosForRotation( rotation );
		var transform = 'rotate( ' + rotation + 'deg ) translate3d( ' + extend + 'px, 0px, ' + z + 'px )';

		var transition = '-webkit-transform .3s ease-in-out ' + delay + 'ms';
		// var transition = 'width .3s ease-in-out ' + delay + 'ms';
		item.css({
			// visibility: 'visible',
			// width: this.getItemWidthForRotation( item.attr('rotation') ),
			'-webkit-transform': transform,
			'-webkit-transition': transition
		});
	}
	$('#menu-button').css({
		background: 'black',
		'-webkit-transition': 'background .5s'
	});
	$('#menu-button').on( 'webkitTransitionEnd', function(e) {
		console.log( 'open transition finished' );
		$(this).off( 'webkitTransitionEnd' );
		$('.menu-item').css( '-webkit-transition', '' );
		menu.retracted = false;
		menu.transitioning = false;
	});
	menu.transitioning = true;
}

Menu.prototype.close = function( immediate ) {
	var menu = this;

	if ( immediate == undefined ) {
		immediate = false;
	}

	for ( var i=0; i<this.items.length; i++ ) {
		var item = this.items[i];
		if ( !item.is(':visible') )
			continue;
		var rotation = item.attr('rotation');
		var delay = utils.cmap( Math.abs( rotation ), 90, 0, 0, 300 );
		var z = (rotation+90) % 360;
		var transform = 'rotate( ' + rotation + 'deg ) translate3d( -800px, 0px, ' + z + 'px )';
		var transition = '-webkit-transform .3s ease-in-out ' + delay + 'ms';
		// var transition = 'width .3s ease-in-out ' + delay + 'ms';
		item.css({
			'-webkit-transform': transform,
			// width: 170,
			'-webkit-transition': (immediate?undefined:transition)
		});
	}
	$('#menu-button').css({
		background: 'white',
		'-webkit-transition': 'background 1s'
	});
	$('#menu-button').on( 'webkitTransitionEnd', function(e) {
		console.log( 'close transition finished' );
		$(this).off( 'webkitTransitionEnd' );
		$('.menu-item').css( '-webkit-transition', '' );
		menu.retracted = true;
		menu.transitioning = false;
	});
	menu.transitioning = true;
}

Menu.prototype.hide = function( immediate ) {
	this.close();
	$('#menu').css({
		left: '-400px',
		'-webkit-transition': immediate?undefined:'left 1s ease-in-out'
	});
	$('#menu-bg').css({
		'pointer-events': 'none'
	});
}

Menu.prototype.show = function( open ) {
	if ( open )
		this.open();
	$('#menu').css({
		visibility: 'visible',
		left: '-100px',
		'-webkit-transition': 'left .5s ease-in-out'
	});
	$('#menu-bg').css({
		'pointer-events': 'auto'
	});
}