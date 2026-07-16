"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Role } from "@/types";

export interface Session {
  role: Role;
  name: string;
  email: string;
  guest?: boolean;
}

interface StoredUser {
  name: string;
  email: string;
  role: Role;
  pass: string; // lightly hashed — demo only
}

interface AuthContextValue {
  session: Session | null;
  ready: boolean;
  signIn: (email: string, password: string, role: Role) => Promise<Session>;
  register: (name: string, email: string, password: string, role: Role) => Promise<Session>;
  guestLogin: (role: Role) => Session;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = "toursafe.auth.v1";
const USERS_KEY = "toursafe.users.v1";

// NOTE: This is a local, offline demo auth for the hackathon. Credentials never
// leave the browser. For production, swap this for Supabase Auth (the client is
// already wired up in src/lib/supabase.ts).
function hash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

function loadUsers(): Record<string, StoredUser> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, StoredUser>) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function keyFor(role: Role, email: string) {
  return `${role}:${email.trim().toLowerCase()}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      // Per-tab session (sessionStorage) is authoritative so a Tourist tab and a
      // Police tab can be open in the same browser at once (required for the
      // BroadcastChannel realtime demo) without clobbering each other. Fall back
      // to the persisted localStorage session for a fresh tab, and adopt it.
      const raw =
        window.sessionStorage.getItem(SESSION_KEY) ?? window.localStorage.getItem(SESSION_KEY);
      if (raw) {
        setSession(JSON.parse(raw) as Session);
        window.sessionStorage.setItem(SESSION_KEY, raw);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: Session | null) => {
    setSession(next);
    if (next) {
      const raw = JSON.stringify(next);
      window.sessionStorage.setItem(SESSION_KEY, raw);
      window.localStorage.setItem(SESSION_KEY, raw);
    } else {
      window.sessionStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const signIn = useCallback<AuthContextValue["signIn"]>(async (email, password, role) => {
    const users = loadUsers();
    const user = users[keyFor(role, email)];
    if (!user || user.pass !== hash(password)) {
      throw new Error("Invalid email or password for this role.");
    }
    const next: Session = { role, name: user.name, email: user.email };
    persist(next);
    return next;
  }, [persist]);

  const register = useCallback<AuthContextValue["register"]>(
    async (name, email, password, role) => {
      const users = loadUsers();
      const key = keyFor(role, email);
      if (users[key]) {
        throw new Error("An account with this email already exists for this role.");
      }
      users[key] = { name: name.trim(), email: email.trim(), role, pass: hash(password) };
      saveUsers(users);
      const next: Session = { role, name: name.trim(), email: email.trim() };
      persist(next);
      return next;
    },
    [persist],
  );

  const guestLogin = useCallback<AuthContextValue["guestLogin"]>(
    (role) => {
      const next: Session = {
        role,
        name: role === "police" ? "Duty Officer" : "Guest Traveler",
        email: role === "police" ? "officer@toursafe.app" : "guest@toursafe.app",
        guest: true,
      };
      persist(next);
      return next;
    },
    [persist],
  );

  const signOut = useCallback(() => persist(null), [persist]);

  const value = useMemo<AuthContextValue>(
    () => ({ session, ready, signIn, register, guestLogin, signOut }),
    [session, ready, signIn, register, guestLogin, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
