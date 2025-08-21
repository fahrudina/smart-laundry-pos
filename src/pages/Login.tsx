import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  role: 'staff' | 'laundry_owner';
  storeName?: string;
  storeAddress?: string;
}

export const Login: React.FC = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  
  usePageTitle('Login');

  const loginForm = useForm<LoginForm>();
  const signUpForm = useForm<SignUpForm>({
    defaultValues: {
      role: 'staff'
    }
  });
  
  // Watch role to show/hide store fields
  const watchedRole = signUpForm.watch('role');

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
        message: 'Passwords do not match',
      });
      return;
    }

    // Validate store data for laundry owners
    if (data.role === 'laundry_owner' && !data.storeName) {
      signUpForm.setError('storeName', {
        type: 'manual',
        message: 'Store name is required for laundry owners',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Prepare store data if user is signing up as laundry owner
      const storeData = data.role === 'laundry_owner' && data.storeName ? {
        name: data.storeName,
        address: data.storeAddress,
        phone: data.phone // Use user's phone as store phone
      } : undefined;
      
      await signUp(data.email, data.password, data.fullName, data.phone, data.role, storeData);
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
          <CardDescription>Sign in to access your laundry management system</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    {...loginForm.register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    {...loginForm.register('password', { 
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
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
                  Sign In
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-fullname">Full Name</Label>
                  <Input
                    id="signup-fullname"
                    type="text"
                    placeholder="Enter your full name"
                    {...signUpForm.register('fullName', { 
                      required: 'Full name is required'
                    })}
                  />
                  {signUpForm.formState.errors.fullName && (
                    <p className="text-sm text-red-500">{signUpForm.formState.errors.fullName.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <RadioGroup
                    defaultValue="staff"
                    onValueChange={(value) => signUpForm.setValue('role', value as 'staff' | 'laundry_owner')}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="staff" id="role-staff" />
                      <Label htmlFor="role-staff" className="text-sm font-normal">
                        Staff Member
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="laundry_owner" id="role-owner" />
                      <Label htmlFor="role-owner" className="text-sm font-normal">
                        Laundry Owner
                      </Label>
                    </div>
                  </RadioGroup>
                  {signUpForm.formState.errors.role && (
                    <p className="text-sm text-red-500">{signUpForm.formState.errors.role.message}</p>
                  )}
                </div>
                
                {watchedRole === 'laundry_owner' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="signup-storename">Store Name</Label>
                      <Input
                        id="signup-storename"
                        type="text"
                        placeholder="Enter your store name"
                        {...signUpForm.register('storeName', { 
                          required: watchedRole === 'laundry_owner' ? 'Store name is required' : false
                        })}
                      />
                      {signUpForm.formState.errors.storeName && (
                        <p className="text-sm text-red-500">{signUpForm.formState.errors.storeName.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-storeaddress">Store Address</Label>
                      <Input
                        id="signup-storeaddress"
                        type="text"
                        placeholder="Enter your store address (optional)"
                        {...signUpForm.register('storeAddress')}
                      />
                      {signUpForm.formState.errors.storeAddress && (
                        <p className="text-sm text-red-500">{signUpForm.formState.errors.storeAddress.message}</p>
                      )}
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    {...signUpForm.register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                  />
                  {signUpForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{signUpForm.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    {...signUpForm.register('phone', { 
                      required: 'Phone number is required'
                    })}
                  />
                  {signUpForm.formState.errors.phone && (
                    <p className="text-sm text-red-500">{signUpForm.formState.errors.phone.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    {...signUpForm.register('password', { 
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                  />
                  {signUpForm.formState.errors.password && (
                    <p className="text-sm text-red-500">{signUpForm.formState.errors.password.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    {...signUpForm.register('confirmPassword', { 
                      required: 'Please confirm your password'
                    })}
                  />
                  {signUpForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">{signUpForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign Up
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-gray-600">
            Secure access to your laundry management system
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
