import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";
// import { ChatWidget } from "./ChatWidget"; // Temporarily disabled

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
      <div className="bg-gradient-to-r from-[#1a3a4a] to-[#2c3e50] text-white text-sm">
        <div className="container flex justify-between items-center py-2">
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline opacity-80">Helping families navigate long-term care insurance</span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/NnImPmoCbXXIfDiW.png" alt="Visiting Angels" className="w-8 h-8 object-contain" />
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
                    ? "text-teal bg-teal/5"
                    : "text-muted-foreground hover:text-teal hover:bg-teal/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Button asChild size="sm" className="ml-2 bg-teal hover:bg-teal-dark text-white">
              <Link href="/policy-form">Get Started</Link>
            </Button>
          </nav>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-slate-100 rounded-md transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-white">
            <nav className="flex flex-col">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 text-sm font-medium transition-colors no-underline border-b border-border ${
                    location === link.href
                      ? "text-teal bg-teal/5"
                      : "text-muted-foreground hover:text-teal hover:bg-teal/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="p-4">
                <Button asChild className="w-full bg-teal hover:bg-teal-dark text-white">
                  <Link href="/policy-form">Get Started</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/NnImPmoCbXXIfDiW.png" alt="Visiting Angels" className="w-6 h-6 object-contain" />
                Visiting Angels
              </h3>
              <p className="text-slate-400 text-sm">Helping families navigate long-term care insurance with confidence and clarity.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="text-slate-400 hover:text-teal transition-colors no-underline">Home</Link></li>
                <li><Link href="/education" className="text-slate-400 hover:text-teal transition-colors no-underline">Education</Link></li>
                <li><Link href="/policy-form" className="text-slate-400 hover:text-teal transition-colors no-underline">Policy Form</Link></li>
                <li><Link href="/strategy" className="text-slate-400 hover:text-teal transition-colors no-underline">Strategy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/contact" className="text-slate-400 hover:text-teal transition-colors no-underline">Contact Us</Link></li>
                <li><a href="#" className="text-slate-400 hover:text-teal transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-400 hover:text-teal transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <p className="text-slate-400 text-sm mb-2">Have questions?</p>
              <p className="text-slate-400 text-sm">Contact us anytime through our support page.</p>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Visiting Angels. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* <ChatWidget /> */}
    </div>
  );
}
