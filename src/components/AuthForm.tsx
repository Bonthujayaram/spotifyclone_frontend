import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseErrorMessage } from '@/lib/firebase';

// Inline so the auth screens pull no icon library beyond what they already use.
const GoogleMark = () => (
  <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18Z" />
    <path fill="#FBBC05" d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34Z" />
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z" />
  </svg>
);

const AppleMark = () => (
  <svg viewBox="0 0 384 512" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-36.8-2.8-77 21.3-91.7 21.3-15.5 0-51.1-20.3-79.1-20.3C56.7 141.2 0 184.8 0 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 61.3 121.3 111.9 119.8 26.5-.6 45.2-18.8 79.7-18.8 33.5 0 50.8 18.2 80.3 18.2 51-.7 94.9-77.6 107-114.4-68.4-32.2-74.6-88.7-74.6-90.8zM255.2 79.3C279.7 50.2 277.5 23.7 276.8 14c-21.5 1.3-46.4 14.7-60.6 31.2-15.6 17.7-24.8 39.6-22.8 63.9 23.3 1.8 44.6-10.2 61.8-29.8z" />
  </svg>
);

interface AuthFormProps {
  mode: 'login' | 'signup';
}

const AuthForm = ({ mode }: AuthFormProps) => {
  const isSignup = mode === 'signup';
  const { login, signup, loginWithGoogle, loginWithApple } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'email' | 'google' | 'apple' | null>(null);

  // firebaseErrorMessage returns '' for user-cancelled popups -- staying quiet
  // there is the point, so an empty message means show nothing.
  const run = async (which: 'email' | 'google' | 'apple', action: () => Promise<void>) => {
    setBusy(which);
    try {
      await action();
    } catch (error) {
      const description = firebaseErrorMessage(error);
      if (description) {
        toast({ title: isSignup ? 'Could not sign up' : 'Could not sign in', description, variant: 'destructive' });
      }
    } finally {
      setBusy(null);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (isSignup && password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Use at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }
    run('email', () => (isSignup ? signup(email, password, name) : login(email, password)));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary">
            <Music className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSignup ? 'Start listening in seconds.' : 'Sign in to keep listening.'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center gap-2"
            disabled={busy !== null}
            onClick={() => run('google', loginWithGoogle)}
          >
            {busy === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleMark />}
            Continue with Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full justify-center gap-2"
            disabled={busy !== null}
            onClick={() => run('apple', loginWithApple)}
          >
            {busy === 'apple' ? <Loader2 className="h-4 w-4 animate-spin" /> : <AppleMark />}
            Continue with Apple
          </Button>
        </div>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {isSignup && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                autoComplete="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder={isSignup ? 'At least 6 characters' : '••••••••'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={busy !== null}>
            {busy === 'email' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignup ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <Link
            to={isSignup ? '/login' : '/signup'}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {isSignup ? 'Sign in' : 'Sign up'}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
