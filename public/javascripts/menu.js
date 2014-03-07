var effectInfo2D = [
	{
		name: '2D Effect 1',
		img: 'glow.gif',
		instruction: 'Do something... 1'
	},
	{
		name: '2D Effect 2',
		img: 'light1.gif',
		instruction: 'Do something... 2'
	},
	{
		name: '2D Effect 3',
		img: 'shadow.gif',
		instruction: 'Do something... 3'
	},
	{
		name: '2D Effect 4',
		img: 'wireframe.gif',
		instruction: 'Do something... 4'
	},
	{
		name: '2D Effect 5',
		img: 'woble.gif',
		instruction: 'Do something... 5'
	},
];

var effectInfo3D = [
	{
		name: '3D Effect 1',
		img: 'attractor.gif',
		instruction: 'Do something... 1'
	},
	{
		name: '3D Effect 2',
		img: 'colored_light.gif',
		instruction: 'Do something... 2'
	},
	{
		name: '3D Effect 3',
		img: 'fragments.gif',
		instruction: 'Do something... 3'
	},
	{
		name: '3D Effect 4',
		img: 'shadow.gif',
		instruction: 'Do something... 4'
	},
	{
		name: '3D Effect 5',
		img: 'wireframe.gif',
		instruction: 'Do something... 5'
	},
];

var menuInstance = 0;

function Menu( params ) {
	var params = (typeof params === "undefined" ) ? {} : params;
	var itemWidth = (typeof params.itemWidth === "undefined") ? 350 : params.itemWidth;
	var itemHeight = (typeof params.itemHeight === "undefined") ? 150 : params.itemHeight;
	var gui = (typeof params.gui === "undefined") ? undefined : params.gui;
	var boxTouchCallback = (typeof params.boxTouchCallback === "undefined") ? undefined : params.boxTouchCallback;
	var useCrystalMenu = (typeof params.useCrystalMenu === "undefined" ) ? false : params.useCrystalMenu;

	this.name = "menu" + menuInstance++;
	this.retracted = false;
	this.transitioning = false;
	this.itemWidth = itemWidth;
	this.itemHeight = itemHeight;
	this.items = [];
	this.boxes = [];
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

	this.crystalMenu = useCrystalMenu ? new CrystalMenu(1024,768) : undefined;
	if ( this.crystalMenu ) {
		this.crystalMenu.active = true;
		$('#menu-bg').append( this.crystalMenu.getDOMElement() );
		$(this.crystalMenu.getDOMElement()).css({
			'pointer-events': 'none',
			'z-index': 3000
		});
		this.crystalMenu.init();
	}

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
	if ( this.crystalMenu )
		this.crystalMenu.kill();
	this.clear();
	this.dead = true;
}

