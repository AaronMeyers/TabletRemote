/**
 * @author mrdoob / http://mrdoob.com/
 */

// THREE.CrystalGeometry = function ( radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded ) {
THREE.CrystalGeometry = function ( radius, height, bottom, radialSegments, radialVariation ) {

	THREE.Geometry.call( this );

	this.height = height = height !== undefined ? height : 100;
	this.bottom = bottom = bottom !== undefined ? bottom : 30;
	this.radialVariation = radialVariation = radialVariation !== undefined ? radialVariation : 20;

	this.radialSegments = radialSegments = radialSegments || 8;

	var heightHalf = height / 2;

	var tip = new THREE.Vector3( 0, height, 0 );
	this.vertices.push( tip );


	var radius = radius = radius !== undefined ? radius : 20;

	var x, y, vertices = [], uvs = [];

	for ( x = 0; x<radialSegments; x++ ) {
		var u = x / radialSegments;
		var angleVariance = .25 * ( 1 / radialSegments );
		u += utils.random( -angleVariance, angleVariance );

		var vertex = new THREE.Vector3();
		var theRadius = utils.random( -radialVariation, radialVariation ) + radius;
		theRadius = radius;
		vertex.x = theRadius * Math.sin( u * Math.PI * 2 );
		vertex.y = 0;
		vertex.y = utils.random( -radialVariation/2, radialVariation/2 );
		vertex.z = theRadius * Math.cos( u * Math.PI * 2 );

		this.vertices.push( vertex );
	}


	var bottom = new THREE.Vector3( 0, -bottom, 0 );
	this.vertices.push( bottom );

	for ( x=0; x<radialSegments; x++ ) {
		var tipIndex = 0,
			radialIndex1 = x,
			radialIndex2 = (x + 1) % radialSegments,
			bottomIndex = radialSegments + 1;

		// console.log( 'face: ' + tipIndex + ', ' + radialIndex1 + ', ' + radialIndex2 );
		this.faces.push( new THREE.Face3( tipIndex, radialIndex1 + 1, radialIndex2 + 1 ) );
		this.faces.push( new THREE.Face3( bottomIndex, radialIndex2 + 1, radialIndex1 + 1 ) );
	}



	// for ( y = 0; y <= heightSegments; y ++ ) {

	// 	var verticesRow = [];
	// 	var uvsRow = [];

	// 	var v = y / heightSegments;
	// 	var radius = v * ( radiusBottom - radiusTop ) + radiusTop;

	// 	for ( x = 0; x <= radialSegments; x ++ ) {

	// 		var u = x / radialSegments;

	// 		var vertex = new THREE.Vector3();
	// 		vertex.x = radius * Math.sin( u * Math.PI * 2 );
	// 		vertex.y = - v * height + heightHalf;
	// 		vertex.z = radius * Math.cos( u * Math.PI * 2 );

	// 		this.vertices.push( vertex );

	// 		verticesRow.push( this.vertices.length - 1 );
	// 		uvsRow.push( new THREE.Vector2( u, 1 - v ) );

	// 	}

	// 	vertices.push( verticesRow );
	// 	uvs.push( uvsRow );

	// }

	// var tanTheta = ( radiusBottom - radiusTop ) / height;
	// var na, nb;

	// for ( x = 0; x < radialSegments; x ++ ) {

	// 	if ( radiusTop !== 0 ) {

	// 		na = this.vertices[ vertices[ 0 ][ x ] ].clone();
	// 		nb = this.vertices[ vertices[ 0 ][ x + 1 ] ].clone();

	// 	} else {

	// 		na = this.vertices[ vertices[ 1 ][ x ] ].clone();
	// 		nb = this.vertices[ vertices[ 1 ][ x + 1 ] ].clone();

	// 	}

	// 	na.setY( Math.sqrt( na.x * na.x + na.z * na.z ) * tanTheta ).normalize();
	// 	nb.setY( Math.sqrt( nb.x * nb.x + nb.z * nb.z ) * tanTheta ).normalize();

	// 	for ( y = 0; y < heightSegments; y ++ ) {

	// 		var v1 = vertices[ y ][ x ];
	// 		var v2 = vertices[ y + 1 ][ x ];
	// 		var v3 = vertices[ y + 1 ][ x + 1 ];
	// 		var v4 = vertices[ y ][ x + 1 ];

	// 		var n1 = na.clone();
	// 		var n2 = na.clone();
	// 		var n3 = nb.clone();
	// 		var n4 = nb.clone();

	// 		var uv1 = uvs[ y ][ x ].clone();
	// 		var uv2 = uvs[ y + 1 ][ x ].clone();
	// 		var uv3 = uvs[ y + 1 ][ x + 1 ].clone();
	// 		var uv4 = uvs[ y ][ x + 1 ].clone();

	// 		this.faces.push( new THREE.Face3( v1, v2, v4, [ n1, n2, n4 ] ) );
	// 		this.faceVertexUvs[ 0 ].push( [ uv1, uv2, uv4 ] );

	// 		this.faces.push( new THREE.Face3( v2, v3, v4, [ n2.clone(), n3, n4.clone() ] ) );
	// 		this.faceVertexUvs[ 0 ].push( [ uv2.clone(), uv3, uv4.clone() ] );

	// 	}

	// }

	// // top cap

	// if ( openEnded === false && radiusTop > 0 ) {

	// 	this.vertices.push( new THREE.Vector3( 0, heightHalf, 0 ) );

	// 	for ( x = 0; x < radialSegments; x ++ ) {

	// 		var v1 = vertices[ 0 ][ x ];
	// 		var v2 = vertices[ 0 ][ x + 1 ];
	// 		var v3 = this.vertices.length - 1;

	// 		var n1 = new THREE.Vector3( 0, 1, 0 );
	// 		var n2 = new THREE.Vector3( 0, 1, 0 );
	// 		var n3 = new THREE.Vector3( 0, 1, 0 );

	// 		var uv1 = uvs[ 0 ][ x ].clone();
	// 		var uv2 = uvs[ 0 ][ x + 1 ].clone();
	// 		var uv3 = new THREE.Vector2( uv2.x, 0 );

	// 		this.faces.push( new THREE.Face3( v1, v2, v3, [ n1, n2, n3 ] ) );
	// 		this.faceVertexUvs[ 0 ].push( [ uv1, uv2, uv3 ] );

	// 	}

	// }

	// // bottom cap

	// if ( openEnded === false && radiusBottom > 0 ) {

	// 	this.vertices.push( new THREE.Vector3( 0, - heightHalf, 0 ) );

	// 	for ( x = 0; x < radialSegments; x ++ ) {

	// 		var v1 = vertices[ y ][ x + 1 ];
	// 		var v2 = vertices[ y ][ x ];
	// 		var v3 = this.vertices.length - 1;

	// 		var n1 = new THREE.Vector3( 0, - 1, 0 );
	// 		var n2 = new THREE.Vector3( 0, - 1, 0 );
	// 		var n3 = new THREE.Vector3( 0, - 1, 0 );

	// 		var uv1 = uvs[ y ][ x + 1 ].clone();
	// 		var uv2 = uvs[ y ][ x ].clone();
	// 		var uv3 = new THREE.Vector2( uv2.x, 1 );

	// 		this.faces.push( new THREE.Face3( v1, v2, v3, [ n1, n2, n3 ] ) );
	// 		this.faceVertexUvs[ 0 ].push( [ uv1, uv2, uv3 ] );

	// 	}

	// }

	this.computeCentroids();
	this.computeFaceNormals();

}

THREE.CrystalGeometry.prototype = Object.create( THREE.Geometry.prototype );