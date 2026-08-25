import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseErrorMessage, firebaseSendPasswordReset } from '@/lib/firebase';
import { cn } from '@/lib/utils';

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      fill="currentColor"
      d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"
    />
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const fieldClass =
  'flex h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

const labelClass = 'text-sm font-medium leading-none text-foreground';

type Busy = 'email' | 'google' | 'apple' | 'reset' | null;

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
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);

  // firebaseErrorMessage returns '' for user-cancelled popups -- staying quiet
  // there is the point, so an empty message means show nothing.
  const run = async (which: Busy, action: () => Promise<void>) => {
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
      toast({ title: 'Password too short', description: 'Use at least 6 characters.', variant: 'destructive' });
      return;
    }
    run('email', () => (isSignup ? signup(email, password, name) : login(email, password)));
  };

  const onForgotPassword = () => {
    if (!email.trim()) {
      toast({
        title: 'Enter your email first',
        description: 'Type your email above, then tap the link again.',
      });
      return;
    }
    run('reset', async () => {
      await firebaseSendPasswordReset(email.trim());
      toast({
        title: 'Reset link sent',
        description: `Check ${email.trim()} for a link to set a new password.`,
      });
    });
  };

  const socialDisabled = busy !== null;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="space-y-3 text-center">
          <div className="inline-flex rounded-md border border-border bg-muted p-2">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {isSignup ? 'Create an account' : 'Welcome back'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSignup ? 'Enter your details to get started' : 'Enter your credentials to sign in'}
            </p>
          </div>
        </div>

        {/* Apple and Google only -- these are the providers enabled in Firebase.
            A third button that always errors is worse than no button. */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => run('apple', loginWithApple)}
            disabled={socialDisabled}
            aria-label="Continue with Apple"
            className="flex h-10 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {busy === 'apple' ? <Loader2 className="h-4 w-4 animate-spin" /> : <AppleIcon />}
          </button>
          <button
            type="button"
            onClick={() => run('google', loginWithGoogle)}
            disabled={socialDisabled}
            aria-label="Continue with Google"
            className="flex h-10 items-center justify-center rounded-md border border-border bg-background transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {busy === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {isSignup && (
            <div className="space-y-2">
              <label htmlFor="name" className={labelClass}>Name</label>
              <input
                id="name"
                autoComplete="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className={labelClass}>Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className={labelClass}>Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(fieldClass, 'pr-10')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy !== null}
            className="inline-flex h-10 w-full items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {busy === 'email' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignup ? 'Create account' : 'Sign In'}
          </button>
        </form>

        <div className="space-y-2 text-center">
          <p className="text-sm text-muted-foreground">
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <Link
              to={isSignup ? '/login' : '/signup'}
              className="font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground"
            >
              {isSignup ? 'Sign in' : 'Sign up'}
            </Link>
          </p>
          {!isSignup && (
            <button
              type="button"
              onClick={onForgotPassword}
              disabled={busy !== null}
              className="text-sm font-medium text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground disabled:opacity-50"
            >
              {busy === 'reset' ? 'Sending…' : 'Forgot your password?'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
