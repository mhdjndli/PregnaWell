"use client";

import { useState, useTransition } from "react";
import { loginAction } from "@/app/admin/actions";

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await loginAction(fd);
          if (res && !res.ok) setError(res.error ?? "Login failed.");
        });
      }}
      className="flex flex-col gap-4"
    >
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-muted)]">
          Password
        </span>
        <input
          type="password"
          name="password"
          autoFocus
          required
          autoComplete="current-password"
          className="mt-2 w-full rounded-2xl border border-[var(--brand-purple)]/15 bg-white px-4 py-3 text-base text-[var(--brand-ink)] outline-none focus:border-[var(--brand-purple)] focus:ring-4 focus:ring-[var(--brand-purple)]/10"
        />
      </label>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary w-full justify-center disabled:opacity-60"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
