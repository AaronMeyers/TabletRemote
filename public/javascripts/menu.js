var effectInfo2D = [
	{
		name: '2D Effect 1',
		img: '01.gif'
	},
	{
		name: '2D Effect 2',
		img: '02.gif'
	},
	{
		name: '2D Effect 3',
		img: '03.gif'
	},
	{
		name: '2D Effect 4',
		img: '04.gif'
	},
	{
		name: '2D Effect 5',
		img: '05.gif'
	},
	{
		name: '2D Effect 6',
		img: '06.gif'
	},
	{
		name: '2D Effect 7',
		img: '07.gif'
	},
	{
		name: '2D Effect 8',
		img: '07.gif'
	},
	{
		name: '2D Effect 9',
		img: '07.gif'
	},
	{
		name: '2D Effect 10',
		img: '07.gif'
	},
];

var effectInfo3D = [
	{
		name: '3D Effect 1',
		img: '01.gif'
	},
	{
		name: '3D Effect 2',
		img: '02.gif'
	},
	{
		name: '3D Effect 3',
		img: '03.gif'
	},
	{
		name: '3D Effect 4',
		img: '04.gif'
	},
	{
		name: '3D Effect 5',
		img: '05.gif'
	},
	{
		name: '3D Effect 6',
		img: '06.gif'
	},
	{
		name: '3D Effect 7',
		img: '07.gif'
	},
	{
		name: '3D Effect 8',
		img: '07.gif'
	},
	{
		name: '3D Effect 9',
		img: '07.gif'
	},
	{
		name: '3D Effect 10',
		img: '07.gif'
	},
];

var menuInstance = 0;

function Menu( params ) {
	var params = (typeof params === "undefined" ) ? {} : params;
	var itemWidth = (typeof params.itemWidth === "undefined") ? 350 : params.itemWidth;
	var itemHeight = (typeof params.itemHeight === "undefined") ? 150 : params.itemHeight;
	var gui = (typeof params.gui === "undefined") ? undefined : params.gui;
	var boxTouchCallback = (typeof params.boxTouchCallback === "undefined") ? undefined : params.boxTouchCallback;

	this.name = "menu" + menuInstance++;
	this.retracted = false;
	this.transitioning = false;
	this.itemWidth = itemWidth;
	this.itemHeight = itemHeight;
	this.items = [];
	this.dynamicWidth = true;
	this.crystalWidth = 400;
	this.boxWidth = 250;
	this.boxHeight = 250;
	this.boxMargin = 30;
	this.boxTouchCallback = boxTouchCallback;

	this.minItemX = 0;
	this.maxItemX = 250;

	this.boxExtents = 2000;

	this.trackTime;
	this.trackIdentifier;
	this.trackY;
	this.trackRotationOffset = 0;
	this.trackVelocity = 0.0;
	this.trackFrameRate = 1000 / 60;

	this.initialized = false;
	this.dead = false;
	this.gui = gui;
	if ( this.gui ) {
		// console.log( 'menu adding gui options' );
		this.gui.add( this, 'minItemX', -500, 0 );
		this.gui.add( this, 'maxItemX', 0, 300 );
		this.gui.add( this, 'boxExtents', 1000, 5000 );
	}

	$('#menu').css( '-webkit-transform', 'translateY( ' + window.innerHeight / 2 + 'px )' );
}

Menu.prototype.kill = function() {
	console.log( this.name + ' getting killed' );
	this.clear();
	this.dead = true;
}

Menu.prototype.clear = function() {

	while ( this.items.length > 0 ) {
		var item = this.items[0];
		item.box.remove();
		item.remove();
		this.items.splice(0,1);
	}

	if ( this.gui ) {
		// this.gui.remove( this, 'minItemX' );
	}
	$('#menu-bg').off( 'touchstart' );
	$('#menu-button').off( 'touchstart' );
}

