#import "ViewController.h"

@interface ViewController ()

@end

@implementation ViewController

-(IBAction)goButtonPressed:(id)sender {
    NSString *urlString = [NSString stringWithFormat:@"http://%@", [self.addressTextField text]];
    NSURL *url = [NSURL URLWithString:urlString];
    [self.remoteWebView loadRequest:[NSURLRequest requestWithURL:url]];
}

#pragma mark UITextFieldDelegate

- (BOOL)textFieldShouldReturn:(UITextField *)textField {
    // dismiss the keyboard
    [textField resignFirstResponder];
    // save the contents
    [[NSUserDefaults standardUserDefaults] setValue:[textField text] forKey:@"lastAddress"];
    [[NSUserDefaults standardUserDefaults] synchronize];
    // load the web view
    NSString *urlString = [NSString stringWithFormat:@"http://%@", [textField text]];
    NSURL *url = [NSURL URLWithString:urlString];
    [self.remoteWebView loadRequest:[NSURLRequest requestWithURL:url]];
    return YES;
}

#pragma mark UIWebViewDelegate

- (void)webView:(UIWebView *)webView didFailLoadWithError:(NSError *)error {
    NSLog( @"web view failed with error: %@", [error localizedDescription] );
}

- (void)webViewDidFinishLoad:(UIWebView *)webView {
    NSLog( @"web view finished load of %@", webView.request.URL.absoluteString );
    [UIView animateWithDuration:1.0 animations:^{
        [self.addressTextField setAlpha:0.0];
        [self.goButton setAlpha:0.0];
    } completion:^(BOOL finished) {
        
    }];
}

- (void)handleLongPress:(UILongPressGestureRecognizer *)gesture {
    NSLog( @"long press" );
    [UIView animateWithDuration:1 animations:^{
        [self.addressTextField setAlpha:1.0];
        [self.goButton setAlpha:1.0];
    } completion:^(BOOL finished) {
        
    }];
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    if ( [[NSUserDefaults standardUserDefaults] stringForKey:@"lastAddress"] ) {
        [self.addressTextField setText:[[NSUserDefaults standardUserDefaults] stringForKey:@"lastAddress"]];
        NSString *urlString = [NSString stringWithFormat:@"http://%@?deviceName=%@", [self.addressTextField text], [[UIDevice currentDevice] name]];
        NSURL *url = [NSURL URLWithString:urlString];
        [self.remoteWebView loadRequest:[NSURLRequest requestWithURL:url]];
    }
    
    [self.longPress setMinimumPressDuration:1];
    [self.longPress setNumberOfTouchesRequired:2];
    [self.longPress addTarget:self action:@selector(handleLongPress:)];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (BOOL)prefersStatusBarHidden {
    return YES;
}

@end
