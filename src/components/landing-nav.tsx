"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Search, ChevronDown, User, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navLinks = [
  { href: "/search", label: "Find Office", hasDropdown: true },
  { href: "/search", label: "List your space" },
  { href: "#", label: "Enterprise" },
  { href: "#", label: "Resources" },
];

export function LandingNav() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full px-4 pt-3 lg:px-6">
      <div className="mx-auto max-w-5xl rounded-2xl border border-gray-200/60 bg-white/80 px-5 shadow-lg shadow-black/[0.04] backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-gray-900"
          >
            BALAMPROPS
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                {link.label}
                {link.hasDropdown && (
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                )}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <div className="mx-1 h-5 w-px bg-gray-200" />
            {session?.user ? (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                <User className="h-4 w-4" />
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-lg bg-[#4f46e5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4338ca]"
              >
                <User className="h-4 w-4" />
                Log In
              </Link>
            )}
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="mx-auto mt-2 max-w-5xl overflow-hidden rounded-2xl border border-gray-200/60 bg-white/95 shadow-lg shadow-black/[0.04] backdrop-blur-xl md:hidden">
          <nav className="flex flex-col p-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-gray-100 p-3">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#4f46e5] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4338ca]"
            >
              <User className="h-4 w-4" />
              Log In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
