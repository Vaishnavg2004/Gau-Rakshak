import { Bell, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserRole } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';

interface TopbarProps {
  userName: string;
  userEmail: string;
  role: UserRole;
  onLogout: () => void;
}

export const Topbar = ({ userName, userEmail, role, onLogout }: TopbarProps) => {
  return (
    <header className="fixed left-64 right-0 top-0 z-30 h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-full items-center justify-between px-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Cow Monitoring System</h2>
          <p className="text-sm text-muted-foreground">Real-time health tracking</p>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant={role === 'admin' ? 'default' : 'secondary'} className="uppercase tracking-wide">
            {role}
          </Badge>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive"></span>
          </Button>

          <div className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>

          <Button variant="outline" size="sm" className="gap-2" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};
