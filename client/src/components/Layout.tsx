import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Menu, X, Phone, Globe, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/education", label: "Education" },
  { href: "/policy-form", label: "Policy Form" },
  { href: "/strategy", label: "My Strategy" },
  { href: "/contact", label: "Contact" },
  { href: "/profile", label: "Profile" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location]);

  const shareResource = async () => {
    const shareData = {
      title: "LTC Insurance Navigator — Free Resource",
      text: "SC Visiting Angels offers a completely free tool to help families navigate long-term care insurance claims. No cost, no signup required.",
      url: window.location.origin,
    };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try { await navigator.share(shareData); } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.origin);
      toast.success("Link copied!", { description: "Share it with family members who need help with LTC insurance." });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* ── Top bar ── */}
      <div className="bg-gradient-to-r from-[#1a3a4a] to-[#2c3e50] text-white text-sm">
        <div className="container flex justify-between items-center py-2">
          <span className="hidden sm:inline opacity-80 text-xs">Helping families navigate long-term care insurance</span>
          <div className="flex items-center gap-4">
            <a
              href="tel:+18642446300"
              className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors duration-200 group"
            >
              <Phone className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
              <span className="hidden sm:inline">(864) 244-6300</span>
            </a>
            <a
              href="https://www.scvisitingangels.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors duration-200 group"
            >
              <Globe className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
              <span className="hidden sm:inline">SCVisitingAngels.com</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Main navigation ── */}
      <header
        className={`sticky top-0 z-50 bg-white border-b border-border transition-all duration-300 ${
          scrolled ? "nav-scrolled" : "shadow-sm"
        }`}
      >
        <div className="container flex items-center justify-between h-16">
          {/* Logo */}
          <a
            href="https://www.scvisitingangels.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 no-underline group"
          >
            <img
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/NnImPmoCbXXIfDiW.png"
              alt="SC Visiting Angels"
              className="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-110"
            />
            <span className="font-serif text-xl font-bold text-foreground tracking-tight group-hover:text-teal transition-colors duration-300">
              SC Visiting Angels
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 no-underline rounded-md nav-link-animated ${
                    isActive
                      ? "text-teal bg-teal/5 active"
                      : "text-muted-foreground hover:text-teal hover:bg-teal/5"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-teal rounded-full" />
                  )}
                </Link>
              );
            })}
            <Button
              asChild
              size="sm"
              className="ml-3 bg-teal hover:bg-teal-dark text-white shadow-sm hover:shadow-md hover:shadow-teal/20 transition-all duration-300 hover:-translate-y-0.5"
            >
              <Link href="/education">Start Here — Free</Link>
            </Button>
          </nav>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-slate-100 rounded-md transition-all duration-200 hover:scale-105"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            <div className="relative w-5 h-5">
              <X
                className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
                  mobileMenuOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
                }`}
              />
              <Menu
                className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
                  mobileMenuOpen ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"
                }`}
              />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden border-t border-border bg-white overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="flex flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-5 py-3.5 text-sm font-medium transition-all duration-200 no-underline border-b border-border/50 flex items-center justify-between group ${
                  location === link.href
                    ? "text-teal bg-teal/5"
                    : "text-muted-foreground hover:text-teal hover:bg-teal/5"
                }`}
              >
                <span>{link.label}</span>
                {location === link.href && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal" />
                )}
              </Link>
            ))}
            <div className="p-4">
              <Button asChild className="w-full bg-teal hover:bg-teal-dark text-white transition-all duration-300">
                <Link href="/education">Start Here — Free</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <img
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/NnImPmoCbXXIfDiW.png"
                  alt="SC Visiting Angels"
                  className="w-6 h-6 object-contain"
                />
                SC Visiting Angels
              </h3>
              <p className="text-slate-400 text-sm mb-3 leading-relaxed">
                Helping families navigate long-term care insurance with confidence and clarity.
              </p>
              <a
                href="https://www.scvisitingangels.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal hover:text-teal-light text-sm transition-colors duration-200 inline-flex items-center gap-1 group"
              >
                www.scvisitingangels.com
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs">↗</span>
              </a>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { href: "/", label: "Home" },
                  { href: "/education", label: "Education" },
                  { href: "/policy-form", label: "Policy Form" },
                  { href: "/strategy", label: "Strategy" },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-slate-400 hover:text-teal transition-colors duration-200 no-underline inline-flex items-center gap-1.5 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-teal transition-colors duration-200" />
                      {label}
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    className="flex items-center gap-1.5 text-slate-400 hover:text-teal transition-colors duration-200 text-sm group"
                    onClick={shareResource}
                  >
                    <Share2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
                    Share This Resource
                  </button>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Resources</h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { href: "/contact", label: "Contact Us", external: false },
                  { href: "https://www.scvisitingangels.com", label: "SC Visiting Angels Website", external: true },
                  { href: "/education", label: "LTC Education", external: false },
                  { href: "/privacy", label: "Privacy Policy", external: false },
                ].map(({ href, label, external }) => (
                  <li key={href}>
                    {external ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-teal transition-colors duration-200 inline-flex items-center gap-1.5 group"
                      >
                        <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-teal transition-colors duration-200" />
                        {label}
                      </a>
                    ) : (
                      <Link
                        href={href}
                        className="text-slate-400 hover:text-teal transition-colors duration-200 no-underline inline-flex items-center gap-1.5 group"
                      >
                        <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-teal transition-colors duration-200" />
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Contact</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li>
                  <a
                    href="tel:+18642446300"
                    className="flex items-center gap-2 hover:text-teal transition-colors duration-200 group"
                  >
                    <Phone className="w-3.5 h-3.5 text-teal flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                    (864) 244-6300
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.scvisitingangels.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-teal transition-colors duration-200 group"
                  >
                    <Globe className="w-3.5 h-3.5 text-teal flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                    scvisitingangels.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-700/60 pt-8 text-center text-slate-500 text-sm">
            <p>
              &copy; {new Date().getFullYear()} SC Visiting Angels. All rights reserved.
              &nbsp;·&nbsp;
              <Link href="/privacy" className="hover:text-teal transition-colors duration-200">Privacy Policy</Link>
              &nbsp;·&nbsp;
              <a
                href="https://www.scvisitingangels.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-teal transition-colors duration-200"
              >
                www.scvisitingangels.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
