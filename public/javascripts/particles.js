function ParticleSystem( ctx, maxParticles ) {

	console.log( 'initializing particle system with ' + maxParticles + ' particles max' );
	this.ctx = ctx;
	this.particles = [];

	for ( var i=0; i<maxParticles; i++ ) {
		this.particles.push( new Particle() );
	}
}

ParticleSystem.prototype.spawnParticles = function( count, x, y ) {
	for ( var i=0; i<count; i++ )
		this.spawnParticle( x, y );
}

ParticleSystem.prototype.spawnParticle = function( x, y ) {
	// iterate through and find the first available particle
	for ( var i=0; i<this.particles.length; i++ ) {
		if ( !this.particles[i].active ) {
			this.particles[i].spawn( x, y );
			return;
		}
	}
}

ParticleSystem.prototype.update = function( ctx ) {

	// ctx.clearRect( 0, 0, window.innerWidth, window.innerHeight );
	ctx.beginPath();
	ctx.strokeStyle = 'white';
	// update all the particles
	this.particles.forEach(function(p) {
		p.update();
		if ( p.active ) {
			ctx.moveTo( p.posX, p.posY );
			ctx.lineTo( p.posX + p.velX * 3, p.posY + p.velY * 3 );
		}
	});
	this.ctx.stroke();
}

function Particle() {
	this.posX = 0;
	this.posY = 0;
	this.velX = 0;
	this.velY = 0;
	this.active = false;
}

Particle.prototype.spawn = function( x, y ) {
	this.posX = x;
	this.posY = y;
	var angle = utils.random( 0, Math.PI*2.0 );
	var speed = utils.random( 5, 10 );
	this.velX = Math.cos( angle ) * speed;
	this.velY = Math.sin( angle ) * speed;
	this.active = true;
}

Particle.prototype.update = function() {

	if ( !this.active )
		return;

	this.posX += this.velX;
	this.posY += this.velY;

	this.velX *= .9;
	this.velY *= .9;

	if ( utils.dist( 0, 0, this.velX, this.velY ) < .5 ) {
		this.active = false;
	}

}