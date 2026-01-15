"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass sticky top-0 z-50 w-full border-x-0 border-t-0"
    >
      <div
        className="flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8"
        style={{ margin: "0 auto" }}
      >
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
            <LayoutDashboard className="h-5 w-5 text-accent" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            The <span className="text-accent">Dashboard</span>
          </span>
        </Link>

        {loading ? (
          <div className="h-9 w-24 animate-pulse rounded-lg bg-white/5" />
        ) : user ? (
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              {user.photoURL && (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <span className="text-sm text-foreground-muted">
                {user.displayName?.split(" ")[0]}
              </span>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-white/10 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="flex items-center gap-2 rounded-lg bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}
      </div>
    </motion.header>
  );
}
