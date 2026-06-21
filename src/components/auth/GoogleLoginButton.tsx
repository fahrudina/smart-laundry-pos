import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

/**
 * Google Sign-In button. Renders a divider + Google button.
 * No-op (renders nothing) when VITE_GOOGLE_CLIENT_ID is not configured, so the
 * app works unchanged in environments without Google OAuth set up.
 */
export const GoogleLoginButton: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400">atau</span>
          </div>
        </div>

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
