function Countdown() {
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
		right: '0px',
		'-webkit-transition': 'right 1s ease-in-out'
	})
}

Countdown.prototype.begin = function( startingCount ) {

	if ( this.tickIntervalId ) {
		clearInterval( this.tickIntervalId );
		$('.countdownColon').removeClass( 'blink' );
	}

	$('.countdownSeconds').html( startingCount );


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

	$('.countdownSeconds').html( (count<10?'0':'') +count );

	if ( count == 0 ) {
		this.finished();
	}
}