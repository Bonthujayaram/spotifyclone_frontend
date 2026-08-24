import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Navigate } from 'react-router-dom';
import { authApi } from '@/lib/authApi';
import { getGoogleAuthAvailability, loadGoogleIdentityScript } from '@/lib/googleIdentity';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleAuth = useMemo(() => getGoogleAuthAvailability(), []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast({
        title: "Success",
        description: "You have been logged in successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Invalid email or password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!googleAuth.enabled || !googleAuth.clientId || !googleButtonRef.current) return;
    let cancelled = false;

    function handleCredentialResponse(response: { credential?: string }) {
      const idToken = response?.credential;
      if (!idToken) return;
      authApi.googleSignIn(idToken)
        .then(res => {
          localStorage.setItem('token', res.token);
          window.location.href = '/';
        })
        .catch(() => {
          toast({ title: 'Error', description: 'Google sign-in failed', variant: 'destructive' });
        });
    }

    const initGoogle = async () => {
      try {
        await loadGoogleIdentityScript();
        if (cancelled || !googleButtonRef.current || !window.google?.accounts?.id) return;

        googleButtonRef.current.innerHTML = '';
        window.google!.accounts!.id!.initialize({
          client_id: googleAuth.clientId,
          callback: handleCredentialResponse,
          ux_mode: 'popup',
        });
        const buttonWidth = Math.max(googleButtonRef.current.offsetWidth || 0, 280);
        window.google!.accounts!.id!.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          width: buttonWidth,
        });
      } catch (error) {
        console.error('Failed to initialize Google sign-in:', error);
        if (!cancelled) {
          toast({
            title: 'Google sign-in unavailable',
            description: 'Google sign-in could not be initialized on this page.',
            variant: 'destructive',
          });
        }
      }
    };

    void initGoogle();
    return () => {
      cancelled = true;
    };
  }, [googleAuth.clientId, googleAuth.enabled, toast]);

  // Must sit below every hook: returning early above useEffect changes the hook
  // count between renders and crashes React the moment auth flips to true.
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-32 h-32 mb-4">
            <img src="/echovibe2.png" alt="EchoVibe" className="w-full h-full object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-gray-400">Or continue with</span>
            </div>
          </div>

          {googleAuth.enabled ? (
            <div className="w-full" ref={googleButtonRef} />
          ) : (
            <div className="rounded-md border border-dashed border-border/70 px-3 py-3 text-sm text-muted-foreground">
              {googleAuth.reason || 'Google sign-in is currently unavailable.'}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-gray-400 text-center">
            Don't have an account?{' '}
            <a href="/signup" className="text-primary hover:underline">
              Sign up
            </a>
          </div>
          <a href="/forgot-password" className="text-sm text-primary hover:underline text-center">
            Forgot your password?
          </a>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login; 
