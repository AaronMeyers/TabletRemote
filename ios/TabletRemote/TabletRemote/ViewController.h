#import <UIKit/UIKit.h>

@interface ViewController : UIViewController<UITextFieldDelegate, UIWebViewDelegate> {
    
}

@property (nonatomic,strong) IBOutlet UIWebView *remoteWebView;
@property (nonatomic,strong) IBOutlet UITextField *addressTextField;
@property (nonatomic,strong) IBOutlet UIButton *goButton;
@property (nonatomic,strong) IBOutlet UILongPressGestureRecognizer *longPress;

@end
