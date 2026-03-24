"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "#results", label: "Sobre" },
  { href: "#features", label: "Funcionalidades" },
  { href: "#demo", label: "Demo" },
  { href: "#analytics", label: "Analytics" },
  { href: "#integrations", label: "Integrações" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 w-full glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
            <span className="text-sm font-bold text-white">W</span>
          </div>
          <span className="text-xl font-bold text-gray-900">WppAgent</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            Login
          </Link>
          <a
            href="https://wa.me/5511999999999?text=Oi!%20Quero%20saber%20mais%20sobre%20o%20WppAgent"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-gradient-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Fale com vendas
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block py-2 text-sm font-medium text-gray-600"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-600"
            >
              Login
            </Link>
            <a
              href="https://wa.me/5511999999999?text=Oi!%20Quero%20saber%20mais%20sobre%20o%20WppAgent"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-gradient-primary px-4 py-2 text-center text-sm font-medium text-white"
            >
              Fale com vendas
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
