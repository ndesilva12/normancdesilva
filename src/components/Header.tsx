"use client";

import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass sticky top-0 z-50 border-x-0 border-t-0"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10">
            <Layers className="h-5 w-5 text-accent" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Eve<span className="text-accent">Tools</span>
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <span className="hidden text-sm text-foreground-muted sm:block">
            by Norman C. de Silva
          </span>
        </nav>
      </div>
    </motion.header>
  );
}
