import Image from "next/image";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import LoginForm from "@/components/admin/LoginForm";

export default async function AdminLoginPage() {
  if (await isAuthed()) redirect("/admin/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/assets/logo-mark.png"
            alt="PregnaWell"
            width={56}
            height={56}
            className="h-14 w-14"
          />
          <h1 className="mt-6 font-display text-3xl text-[var(--brand-purple-deep)]">
            PregnaWell Admin
          </h1>
          <p className="mt-2 text-sm text-[var(--brand-muted)]">
            Sign in with the password to manage blog posts.
          </p>
        </div>

        <div className="mt-10 rounded-3xl bg-white p-8 ring-1 ring-[var(--brand-purple)]/10 shadow-[0_30px_80px_-30px_rgba(61,42,110,0.35)]">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-[var(--brand-muted)]">
          PregnaWell Inc. — restricted area
        </p>
      </div>
    </div>
  );
}
