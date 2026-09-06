"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api/axios";
import { useAuthStore } from "@/lib/store/authStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { log } from "console";
import { auth, googleProvider, githubProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Endpoint proxy is http://localhost:8080/api/auth/login
      await api.post("/auth/login", { email, password });

      // Assume a successful login here. Wait, login API doesn't return user info atm.
      // We will need to get user info if we want it in Zustand, but the cookie is HTTPOnly.
      // Usually, we could fetch /api/users/me, but we don't have it yet.
      // For now, we will just set dummy state to authenticate because cookie is secured!
      login({ id: "unknown", username: email.split("@")[0], email });

      router.push("/");
    } catch (err: any) {
      console.log("isi error login-->", err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  const handleFirebaseLogin = async (provider: any) => {
    setIsLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      
      await api.post("/auth/firebase-login", { id_token: idToken });
      
      login({ id: "unknown", username: result.user.email?.split("@")[0] || "user", email: result.user.email || "" });
      
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError("Failed to sign in with provider. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-sm">
        <div className="mb-6 text-center">
          <Link href="/">
            <h1 className="font-serif text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity">Medium Clone</h1>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Button type="button" variant="outline" onClick={() => handleFirebaseLogin(githubProvider)} disabled={isLoading}>
            GitHub
          </Button>
          <Button type="button" variant="outline" onClick={() => handleFirebaseLogin(googleProvider)} disabled={isLoading}>
            Google
          </Button>
        </div>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Don&apos;t have an account? </span>
          <Link href="/register" className="font-medium text-primary hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
