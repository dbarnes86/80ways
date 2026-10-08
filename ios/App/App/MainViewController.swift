import AuthenticationServices
import Capacitor
import UIKit

/// The app's web view controller. Exists to register the plugins that live in this target.
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(AppleSignInPlugin())
    }
}

/// Sign in with Apple, native sheet. Returns Apple's identity token; the web app hands it to
/// Supabase (signInWithIdToken), which checks it against Apple and the nonce.
///
/// Lives here rather than as an npm plugin so the app doesn't pull in the Google and Facebook SDKs
/// that the multi-provider plugins bundle.
@objc(AppleSignInPlugin)
public class AppleSignInPlugin: CAPPlugin, CAPBridgedPlugin, ASAuthorizationControllerDelegate,
    ASAuthorizationControllerPresentationContextProviding
{
    public let identifier = "AppleSignInPlugin"
    public let jsName = "AppleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise)
    ]

    private var pendingCall: CAPPluginCall?

    @objc func signIn(_ call: CAPPluginCall) {
        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.requestedScopes = [.fullName, .email]
        // The SHA-256 of the raw nonce. Apple puts it in the token; Supabase hashes the raw one to match.
        request.nonce = call.getString("nonce")

        pendingCall = call
        DispatchQueue.main.async {
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
    }

    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        return bridge?.webView?.window ?? ASPresentationAnchor()
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let call = pendingCall else { return }
        pendingCall = nil
        guard
            let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
            let tokenData = credential.identityToken,
            let idToken = String(data: tokenData, encoding: .utf8)
        else {
            call.reject("Apple didn't return an identity token.", "NO_TOKEN")
            return
        }
        // Apple only sends the name the first time someone signs in, so pass it on when it's there.
        let name = [credential.fullName?.givenName, credential.fullName?.familyName]
            .compactMap { $0 }
            .joined(separator: " ")
        call.resolve([
            "idToken": idToken,
            "givenName": credential.fullName?.givenName ?? "",
            "fullName": name,
            "email": credential.email ?? "",
        ])
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        guard let call = pendingCall else { return }
        pendingCall = nil
        if let authError = error as? ASAuthorizationError, authError.code == .canceled {
            call.reject("Cancelled", "CANCELLED")
        } else {
            call.reject(error.localizedDescription, "FAILED")
        }
    }
}
