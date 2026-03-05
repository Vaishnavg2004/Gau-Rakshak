import { useMemo, useState } from 'react';
import { ShieldCheck, UserRound, Leaf, LogIn, UserPlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth, type UserRole } from '@/lib/auth';

const roleOptions: Array<{ role: UserRole; title: string; desc: string; icon: typeof ShieldCheck }> = [
  { role: 'admin', title: 'Admin', desc: 'Farm manager and controls', icon: ShieldCheck },
  { role: 'user', title: 'User', desc: 'View and monitor data', icon: UserRound },
];

const AuthPage = () => {
  const { signIn, signUp } = useAuth();
  const [role, setRole] = useState<UserRole>('user');
  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [signUpForm, setSignUpForm] = useState({ name: '', email: '', password: '' });

  const helperText = useMemo(
    () =>
      role === 'admin'
        ? 'Admin access controls settings and management tools.'
        : 'User access focuses on dashboard, reports, and monitoring.',
    [role],
  );

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const result = signIn({ ...signInForm, role });
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    const result = signUp({ ...signUpForm, role });
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 auth-grid-bg opacity-60" />
      <div className="pointer-events-none absolute -top-36 left-1/3 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-3xl animate-pulse" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 md:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6 animate-fade-in">
            <Badge variant="outline" className="gap-2 px-3 py-1 text-sm">
              <Leaf className="h-4 w-4 text-primary" />
              Gau-Rakshak Monitoring Suite
            </Badge>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Secure Access to Smart Cattle Monitoring
              </h1>
              <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
                Sign in as Admin or User to continue. Smooth role-based access, modern workflow, and live-ready UI.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {roleOptions.map(({ role: optionRole, title, desc, icon: Icon }) => (
                <button
                  key={optionRole}
                  type="button"
                  onClick={() => setRole(optionRole)}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-all duration-300',
                    role === optionRole
                      ? 'border-primary bg-primary/10 shadow-elevated'
                      : 'border-border bg-card/60 hover:border-primary/60 hover:bg-card',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('rounded-lg p-2', role === optionRole ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Card className="animate-fade-in border-border/70 bg-card/80 p-6 shadow-elevated backdrop-blur">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">{helperText}</p>
            </div>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      required
                      value={signInForm.email}
                      onChange={(e) => setSignInForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      required
                      value={signInForm.password}
                      onChange={(e) => setSignInForm((prev) => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2">
                    <LogIn className="h-4 w-4" />
                    Continue as {role === 'admin' ? 'Admin' : 'User'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      required
                      value={signUpForm.name}
                      onChange={(e) => setSignUpForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      required
                      value={signUpForm.email}
                      onChange={(e) => setSignUpForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      minLength={6}
                      required
                      value={signUpForm.password}
                      onChange={(e) => setSignUpForm((prev) => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2">
                    <UserPlus className="h-4 w-4" />
                    Create {role === 'admin' ? 'Admin' : 'User'} Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              Default admin: <span className="text-foreground">admin@gaurakshak.com</span> /{' '}
              <span className="text-foreground">Admin@123</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

