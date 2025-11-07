import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { usePageTitle } from '@/hooks/usePageTitle';

interface LoginForm {
  email: string;
  password: string;
}

interface SignUpForm extends LoginForm {
  confirmPassword: string;
  fullName: string;
  phone: string;
  isOwner: boolean;
  storeName: string;
  storeAddress: string;
  storePhone: string;
}

export const Login: React.FC = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  
  usePageTitle('Masuk');

  const loginForm = useForm<LoginForm>();
  const signUpForm = useForm<SignUpForm>();
  const isOwner = signUpForm.watch('isOwner');

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
    if (data.password !== data.confirmPassword) {
      signUpForm.setError('confirmPassword', {
        type: 'manual',
        message: 'Kata sandi tidak cocok',
      });
      return;
    }

    try {
      setIsLoading(true);
      const role = data.isOwner ? 'laundry_owner' : 'staff';
      const storeData = data.isOwner ? {
        name: data.storeName,
        address: data.storeAddress,
        phone: data.storePhone
      } : undefined;
      await signUp(data.email, data.password, data.fullName, data.phone, role, storeData);
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Smart Laundry POS</CardTitle>
          <CardDescription>Masuk untuk mengakses sistem manajemen laundry Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
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
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Masukkan kata sandi Anda"
                    {...loginForm.register('password', { 
                      required: 'Kata sandi wajib diisi',
                      minLength: {
                        value: 6,
                        message: 'Kata sandi minimal 6 karakter'
                      }
                    })}
                  />
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
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Buat kata sandi"
                    {...signUpForm.register('password', { 
                      required: 'Kata sandi wajib diisi',
                      minLength: {
                        value: 6,
                        message: 'Kata sandi minimal 6 karakter'
                      }
                    })}
                  />
                  {signUpForm.formState.errors.password && (
                    <p className="text-sm text-red-500">{signUpForm.formState.errors.password.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Konfirmasi Kata Sandi</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="Konfirmasi kata sandi Anda"
                    {...signUpForm.register('confirmPassword', { 
                      required: 'Silakan konfirmasi kata sandi Anda'
                    })}
                  />
                  {signUpForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">{signUpForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="signup-owner"
                    checked={isOwner}
                    onCheckedChange={(checked) => signUpForm.setValue('isOwner', !!checked)}
                  />
                  <Label htmlFor="signup-owner" className="text-sm">
                    Daftar sebagai Pemilik Laundry (dapat mengelola beberapa toko)
                  </Label>
                </div>
                
                {isOwner && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="signup-store-name">Nama Toko</Label>
                      <Input
                        id="signup-store-name"
                        type="text"
                        placeholder="Masukkan nama toko Anda"
                        {...signUpForm.register('storeName', { 
                          required: isOwner ? 'Nama toko wajib diisi untuk pemilik' : false
                        })}
                      />
                      {signUpForm.formState.errors.storeName && (
                        <p className="text-sm text-red-500">{signUpForm.formState.errors.storeName.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-store-address">Alamat Toko</Label>
                      <Input
                        id="signup-store-address"
                        type="text"
                        placeholder="Masukkan alamat toko Anda"
                        {...signUpForm.register('storeAddress', { 
                          required: isOwner ? 'Alamat toko wajib diisi untuk pemilik' : false
                        })}
                      />
                      {signUpForm.formState.errors.storeAddress && (
                        <p className="text-sm text-red-500">{signUpForm.formState.errors.storeAddress.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-store-phone">Nomor Telepon Toko</Label>
                      <Input
                        id="signup-store-phone"
                        type="tel"
                        placeholder="Masukkan nomor telepon toko Anda"
                        {...signUpForm.register('storePhone', { 
                          required: isOwner ? 'Nomor telepon toko wajib diisi untuk pemilik' : false
                        })}
                      />
                      {signUpForm.formState.errors.storePhone && (
                        <p className="text-sm text-red-500">{signUpForm.formState.errors.storePhone.message}</p>
                      )}
                    </div>
                  </>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Daftar
                </Button>
              </form>
            </TabsContent>
          </Tabs>
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
