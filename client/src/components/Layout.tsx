import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Menu, X, Shield } from "lucide-react";
import { useState } from "react";
import { ChatWidget } from "./ChatWidget";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/education", label: "Education" },
  { href: "/policy-form", label: "Policy Form" },
  { href: "/strategy", label: "My Strategy" },
  { href: "/contact", label: "Contact" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top bar */}
      <div className="bg-[#2c3e50] text-white text-sm">
        <div className="container flex justify-between items-center py-2">
          <div className="flex items-center gap-4">
            <span className="opacity-80">Helping families navigate long-term care insurance</span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <Shield className="w-8 h-8 text-primary" />
            <span className="font-serif text-xl font-bold text-foreground tracking-tight">LTC Navigator</span>
          </Link>
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium transition-colors no-underline rounded-md ${
                  location === link.href
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-white">
            <nav className="container py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 text-sm font-medium rounded-md no-underline ${
                    location === link.href
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#2c3e50] text-white">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <span className="font-serif text-lg font-bold">LTC Navigator</span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                Helping families navigate the complexities of long-term care insurance claims with expert guidance and personalized strategies.
              </p>
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm uppercase tracking-wider mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/70 hover:text-white transition-colors no-underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm uppercase tracking-wider mb-4">Support</h4>
              <p className="text-sm text-white/70 leading-relaxed">
                Have questions? Use our live chat widget or reach out through the portal. We are here to help you every step of the way.
              </p>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-sm text-white/50">&copy; {new Date().getFullYear()} LTC Navigator. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}
