"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Wine, Home, Package, QrCode, Menu, X, ShoppingCart, LogIn, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabaseClient } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get session on mount and listen for changes
  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    router.push("/");
    router.refresh();
  };

  // Close mobile menu when clicking outside or on escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Close menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/lotes", label: "Lotes", icon: Package },
    { href: "/buy", label: "Comprar", icon: ShoppingCart },
  ];

  const ctaItem = { href: "/qr", label: "Escanear QR", icon: QrCode };

  return (
    <nav 
      className="sticky top-0 z-50 bg-white border-b border-gray-200" 
      role="navigation" 
      aria-label="Navegación principal"
    >
      <div ref={menuRef} className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-900 hover:text-black transition-colors flex-shrink-0"
            aria-label="Vinifica - Ir a inicio"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Wine className="w-6 h-6 flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span className="text-lg font-semibold whitespace-nowrap">Vinifica</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Navigation Links */}
            <ul className="flex items-center gap-6">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <li key={item.href} className="relative">
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 text-sm font-medium transition-colors",
                        isActive
                          ? "text-black font-semibold"
                          : "text-gray-700 hover:text-black"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                    {isActive && (
                      <span className="absolute -bottom-px left-0 right-0 h-[2px] bg-black" />
                    )}
                  </li>
                );
              })}
            </ul>

            {/* CTA Button */}
            <Link
              href={ctaItem.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === ctaItem.href
                  ? "bg-black text-white"
                  : "text-gray-700 hover:bg-black hover:text-white border border-gray-300 hover:border-black"
              )}
            >
              <ctaItem.icon className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
              <span>{ctaItem.label}</span>
            </Link>

            {/* Auth Buttons */}
            {!isLoading && (
              <>
                {session ? (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <User className="w-5 h-5" strokeWidth={1.5} />
                      <span>Dashboard</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut className="w-5 h-5" strokeWidth={1.5} />
                      <span>Salir</span>
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/auth/login"
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-black hover:text-white border border-gray-300 hover:border-black transition-colors"
                  >
                    <LogIn className="w-5 h-5" strokeWidth={1.5} />
                    <span>Iniciar Sesión</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-700 hover:text-black hover:bg-gray-100 rounded-md transition-colors touch-manipulation"
            aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMobileMenuOpen}
            type="button"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <ul className="flex flex-col py-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors touch-manipulation",
                        isActive
                          ? "text-black font-semibold bg-gray-50"
                          : "text-gray-700 hover:text-black hover:bg-gray-50"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
              {/* Mobile CTA */}
              <li className="mt-2 px-4">
                <Link
                  href={ctaItem.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors touch-manipulation",
                    pathname === ctaItem.href
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-black hover:text-white"
                  )}
                >
                  <ctaItem.icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  <span>{ctaItem.label}</span>
                </Link>
              </li>

              {/* Mobile Auth */}
              {!isLoading && (
                <>
                  {session ? (
                    <>
                      <li className="px-4">
                        <Link
                          href="/dashboard"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors touch-manipulation"
                        >
                          <User className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                          <span>Dashboard</span>
                        </Link>
                      </li>
                      <li className="px-4">
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors touch-manipulation"
                        >
                          <LogOut className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                          <span>Salir</span>
                        </button>
                      </li>
                    </>
                  ) : (
                    <li className="px-4">
                      <Link
                        href="/auth/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-black hover:text-white transition-colors touch-manipulation"
                      >
                        <LogIn className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                        <span>Iniciar Sesión</span>
                      </Link>
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
