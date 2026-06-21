import React, { useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PageLoading } from '@/components/ui/loading-spinner';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';

interface LoginForm {
  email: string;
  password: string;
}

interface SignUpForm extends LoginForm {
  fullName: string;
  phone: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
}

export const Login: React.FC = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showStoreDetails, setShowStoreDetails] = useState(false);

  usePageTitle('Login');

  const loginForm = useForm<LoginForm>();
  const signUpForm = useForm<SignUpForm>();

  // Redirect if already authenticated
  if (user) {
    const from = location.state?.from?.pathname || '/home';
    return <Navigate to={from} replace />;
  }

  const handleLogin = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      await signIn(data.email, data.password);
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: SignUpForm) => {
    try {
      setIsLoading(true);
      const role = 'laundry_owner';
      const storeData = {
        name: data.storeName,
        address: data.storeAddress || undefined,
        phone: data.storePhone || undefined
      };
      await signUp(data.email, data.password, data.fullName, data.phone, role, storeData);
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <PageLoading text="Memuat..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Smart Laundry POS</CardTitle>
          <CardDescription>Masuk ke akun Anda atau daftar sebagai pemilik toko</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Masukkan email Anda"
                    {...loginForm.register('email', {
                      required: 'Email wajib diisi',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Alamat email tidak valid'
                      }
                    })}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Kata Sandi</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="Masukkan kata sandi Anda"
                      className="pr-10"
                      {...loginForm.register('password', {
                        required: 'Kata sandi wajib diisi',
                        minLength: {
                          value: 6,
                          message: 'Kata sandi minimal 6 karakter'
                        }
                      })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Masuk
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-fullname">Nama Lengkap</Label>
                  <Input
                    id="signup-fullname"
                    type="text"
                    placeholder="Masukkan nama lengkap Anda"
                    {...signUpForm.register('fullName', {
                      required: 'Nama lengkap wajib diisi'
                    })}
                  />
                  {signUpForm.formState.errors.fullName && (
                    <p className="text-sm text-red-500">{signUpForm.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Masukkan email Anda"
                    {...signUpForm.register('email', {
                      required: 'Email wajib diisi',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Alamat email tidak valid'
                      }
                    })}
                  />
                  {signUpForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{signUpForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Nomor Telepon</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="Masukkan nomor telepon Anda"
                    {...signUpForm.register('phone', {
                      required: 'Nomor telepon wajib diisi'
                    })}
                  />
                  {signUpForm.formState.errors.phone && (
                    <p className="text-sm text-red-500">{signUpForm.formState.errors.phone.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Kata Sandi</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="Buat kata sandi"
                      className="pr-10"
                      {...signUpForm.register('password', {
                        required: 'Kata sandi wajib diisi',
                        minLength: {
                          value: 6,
                          message: 'Kata sandi minimal 6 karakter'
                        }
                      })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  {signUpForm.formState.errors.password && (
                    <p className="text-sm text-red-500">{signUpForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-store-name">Nama Toko</Label>
                  <Input
                    id="signup-store-name"
                    type="text"
                    placeholder="Masukkan nama toko Anda"
                    {...signUpForm.register('storeName', {
                      required: 'Nama toko wajib diisi'
                    })}
                  />
                  {signUpForm.formState.errors.storeName && (
                    <p className="text-sm text-red-500">{signUpForm.formState.errors.storeName.message}</p>
                  )}
                </div>

                <Collapsible open={showStoreDetails} onOpenChange={setShowStoreDetails}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-md py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      <span>Detail toko (opsional)</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${showStoreDetails ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="signup-store-address">Alamat Toko</Label>
                      <Input
                        id="signup-store-address"
                        type="text"
                        placeholder="Masukkan alamat toko Anda (opsional)"
                        {...signUpForm.register('storeAddress')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-store-phone">Nomor Telepon Toko</Label>
                      <Input
                        id="signup-store-phone"
                        type="tel"
                        placeholder="Masukkan nomor telepon toko Anda (opsional)"
                        {...signUpForm.register('storePhone')}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Bisa dilengkapi nanti di Pengaturan Toko.
                    </p>
                  </CollapsibleContent>
                </Collapsible>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Daftar Gratis
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Google sign-in (shared by both tabs; hidden when not configured) */}
          <GoogleLoginButton />
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-gray-600">
            Akses aman ke sistem manajemen laundry Anda
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
