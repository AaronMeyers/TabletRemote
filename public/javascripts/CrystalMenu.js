function CrystalMenu( w, h, sep ) {
	this.width = w;
	this.height = h;
	this.gemSeparation = 0;
	this.gemExtents = 0;
	this.renderer = new THREE.CanvasRenderer({alpha:true});
	this.renderer.setSize( this.width, this.height );
	this.scene = new THREE.Scene();
	this.camera = new THREE.OrthographicCamera( 0, this.width, this.height / 2, this.height / - 2, -5000, 5000 );
	this.active = false;
	this.dead = false;

	this.crystalNode;
	this.crystals = [];
	this.gemNode;
	this.gems = [];

	this.time = 0;
}

CrystalMenu.prototype.init = function() {
	// var wireframeMaterial = new THREE.MeshBasicMaterial();
	this.crystalNode = new THREE.Object3D();
	this.gemNode = new THREE.Object3D();
	var numCrystals = 10;

	var wireframeMaterial = new THREE.MeshBasicMaterial({wireframe:true, wireframeLinewidth:2});
	for ( var i=0; i<numCrystals; i++ ) {
		var crystalParent = new THREE.Object3D();
		var crystal = new THREE.Mesh( new THREE.CrystalGeometry( 80, 240, 100, 7 ), wireframeMaterial );
		crystal.position.x = 50;
		crystal.rotation.z = -Math.PI / 2;

		crystalParent.rotation.z = i * (1/numCrystals) * (Math.PI * 2 );
		crystalParent.add( crystal );
		this.crystalNode.add( crystalParent );

		crystal.rotationSpeed = 0;
		this.crystals.push( crystal );

		// create gem
		// var gem = new THREE.Mesh( new THREE.CubeGeometry( 250,250,250 ), wireframeMaterial );
		// this.gemNode.add( gem );
		// this.gems.push( gem );

	}
	this.crystalNode.position.x = -100;
	this.gemNode.position.x = 575;
	// this.crystalNode.position.x = this.width/2;
	this.scene.add( this.gemNode );
	this.scene.add( this.crystalNode );
	// this.scene.add ( new THREE.Mesh( new THREE.CubeGeometry(100,100,100), new THREE.MeshBasicMaterial({color:0xFF0000}) ) );

	this.loop();
}

CrystalMenu.prototype.close = function( duration ) {

	console.log( 'closing with duration: ' + duration );
	duration = (typeof duration !== 'undefined') ? duration : 300;

	$('#debug').html( 'close in ' + duration );

	var tween = new TWEEN.Tween({
		node: this.crystalNode,
		scale: 1.0
	}).to({
		scale: 0.0
	}, duration).onUpdate(function(){
		// console.log( 'updating close tween: ' + this.scale );
		// $('#debug').html( 'closing: ' + this.scale + ' of ' + duration + ' with ' + this.node );
		this.node.scale.set( this.scale, this.scale, this.scale );
	}).easing( TWEEN.Easing.Quadratic.InOut )
	// .delay( 300 )
	.start();
}

CrystalMenu.prototype.open = function( duration ) {
	duration = (typeof duration !== 'undefined') ? duration : 300;

	var tween = new TWEEN.Tween({
		node: this.crystalNode,
		scale: 0.0
	}).to({
		scale: 1.0
	}, duration).onUpdate(function(){
		this.node.scale.set( this.scale, this.scale, this.scale );
	}).easing( TWEEN.Easing.Quadratic.InOut )
	.start();
}

CrystalMenu.prototype.setRotation = function( rotation ) {


	// console.log( rotation );
	rotation = utils.mod( 360, rotation );
	// rotation = rotation % 360
	// console.log( rotation % -360 );
	// rotation = rotation * (Math.PI/180);
	// this.crystalNode.rotation.z = rotation * (Math.PI/180);
	var num = this.crystals.length;
	var crystalMenu = this;
	this.crystals.forEach( function( c, i ) {
		// var u = i * ()
		var offset = i * (1/num) * 360;
		var effectiveRotation = (rotation + offset) * (Math.PI/180);
		if ( effectiveRotation > Math.PI*2 )
			effectiveRotation -= Math.PI*2;
		c.parent.rotation.z = effectiveRotation;

		// var rotDegrees = effectiveRotation * (180/Math.PI);
		// var gemY = -16 + utils.cmap( rotDegrees, -180, 180, -crystalMenu.gemExtents, crystalMenu.gemExtents ) - window.innerHeight/2
		// crystalMenu.gems[i].position.y = gemY;
		


		// visible rotation is just to put it in a range that makes it easy to do the scaling and movement on local x axis
		var visibleRotation = effectiveRotation;// - Math.PI*.5;
		if ( visibleRotation > Math.PI )
			visibleRotation = -( Math.PI * 2 - visibleRotation );

		c.visible = Math.abs(visibleRotation) < Math.PI * .5;
		if ( c.visible ) {
			c.position.x = utils.map( Math.abs(visibleRotation) , 0, Math.PI * .5, 300, 50 );
			var scale = utils.map( Math.abs( visibleRotation ), 0, Math.PI, 1, .5 );
			c.scale.set( scale, scale, scale );
		}

		c.rotationSpeed = utils.map( Math.abs(visibleRotation), 0, Math.PI * .25, .15, .01 );
	});
}

CrystalMenu.prototype.getDOMElement = function() {
	return this.renderer.domElement;
}

CrystalMenu.prototype.kill = function() {
	this.active = false;
	this.dead = true;
	$(this.renderer.domElement).remove();
}

CrystalMenu.prototype.loop = function() {
	// console.log( 'crystal menu loop: ' + Date.now() );
	TWEEN.update();

	if ( this.dead )
		return;

	if ( !this.active ) {
		setTimeout(this.loop.bind(this), 1000/60);
		return;
	}
	this.crystals.forEach(function(c) {
		// c.rotation.x += .01;
		c.rotation.x += c.rotationSpeed;
	});
	this.renderer.render( this.scene, this.camera );

	setTimeout( this.loop.bind(this), 1000/60 );
}