Menu.prototype.clear = function() {

	while ( this.items.length > 0 ) {
		var item = this.items[0];
		// item.box.remove();
		item.remove();
		this.items.splice(0,1);
	}

	while ( this.boxes.length > 0 ) {
		var box = this.boxes[0];
		box.remove();
		this.boxes.splice(0,1);
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


		var box = $('#clonable-menu-box').clone();
		box.attr({
			'id': 'box'+i,
			'menu': this.name,
			'index': i,
			'effect-name': items[i].name
		}).css({
			'visibility': 'visible',
			'margin-top': -this.boxHeight/2,
			'width': this.boxWidth,
			'height': this.boxHeight,
			'left': 600
		}).find('img')
		.attr( 'src', 'images/effect-thumbs/' + items[i].img )
		.css({
			width: this.boxWidth - this.boxMargin * 2,
			height: this.boxHeight - this.boxMargin * 2,
			top: this.boxMargin,
			left: this.boxMargin
		});
		// add a gem to the box
		var gem = new Gem( this.boxWidth, this.boxHeight, this.boxMargin, box );
		gem.generate();
		box.gem = gem;
		box.visible = true;
		$('#menu').append( box );
		this.boxes.push( box );

		if ( !this.crystalMenu ) {
			var clone = $('#clonable-menu-item').clone();
			clone.attr( 'id', 'item'+i );
			var item = clone.find('.menu-item');
			item.box = box;
			item.visible = true;

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
		}
	}
	// keep menu in scope
	var menu = this;

	$('.menu-box').on('touchstart', function(e){
		console.log( 'touched a menu box: ' + $(this).attr('id') + ' ' + $(this).attr('menu') + ' ' + $(this).attr('effect-name') );
		e.preventDefault();
		e.stopPropagation();
		// menu.close();
		if ( menu.boxTouchCallback )
			menu.boxTouchCallback($(this));
	});

	$('#menu-bg').on( 'touchstart', function(e) {
		// startTracking( e.originalEvent );
		menu.startTracking( e.originalEvent );
	});

	this.scroll();
	if ( startClosed )
		this.close( true );
	this.initialized = true;
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

	if ( this.crystalMenu ) {
		this.crystalMenu.setRotation( -this.trackRotationOffset );
	}

	for ( var i=0; i<this.boxes.length; i++ ) {
		var box = this.boxes[i];
		var rotation = ( ( i / this.boxes.length ) * 360 + this.trackRotationOffset ) % 360;
		if ( rotation > 180 )
			rotation -= 360;
		if ( rotation < -180 )
			rotation += 360;
		var boxY = utils.cmap( rotation, -180, 180, -this.boxExtents, this.boxExtents );
		box.y = boxY;

		if ( Math.abs(boxY) - this.boxHeight/2 > window.innerHeight/2 && box.visible ) {
			box.hide();
			box.visible = false;
			continue;
		}
		else if ( Math.abs(boxY) - this.boxHeight/2 < window.innerHeight/2 && !box.visible ) {
			box.show();
			box.visible = true;
		}


		box.css({
			// 'top': boxY 
			'-webkit-transform': 'translate3d(0px,' + boxY + 'px,0px)'
		});
		box.boxY = boxY;

		var boxSeparation = ( this.boxExtents * 2 ) / this.boxes.length;

		if ( Math.abs(box.y) < boxSeparation/2 ) {
			// console.log( box.y );
			$('#menu-title').html( box.attr('effect-name') );
			var opacity = utils.cmap( Math.abs(boxY), (boxSeparation/2)-50, 50, 0, 1 );
			$('#menu-title').css({
				// '-webkit-filter': 'brightness('+(opacity*100)+'%)',
				'opacity': opacity,
				'top': window.innerHeight/2 + (boxY>0?1:-1) * ((1-opacity) * boxSeparation/2)
			});
		}
	}

	if ( !this.crystalMenu ) {
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

			var z = (rotation+90) % 360;
			var extend = this.getXPosForRotation( rotation );
			var transform = 'rotate( ' + rotation + 'deg ) translate3d( ' + extend + 'px, 0px, ' + z + 'px )';
			item.css({
				'-webkit-transform': transform,
				// width: (this.dynamicWidth&&!this.transitioning)?theWidth:undefined,
			});
			item.attr( 'rotation', rotation );
		}
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

	for ( var i=0; i<this.boxes.length; i++ ) {
		var box = this.boxes[i];
		if ( Math.abs(box.y) - this.boxHeight/2 < window.innerHeight/2 ) {
			box.show();
			box.css({
				'-webkit-transform': 'translate3d(0px,' + box.y + 'px,0px) scale3d(1,1,1)',
				'-webkit-transition': '-webkit-transform .3s ease-in-out'
				// '-webkit-transition': '-webkit-transform .3s ease-in-out ' + delay + 'ms'
			});
		}
	}

	if ( !this.crystalMenu ) {

		for ( var i=0; i<this.items.length; i++ ) {
			var item = this.items[i];
			var box = item.box;
			var boxY = box.boxY==undefined?0:box.boxY;
			var rotation = item.attr('rotation');
			var delay = utils.cmap( Math.abs( rotation ), 0, 90, 0, 300 );
			if ( item.is(':visible') ) {
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

			// if ( box.is(':visible') ) {
			if ( Math.abs(boxY) - this.boxHeight/2 < window.innerHeight/2 ) {
				box.show();
				box.css({
					'-webkit-transform': 'translate3d(0px,' + boxY + 'px,0px) scale3d(1,1,1)',
					// '-webkit-transform': 'scale3d(1,1,1)',
					'-webkit-transition': '-webkit-transform .3s ease-in-out ' + delay + 'ms'
				});
			}

			// $('#menu-bg-img').fadeIn();

		}
	}

	$('#menu-title').css({
		right: 0,
		'-webkit-transition': 'right .3s ease-in-out'
	});

	if ( this.crystalMenu ) {
		this.crystalMenu.open();
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
	for ( var i=0; i<this.boxes.length; i++ ) {
		var box = this.boxes[i];
		box.css({
			'-webkit-transition': '',
			'-webkit-transform': 'translate3d(0px,'+box.y+'px,0px) scale3d(0,0,0)'
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


	if ( this.crystalMenu ) {
		this.crystalMenu.close( immediate?0:300 );
	}


	for ( var i=0; i<this.boxes.length; i++ ) {
		var box = this.boxes[i];
		if ( box.visible ) {
			// console.log( 'box: ' + )

			var transform = 'translate3d(0px,'+(box.y)+'px,0px) scale( 0.005, 0.005)';
			// var transition = (immediate?undefined:'-webkit-transform '+ transitionMillis +'ms ease-in-out ' + delay + 'ms');
			var transition = (immediate?undefined:'-webkit-transform '+ transitionMillis +'ms ease-in-out');
			box.css({
				'-webkit-transform': transform,
				'-webkit-transition': transition
			});
		}
	}

	if ( !this.crystalMenu ) {
		for ( var i=0; i<this.items.length; i++ ) {
			var item = this.items[i];
			var box = item.box;
			var boxY = box.boxY==undefined?0:box.boxY;
			var rotation = item.attr('rotation');
			var delay = utils.cmap( Math.abs( rotation ), 90, 0, 0, 100 );
			if ( item.is(':visible') ) {
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
		}
	}

	$('#menu-title').css({
		'right': -300,
		'-webkit-transition': (immediate?undefined:'right .3s ease-in-out')
	});

	$('#menu-bg').css( 'pointer-events', 'none' );

	// if ( immediate )
	// 	$('#menu-bg-img').hide();
	// else
	// 	$('#menu-bg-img').fadeOut();

	// console.log( 'max delay millis: ' + maxDelayMillis );

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