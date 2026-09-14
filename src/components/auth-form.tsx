"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Image from "next/image";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Email links use the implicit flow: the session arrives in the URL hash
  // (#access_token=...), which never reaches the server. detectSessionInUrl
  // picks it up and persistSession writes the cookie-backed storage the
  // server components and proxy read.
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.replace("/");
        router.refresh();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    // Shared client persists the session to cookies so the server side
    // (proxy, server components, server actions) can see it.
    const supabase = getSupabaseBrowserClient();
    // The onAuthStateChange listener (or router.push below) triggers a
    // navigation; don't reset loading on unmount.
    let navigated = false;
    const navigate = () => {
      if (navigated) return;
      navigated = true;
      // Deliberately leave `loading` true: the button must stay disabled
      // with its spinner until the router actually swaps the page.
      router.push("/");
      router.refresh();
    };

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Route the confirmation link back through the app callback,
          // same handler the OAuth flow uses.
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
      } else if (data.session) {
        // Email confirmation disabled: the user is signed in immediately.
        navigate();
      } else {
        setMessage("Check your email for a confirmation link, then sign in.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        navigate();
      }
    }
    // Only reset when we truly stayed on the page (error or "check your
    // email" message); on success the navigation keeps the spinner up.
    if (!navigated) setLoading(false);
  }

  async function handleOAuth(provider: "google") {
    setError(null);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6">
      <div className="mb-8 flex justify-center gap-2 text-2xl">
        <span className="font-(family-name:--font-bungee-shade) flex items-center gap-2 max-w-fit">
          <Image
            src="/favicon.svg"
            alt=""
            width={50}
            height={50}
            unoptimized
            className="rounded"
          />
          TRANSPOSER
        </span>
      </div>

      <h1 className="mb-6 text-xl font-semibold">
        {mode === "login" ? "Sign in" : "Create an account"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 pr-10 text-sm dark:border-zinc-700"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {message && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading && (
            <LoaderCircle size={16} className="animate-spin" aria-hidden />
          )}
          {loading ? "Working…" : mode === "login" ? "Sign in" : "Sign up"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-zinc-500">
        <span className="h-px flex-1 bg-zinc-300 dark:bg-zinc-700" />
        or
        <span className="h-px flex-1 bg-zinc-300 dark:bg-zinc-700" />
      </div>

      {/* Google OAuth — enable the provider in the Supabase dashboard
          (Authentication → Providers → Google) and this button works. */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          className="w-full rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Continue with Google
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link href="/signup" className="font-medium underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already registered?{" "}
            <Link href="/login" className="font-medium underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
