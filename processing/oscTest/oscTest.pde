/**
 * oscP5sendreceive by andreas schlegel
 * example shows how to send and receive osc messages.
 * oscP5 website at http://www.sojamo.de/oscP5
 */
 
import oscP5.*;
import netP5.*;
  
OscP5 oscP5;
NetAddress myRemoteLocation;

float touch3DX = -100, touch3DY = -100;
float touch2DX = -100, touch2DY = -100;

void setup() {
  size(568,320);
  frameRate(25);
  /* start oscP5, listening for incoming messages at port 12000 */
  oscP5 = new OscP5(this,12000);
  
  /* myRemoteLocation is a NetAddress. a NetAddress takes 2 parameters,
   * an ip address and a port number. myRemoteLocation is used as parameter in
   * oscP5.send() when sending osc packets to another computer, device, 
   * application. usage see below. for testing purposes the listening port
   * and the port of the remote location address are the same, hence you will
   * send messages back to this sketch.
   */
  myRemoteLocation = new NetAddress("127.0.0.1",12000);
}


void draw() {
  background(0); 
  fill( 255, 0, 255 );
  ellipse( touch3DX, touch3DY, 32, 32 );
  
  fill( 255, 255, 0 );
  ellipse( touch2DX, touch2DY, 32, 32 );
}

/* incoming osc message are forwarded to the oscEvent method. */
void oscEvent(OscMessage theOscMessage) {
  /* print the address pattern and the typetag of the received OscMessage */
//  print("### received an osc message.");
//  print(" addrpattern: "+theOscMessage.addrPattern());
//  println(" typetag: "+theOscMessage.typetag());
//  
  String address = theOscMessage.addrPattern();

  if ( address.equals( "/heartbeat" ) ) {
    println( "received heartbeat: " + theOscMessage.get(0).stringValue() );
  }
  else if ( address.equals( "/touch3D" ) || address.equals( "/touch2D" ) ) {
    String phase = theOscMessage.get(0).stringValue();
    float x = theOscMessage.get(1).floatValue();
    float y = theOscMessage.get(2).floatValue();
    float w = theOscMessage.get(3).floatValue();
    float h = theOscMessage.get(4).floatValue();
    if ( address.equals( "/touch3D" ) ) {
      touch3DX = ( x / w ) * width;
      touch3DY = ( y / h ) * height;    
    }
    else {
      touch2DX = ( x / w ) * width;
      touch2DY = ( y / h ) * height;
    }
    
    if ( phase.equals( "start" ) )
      println( "touch started " + address );
    else if ( phase.equals( "end" ) )
      println( "touch ended " + address );
      
  } // end if touch3D/touch2D
}
