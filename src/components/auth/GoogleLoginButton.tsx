import React from 'react';
import { Capacitor } from '@capacitor/core';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

let nativeGoogleInitialized = false;

const GoogleDivider: React.FC = () => (
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <span className="w-full border-t border-gray-200" />
    </div>
    <div className="relative flex justify-center text-xs uppercase">
      <span className="bg-white px-2 text-gray-400">atau</span>
    </div>
  </div>
);

/**
 * Native (Android/iOS) Google button. The web GSI script (@react-oauth/google) never
 * renders inside the Capacitor WebView: it validates window.location.origin
 * (https://localhost there) against the OAuth client's Authorized JavaScript Origins,
 * and Google also actively blocks GSI/OAuth flows detected running inside embedded
 * WebViews. Native Credential Manager sign-in sidesteps both problems.
 */
const NativeGoogleLoginButton: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const handlePress = async () => {
    try {
      if (!nativeGoogleInitialized) {
        await SocialLogin.initialize({
          google: { webClientId: GOOGLE_CLIENT_ID },
        });
        nativeGoogleInitialized = true;
      }

      const { result } = await SocialLogin.login({
        provider: 'google',
        options: { scopes: ['email', 'profile'] },
      });

      if (result.responseType !== 'online') {
        toast({ title: 'Error', description: 'Tidak ada kredensial dari Google', variant: 'destructive' });
        return;
      }
      if (!result.idToken) {
        toast({ title: 'Error', description: 'Tidak ada kredensial dari Google', variant: 'destructive' });
        return;
      }

      await signInWithGoogle(result.idToken);
    } catch {
      // Error toast handled in AuthContext for signInWithGoogle failures; this catch
      // also covers SocialLogin.initialize/login rejecting (e.g. user cancelled).
      toast({ title: 'Error', description: 'Gagal masuk dengan Google', variant: 'destructive' });
    }
  };

  return (
    <div className="mt-6">
      <GoogleDivider />
      <div className="mt-4 flex justify-center">
        <Button type="button" variant="outline" className="w-[320px] max-w-full" onClick={handlePress}>
          Lanjutkan dengan Google
        </Button>
      </div>
    </div>
  );
};

const WebGoogleLoginButton: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID as string}>
      <div className="mt-6">
        <GoogleDivider />
        <div className="mt-4 flex justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (!credentialResponse.credential) {
                toast({
                  title: 'Error',
                  description: 'Tidak ada kredensial dari Google',
                  variant: 'destructive',
                });
                return;
              }
              try {
                await signInWithGoogle(credentialResponse.credential);
              } catch {
                // Error toast handled in AuthContext
              }
            }}
            onError={() => {
              toast({
                title: 'Error',
                description: 'Gagal masuk dengan Google',
                variant: 'destructive',
              });
            }}
            text="continue_with"
            shape="rectangular"
            width="320"
          />
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

/**
 * Google Sign-In button. Renders a divider + Google button.
 * No-op (renders nothing) when VITE_GOOGLE_CLIENT_ID is not configured, so the
 * app works unchanged in environments without Google OAuth set up.
 */
export const GoogleLoginButton: React.FC = () => {
  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return Capacitor.isNativePlatform() ? <NativeGoogleLoginButton /> : <WebGoogleLoginButton />;
};
