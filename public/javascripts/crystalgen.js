function Gem( width, height, margin, div ) {
	this.canvas = $('<canvas/>')[0];
	this.width = this.canvas.width = width;
	this.height = this.canvas.height = height;
	this.margin = margin;
	this.squarePts = [];
	this.facetPts = [];

	if ( typeof div !== 'undefined' )
		div.prepend(this.canvas);
}

Gem.prototype.generate = function() {
	this.squarePts = [];
	this.facetPts = [];

	var offset = this.margin * .5;

	// upper left
	var ul = {x:0+this.margin, y:0+this.margin};
	this.squarePts.push(ul);
	this.facetPts.push(
		{
			x: ul.x - ( offset + utils.random( 0, offset ) ),
			y: ul.y + utils.random( -offset*.5, offset * .5 )
		},
		{
			x: ul.x + utils.random( -offset*.5, offset * .5 ),
			y: ul.y - ( offset + utils.random( 0, offset ) )
		}
	);
	// upper right
	var ur = {x:this.width-this.margin, y:0+this.margin};
	this.squarePts.push(ur);
	this.facetPts.push(
		{
			x: ur.x + utils.random( -offset*.5, offset * .5 ),
			y: ur.y - ( offset + utils.random( 0, offset ) )
		},
		{
			x: ur.x + ( offset + utils.random( 0, offset ) ),
			y: ur.y + utils.random( -offset*.5, offset * .5 )
		}
	);
	// lower right
	var lr = {x:this.width-this.margin, y:this.height-this.margin};
	this.squarePts.push(lr);
	this.facetPts.push(
		{
			x: lr.x + ( offset + utils.random( 0, offset ) ),
			y: lr.y + utils.random( -offset*.5, offset * .5 )
		},
		{
			x: lr.x + utils.random( -offset*.5, offset * .5 ),
			y: lr.y + ( offset + utils.random( 0, offset ) )
		}
	);
	// lower left
	var ll = {x:0+this.margin, y:this.height-this.margin};
	this.squarePts.push(ll);
	this.facetPts.push(
		{
			x: ll.x + utils.random( -offset*.5, offset * .5 ),
			y: ll.y + ( offset + utils.random( 0, offset ) )
		},
		{
			x: ll.x - ( offset + utils.random( 0, offset ) ),
			y: ll.y + utils.random( -offset*.5, offset * .5 )
		}
	);

	this.draw();
}

Gem.prototype.jitter = function( jitterAmt ) {
	this.draw( jitterAmt );
}

Gem.prototype.draw = function( jitterAmt ) {

	jitter = ( typeof jitter === 'undefined' ) ? 0.0 : jitterAmt;

	var ctx = this.canvas.getContext( '2d' );

	ctx.lineJoin = 'bevel';
	ctx.clearRect( 0, 0, this.width, this.height );
	ctx.strokeStyle = 'white';
	ctx.lineWidth = 2;

	// make the inner square
	// ctx.beginPath();
	// this.squarePts.forEach(function(pt){
	// 	ctx.lineTo( pt.x, pt.y );
	// });
	// ctx.lineTo( this.squarePts[0].x, this.squarePts[0].y );
	// ctx.fill();
	// ctx.stroke();

	var squarePts, facetPts;
	if ( jitterAmt ) {
		squarePts = this.squarePts;
		facetPts = this.facetPts.slice(0);
		for ( var i=0; i<facetPts.length; i++ ) {
			var pt = facetPts[i];
			// facetPts[i] = jQuery.extend({}, facetPts[i]);
			// facetPts[i].x += utils.random( -jitterAmt, jitterAmt );
			// facetPts[i].y += utils.random( -jitterAmt, jitterAmt );
			facetPts[i] = {
				x: pt.x + utils.random( -jitterAmt, jitterAmt ),
				y: pt.y + utils.random( -jitterAmt, jitterAmt )
			}
		}
	}
	else {
		squarePts = this.squarePts;
		facetPts = this.facetPts;
	}

	for ( var i=0; i<squarePts.length; i++ ) {
		var sPt1 = squarePts[i];
		// sPt2 is the next square point
		var sPt2 = squarePts[ (i+1) % squarePts.length ];

		var fPt1 = facetPts[ i * 2 + 0];
		var fPt2 = facetPts[ i * 2 + 1];
		// fPt3 is the next facet
		var fPt3 = facetPts[ ( (i+1) % squarePts.length ) * 2 ];

		// make the corner triangles
		ctx.beginPath();
		ctx.lineTo( sPt1.x, sPt1.y );
		ctx.lineTo( fPt1.x, fPt1.y );
		ctx.lineTo( fPt2.x, fPt2.y );
		ctx.lineTo( sPt1.x, sPt1.y );
		ctx.fill();
		ctx.stroke();

		// make the rect
		ctx.beginPath();
		ctx.lineTo( sPt1.x, sPt1.y );
		ctx.lineTo( fPt2.x, fPt2.y );
		ctx.lineTo( fPt3.x, fPt3.y );
		ctx.lineTo( sPt2.x, sPt2.y );
		ctx.lineTo( sPt1.x, sPt1.y );
		ctx.fill();
		ctx.stroke();
	}
}

