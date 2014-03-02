function Countdown( params ) {
	params = (typeof params === 'undefined') ? {} : params;

	this.finalCountdownCallback = params.finalCountdownCallback;
	// console.log( 'finalCountdownCallback: ' + this.finalCountdownCallback );
	this.name = "countdown";
	this.tickIntervalId;
	this.height = $('#countdown').height();
	this.width = $('#countdown').outerWidth();

	this.init();
}

Countdown.prototype.init = function() {

	$('#countdown').css({
		// top: window.innerHeight/2 - this.height/2,
		top: 20,
		right: -this.width
	});
}

Countdown.prototype.slideIn = function() {
	$('#countdown').css({
		visibility: 'visible',
		right: 0,
		'-webkit-transition': 'right .3s ease-in-out'
	});
	$('#countdown').on( 'webkitTransitionEnd', function(e){
		$(this).off( 'webkitTransitionEnd' );
		$(this).css({visibility:'visible'});
	});
}

Countdown.prototype.slideOut = function() {
	$('#countdown').css({
		right: -this.width,
		'-webkit-transition': 'right .3s ease-in-out'
	});
	$('#countdown').on( 'webkitTransitionEnd', function(e){
		$(this).off( 'webkitTransitionEnd' );
		$(this).css({visibility:'hidden'});
	});
}

Countdown.prototype.begin = function( startingCount ) {

	if ( this.tickIntervalId ) {
		clearInterval( this.tickIntervalId );
		$('.countdownColon').removeClass( 'blink' );
	}

	$('.countdownSeconds').html( startingCount );
	$('#welcome-seconds').html( startingCount + (startingCount==1?' second':' seconds') );


	this.tickIntervalId = setInterval( this.tick.bind(this), 1000 );
	$('.countdownColon').addClass( 'blink' );
}

Countdown.prototype.finished = function() {

	clearInterval( this.tickIntervalId );
	this.tickIntervalId = undefined;
	$('.countdownColon').removeClass( 'blink' );
}

Countdown.prototype.tick = function() {
	var count = parseInt( $('.countdownSeconds').html() );
	count--;

	if ( count == 10 && this.finalCountdownCallback ) {
		console.log( 'calling last minute callback' );
		this.finalCountdownCallback();
	}

	$('#welcome-seconds').html( count + (count==1?' second':' seconds') );
	$('#chosen-seconds').html( count + (count==1?' second':' seconds') );
	$('.countdownSeconds').html( (count<10?'0':'') +count );

	if ( count == 0 ) {
		this.finished();
	}
}