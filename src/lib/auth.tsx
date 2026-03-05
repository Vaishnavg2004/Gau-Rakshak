import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type UserRole = 'admin' | 'user';

interface StoredUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

interface SessionUser {
  name: string;
  email: string;
  role: UserRole;
}

interface SignUpPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

interface SignInPayload {
  email: string;
  password: string;
  role: UserRole;
}

interface AuthContextValue {
  user: SessionUser | null;
  signUp: (payload: SignUpPayload) => { ok: boolean; message: string };
  signIn: (payload: SignInPayload) => { ok: boolean; message: string };
  signOut: () => void;
}

const USERS_KEY = 'gr_auth_users';
const SESSION_KEY = 'gr_auth_session';

const defaultAdmin: StoredUser = {
  name: 'Farm Admin',
  email: 'admin@gaurakshak.com',
  password: 'Admin@123',
  role: 'admin',
};

const AuthContext = createContext<AuthContextValue | null>(null);

const readUsers = (): StoredUser[] => {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    const seed = [defaultAdmin];
    localStorage.setItem(USERS_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    const parsed = JSON.parse(raw) as StoredUser[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(USERS_KEY, JSON.stringify([defaultAdmin]));
      return [defaultAdmin];
    }
    return parsed;
  } catch {
    localStorage.setItem(USERS_KEY, JSON.stringify([defaultAdmin]));
    return [defaultAdmin];
  }
};

const readSession = (): SessionUser | null => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SessionUser | null>(() => readSession());

  const signUp = ({ name, email, password, role }: SignUpPayload) => {
    const users = readUsers();
    const normalizedEmail = email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return { ok: false, message: 'Email already registered. Please sign in.' };
    }

    const created: StoredUser = {
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
    };
    const updated = [...users, created];
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));

    const session: SessionUser = { name: created.name, email: created.email, role: created.role };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    return { ok: true, message: 'Account created successfully.' };
  };

  const signIn = ({ email, password, role }: SignInPayload) => {
    const users = readUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!existing || existing.password !== password) {
      return { ok: false, message: 'Invalid email or password.' };
    }
    if (existing.role !== role) {
      return { ok: false, message: `This account is registered as ${existing.role}.` };
    }

    const session: SessionUser = { name: existing.name, email: existing.email, role: existing.role };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    return { ok: true, message: 'Welcome back.' };
  };

  const signOut = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(() => ({ user, signUp, signIn, signOut }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

