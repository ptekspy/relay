"use client";

import { type FormEvent, useState } from "react";
import { signIn } from "../client";
import { SocialButtons } from "../components/social-buttons";
import { AuthLayout } from "./auth-layout";

export interface SignInPageProps {
  defaultRedirect?: string;
  productName?: string;
  signUpUrl?: string;
}

export function SignInPage({
  defaultRedirect = "/",
  productName = "Paddy Systems",
  signUpUrl = "/register",
}: SignInPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await signIn.email({
        email,
        password,
        callbackURL: defaultRedirect,
      });

      if (res.error) {
        setError(res.error.message || "Failed to sign in with email.");
        setLoading(false);
        return;
      }

      window.location.href = defaultRedirect;
    } catch (err) {
      console.error("Sign in error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign In"
      subtitle={`Authenticate to access your ${productName} workspace.`}
      productName={productName}
    >
      <div className="space-y-6">
        <SocialButtons callbackURL={defaultRedirect} />

        <div className="relative flex items-center justify-center">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-neutral-950 px-3 text-[10px] uppercase font-mono text-neutral-500 tracking-wider">
            Or with credentials
          </span>
          <div className="border-t border-white/10 w-full" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs font-mono text-red-500 bg-red-500/10 border border-red-500/20">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-[11px] uppercase font-mono text-neutral-400 tracking-wider"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-black border border-white/15 px-3 py-2 text-sm font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-[11px] uppercase font-mono text-neutral-400 tracking-wider"
              >
                Password
              </label>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-black border border-white/15 px-3 py-2 text-sm font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-white text-black text-xs font-mono uppercase tracking-wider font-bold hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div className="pt-2 text-center text-xs font-mono text-neutral-400">
          Don&apos;t have an account?{" "}
          <a
            href={signUpUrl}
            className="text-white underline hover:opacity-80 transition-opacity font-bold ml-1"
          >
            Create account &rarr;
          </a>
        </div>
      </div>
    </AuthLayout>
  );
}