function Crystal( width, height, div ) {
	this.canvas = $('<canvas/>')[0];
	this.width = width;
	this.height = height;
	this.canvas.width = width;
	this.canvas.height = height;
	this.basePoints = [];
	this.tip = {x:0,y:0};
	if ( typeof div !== 'undefined' )
		div.append(this.canvas);
}

Crystal.prototype.generate = function() {

	this.basePoints = [];

	// var numBasePoints = Math.round( utils.random( 4, 5 ) );
	var numBasePoints = 4;
	// console.log( 'num base points: ' + numBasePoints );
	for ( var i=0; i<numBasePoints; i++ ) {
		var x, y;
		// first and last base points should be a fair nudge from the left
		if ( i == 0 || i == numBasePoints - 1 ) {
			x = utils.random( 50, 100 );
			var norm = i / (numBasePoints-1);
			y = this.height * (norm<.5?utils.random(.05,.1):utils.random(.9,.95));

		}
		else {
			x = utils.random( 0, 50 );
			var norm = i / (numBasePoints-1);
			y = this.height * (norm<.5?utils.random(.15,.3):utils.random(.7,.85));
			// y = ( i / (numBasePoints-1) ) * this.height;
		}

		this.basePoints.push({
			x:x,
			y:y
		});

		this.tip.x = this.width;
		this.tip.y = utils.random( this.height * .4, this.height * .6 );
	}


	var ctx = this.canvas.getContext( '2d' );
	ctx.clearRect( 0, 0, this.width, this.height );
	ctx.strokeStyle = 'white';

	ctx.lineWidth = 2;
	ctx.lineJoin = 'bevel';

	var tip = this.tip;
	for ( var i=0; i<this.basePoints.length-1; i++ ) {
		var bp1 = this.basePoints[i];
		var bp2 = this.basePoints[i+1];
		ctx.beginPath();
		ctx.lineTo( bp1.x, bp1.y );
		ctx.lineTo( bp2.x, bp2.y );
		ctx.lineTo( tip.x, tip.y );
		ctx.lineTo( bp1.x, bp1.y );
		// ctx.stroke();
		ctx.fill();
	}

	ctx.beginPath();
	for ( var i=0; i<this.basePoints.length; i++ ) {
		var pt = this.basePoints[i];
		ctx.lineTo( pt.x, pt.y );
	}
	ctx.stroke();

	this.basePoints.forEach(function(pt) {
		ctx.beginPath();
		ctx.lineTo( tip.x, tip.y );
		ctx.lineTo( pt.x, pt.y );
		ctx.stroke();
	});
}