Menu.prototype.init = function( items, startClosed ) {

	console.log( this.name + ' init' );

	startClosed = (typeof startClosed === 'undefined' ) ? false : startClosed;

	if ( this.initialized ) {
		console.log( 'clearing!' );
		this.clear();
	}

	for ( var i=0; i<items.length; i++ ) {

		$('#menu-title').css( 'top', window.innerHeight/2 );

		var clone = $('#clonable-menu-item').clone();
		clone.attr( 'id', 'item'+i );
		var item = clone.find('.menu-item');
		// console.log( item );

		var box = $('#clonable-menu-box').clone();
		box.attr( 'id', 'box'+i );
		box.attr( 'menu', this.name );
		box.attr( 'index', i );
		box.attr( 'effect-name', items[i].name );
		box.css({
			'visibility': 'visible',
			'margin-top': -this.boxHeight/2,
			'width': this.boxWidth,
			'height': this.boxHeight,
			'left': 600
		});
		clone.append( box );
		item.box = box;
		item.visible = true;

		// add a gem to the box
		var gem = new Gem( this.boxWidth, this.boxHeight, this.boxMargin, box );
		gem.generate();
		box.gem = gem;
		box.visible = true;

		// item.find('.menu-item-title').html( items[i].name );
		box.find('.menu-box-title').html( items[i].name );

		// item.find('img').attr( 'src', 'images/effect-thumbs/' + items[i].img );
		box.find('img')
		.attr( 'src', 'images/effect-thumbs/' + items[i].img )
		.css({
			width: this.boxWidth - this.boxMargin * 2,
			height: this.boxHeight - this.boxMargin * 2,
			top: this.boxMargin,
			left: this.boxMargin
		});

		item.find('img').hide();

		// var rotation = ( i / items.length ) * 360 + this.trackRotationOffset;
		var rotation = ( ( i / items.length ) * 360 + this.trackRotationOffset ) % 360;
		if ( rotation > 180 )
			rotation = rotation - 360;

		var crystal = new Crystal( this.itemWidth, this.itemHeight, item );
		$(crystal.canvas).css({
			position: 'relative',
			float: 'left',
			// left: 150
		});
		crystal.generate();
		item.crystal = crystal;

		item.css({
			background: 'none',
			border: 'none',


			visibility: 'visible',
			// visibility: 'hidden',
			width: this.itemWidth,
			height: this.itemHeight,
			top: -this.itemHeight/2,
			// '-webkit-transform'
		});
		item.attr( 'rotation', rotation );
		$('#menu').append( clone );
		this.items.push( item );
		$('#menu-button').hide();
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

	$('.menu-box').on('touchstart', function(e){
		console.log( 'touched a menu box: ' + $(this).attr('id') + ' ' + $(this).attr('menu') );
		e.preventDefault();
		e.stopPropagation();
		// menu.close();
		if ( menu.boxTouchCallback )
			menu.boxTouchCallback($(this));
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

	// if ( !this.initialized ) {
		this.scroll();
		if ( startClosed )
			this.close( true );
		this.initialized = true;
	// }
	// else {
	// 	this.trackRotationOffset = 0;
	// }
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
		var box = item.box;
		var rotation = ( ( i / this.items.length ) * 360 + this.trackRotationOffset ) % 360;
		if ( rotation > 180 )
			rotation -= 360;
		if ( rotation < -180 )
			rotation += 360;
		var boxY = utils.cmap( rotation, -180, 180, -this.boxExtents, this.boxExtents );	

		// if ( Math.abs(rotation) > 90 && item.is(':visible') ) {
		if ( Math.abs(rotation) > 90 && item.visible ) {
			item.hide();
			item.visible = false;
			continue;
		}
		// else if ( Math.abs(rotation) < 90 && !item.is(':visible') ) {
		else if ( Math.abs(rotation) < 90 && !item.visible ) {
			item.show();
			item.visible = true;
			continue;
		}
		// else if ( Math.abs(boxY) - this.boxHeight/2 > window.innerHeight/2 && box.is(':visible') ) {
		else if ( Math.abs(boxY) - this.boxHeight/2 > window.innerHeight/2 && box.visible ) {
			box.hide();
			box.visible = false;
			continue;
		}
		else if ( Math.abs(boxY) - this.boxHeight/2 < window.innerHeight/2 && !box.visible ) {
			box.show();
			box.visible = true;
		}

		var boxSeparation = ( this.boxExtents * 2 ) / this.items.length;

		if ( Math.abs(boxY) < boxSeparation/2 ) {
			$('#menu-title').html( box.find('.menu-box-title').html() );
			var opacity = utils.cmap( Math.abs(boxY), (boxSeparation/2)-50, 50, 0, 1 );
			$('#menu-title').css({
				// '-webkit-filter': 'brightness('+(opacity*100)+'%)',
				'opacity': opacity,
				'top': window.innerHeight/2 + (boxY>0?1:-1) * ((1-opacity) * boxSeparation/2)
			});
		}

		var z = (rotation+90) % 360;
		var extend = this.getXPosForRotation( rotation );
		box.css({
			// 'top': boxY 
			'-webkit-transform': 'translate3d(0px,' + boxY + 'px,0px)'
		});
		box.boxY = boxY;
		// box.gem.jitter( 2.0 );
		var transform = 'rotate( ' + rotation + 'deg ) translate3d( ' + extend + 'px, 0px, ' + z + 'px )';

		item.css({
			'-webkit-transform': transform,
			// width: (this.dynamicWidth&&!this.transitioning)?theWidth:undefined,
		});
		item.attr( 'rotation', rotation );
	}

	requestAnimationFrame(this.scroll.bind(this), 1000/30);
}

Menu.prototype.getXPosForRotation = function( rotation ) {

	return this.dynamicWidth?utils.cmap( Math.abs( rotation ), 90, 0, this.minItemX, this.maxItemX ):0;
}

Menu.prototype.getItemWidthForRotation = function( rotation ) {

	return this.dynamicWidth?utils.cmap( Math.abs( rotation ), 90, 0, 300, this.itemWidth ):this.itemWidth;
}

Menu.prototype.open = function() {
	var menu = this;

	var transitionMillis = 300;
	var maxDelayMillis = 0;

	for ( var i=0; i<this.items.length; i++ ) {
		var item = this.items[i];
		var box = item.box;
		var boxY = box.boxY==undefined?0:box.boxY;
		if ( item.is(':visible') ) {
			var rotation = item.attr('rotation');
			var delay = utils.cmap( Math.abs( rotation ), 0, 90, 0, 300 );
			maxDelayMillis = delay > maxDelayMillis ? delay : maxDelayMillis;
			var z = (rotation+90) % 360;
			var extend = this.getXPosForRotation( rotation );
			var transform = 'rotate( ' + rotation + 'deg ) translate3d( ' + extend + 'px, 0px, ' + z + 'px )';

			var transition = '-webkit-transform ' + transitionMillis + 'ms ease-in-out ' + delay + 'ms';
			// var transition = 'width .3s ease-in-out ' + delay + 'ms';
			item.css({
				// visibility: 'visible',
				// width: this.getItemWidthForRotation( item.attr('rotation') ),
				'-webkit-transform': transform,
				'-webkit-transition': transition
			});
		}
		else {
			box.hide();
			box.css({
				'-webkit-transform': 'translate3d(0px,' + boxY + 'px,0px) scale3d(1,1,1)',
				// '-webkit-transform': 'scale3d(1,1,1)',
				'-webkit-transform': ''
			})
		}

		if ( box.is(':visible') ) {
			box.css({
				'-webkit-transform': 'translate3d(0px,' + boxY + 'px,0px) scale3d(1,1,1)',
				// '-webkit-transform': 'scale3d(1,1,1)',
				'-webkit-transition': '-webkit-transform .3s ease-in-out ' + delay + 'ms'
			});
		}

		$('#menu-title').css({
			right: 0,
			'-webkit-transition': 'right .3s ease-in-out'
		});

	}
	setTimeout(this.opened.bind(this), (maxDelayMillis+transitionMillis) );
	menu.transitioning = true;
}

Menu.prototype.opened = function() {
	// console.log( 'i just opened: ' + this.name );
	this.retracted = false;
	this.transitioning = false;
	$('.menu-item').css({
		'-webkit-transition': ''
	});
	$('.menu-box').css({
		'-webkit-transition': ''
	});
	$('#menu-bg').css( 'pointer-events', 'auto' );
}

Menu.prototype.closed = function() {
	// console.log( 'i just closed: ' + this.name );

	for ( var i=0; i<this.items.length; i++ ) {
		var box = this.items[i].box;
		var boxY = box.boxY==undefined?0:box.boxY;
		box.css({
			'-webkit-transition': '',
			'-webkit-transform': 'translate3d(0px,'+boxY+'px,0px) scale3d(0,0,0)'
		});
	}
	this.retracted = true;
	this.transitioning = false;
}

Menu.prototype.close = function( immediate ) {
	var menu = this;

	if ( this.retracted )
		return;

	if ( immediate == undefined ) {
		immediate = false;
	}

	var transitionMillis = 300;
	var maxDelayMillis = 0;
	var visibleBoxes = 0;


	for ( var i=0; i<this.items.length; i++ ) {
		var item = this.items[i];
		var box = item.box;
		var boxY = box.boxY==undefined?0:box.boxY;
		if ( item.is(':visible') ) {
			var rotation = item.attr('rotation');
			var delay = utils.cmap( Math.abs( rotation ), 90, 0, 0, 100 );
			maxDelayMillis = delay > maxDelayMillis ? delay : maxDelayMillis;
			var z = (rotation+90) % 360;
			var transform = 'rotate( ' + rotation + 'deg ) translate3d( -800px, 0px, ' + z + 'px )';
			var transition = '-webkit-transform ' + transitionMillis + 'ms ease-in-out ' + delay + 'ms';
			item.css({
				'-webkit-transform': transform,
				// width: 170,
				'-webkit-transition': (immediate?undefined:transition)
			});
		}

		if ( box.is(':visible') ) {
			visibleBoxes++;
			var transform = 'translate3d(0px,'+(boxY)+'px,0px) scale( 0.005, 0.005)';
			var transition = (immediate?undefined:'-webkit-transform '+ transitionMillis +'ms ease-in-out ' + delay + 'ms');
			box.css({
				'-webkit-transform': transform,
				// '-webkit-transform': 'scale3d( 0, 0, 0)',
				'-webkit-transition': transition
			});
		}
	}

	$('#menu-title').css({
		'right': -300,
		'-webkit-transition': (immediate?undefined:'right .3s ease-in-out')
	});

	$('#menu-bg').css( 'pointer-events', 'none' );

	console.log( 'max delay millis: ' + maxDelayMillis );

	setTimeout( this.closed.bind(this), (immediate?0:(maxDelayMillis+transitionMillis)) );
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