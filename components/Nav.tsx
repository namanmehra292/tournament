import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GhostButton, PrimaryButton } from "./Glass";

export default async function Nav() {
  const session = await getServerSession(authOptions);

  return (
    <header className="sticky top-0 z-50 px-4 sm:px-8 py-4">
      <div className="glass-panel max-w-6xl mx-auto flex items-center justify-between px-5 py-3">
        <Link href="/" className="font-bold text-lg tracking-tight">
          🏸 Smash Open
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-white/80">
          <Link href="/tournament" className="hover:text-white transition-colors">
            Categories
          </Link>
          {session && (
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {session ? (
            <Link href="/dashboard">
              <GhostButton>My Account</GhostButton>
            </Link>
          ) : (
            <Link href="/login">
              <GhostButton>Sign In</GhostButton>
            </Link>
          )}
          <Link href="/register">
            <PrimaryButton>Register Now</PrimaryButton>
          </Link>
        </div>
      </div>
    </header>
  );
}
