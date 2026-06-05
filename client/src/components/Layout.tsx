import { Link, useLocation } from "wouter";
import { Menu, X, Phone, Globe, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/education", label: "Education" },
  { href: "/policy-form", label: "Policy" },
  { href: "/strategy", label: "Strategy" },
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

  useEffect(() => { setMobileMenuOpen(false); }, [location]);

  const shareResource = async () => {
    const shareData = {
      title: "LTC Insurance Navigator — Free Resource",
      text: "SC Visiting Angels offers a completely free tool to help families navigate long-term care insurance claims.",
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
    <div className="min-h-screen flex flex-col" style={{ background: "#ffffff", color: "#333333" }}>

      {/* ── VA Top utility bar (teal) ── */}
      <div style={{ background: "#34B1C4" }} className="text-white text-sm">
        <div className="container flex justify-between items-center py-2">
          <span className="hidden sm:inline text-white/90 text-xs font-medium tracking-wide">
            Helping families navigate long-term care insurance — at no cost
          </span>
          <div className="flex items-center gap-5">
            <a
              href="tel:+18642446300"
              className="flex items-center gap-1.5 text-white/90 hover:text-white transition-colors duration-200 group"
            >
              <Phone className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
              <span className="hidden sm:inline font-medium">(864) 244-6300</span>
            </a>
            <a
              href="https://www.scvisitingangels.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-white/90 hover:text-white transition-colors duration-200 group"
            >
              <Globe className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
              <span className="hidden sm:inline font-medium">SCVisitingAngels.com</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Main navigation ── */}
      <header
        className={`sticky top-0 z-50 bg-white border-b transition-all duration-300 ${
          scrolled ? "nav-scrolled" : ""
        }`}
        style={{ borderColor: "#e0dede" }}
      >
        <div className="container flex items-center justify-between h-[70px]">
          {/* Logo */}
          <a
            href="https://www.scvisitingangels.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 no-underline group"
          >
            <img
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/NnImPmoCbXXIfDiW.png"
              alt="SC Visiting Angels"
              className="w-9 h-9 object-contain transition-transform duration-300 group-hover:scale-110"
            />
            <div className="flex flex-col leading-tight">
              <span
                className="font-bold text-base tracking-tight transition-colors duration-200 group-hover:text-[#34B1C4]"
                style={{ fontFamily: "'Roboto', sans-serif", color: "#454545" }}
              >
                SC Visiting Angels
              </span>
              <span
                className="text-[10px] tracking-widest uppercase"
                style={{ color: "#34B1C4", fontFamily: "'Open Sans', sans-serif" }}
              >
                LTC Insurance Navigator
              </span>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0">
            {navLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3.5 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200 no-underline nav-link-animated ${
                    isActive
                      ? "active"
                      : ""
                  }`}
                  style={{
                    fontFamily: "'Roboto', sans-serif",
                    color: isActive ? "#34B1C4" : "#454545",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
            <a
              href="/education"
              className="ml-4 va-btn text-sm"
              style={{ paddingTop: "0.6rem", paddingBottom: "0.6rem", paddingLeft: "1.25rem", paddingRight: "1.25rem" }}
            >
              Start Here — Free
            </a>
          </nav>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded transition-all duration-200"
            style={{ color: "#454545" }}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            <div className="relative w-5 h-5">
              <X className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${mobileMenuOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90"}`} />
              <Menu className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${mobileMenuOpen ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"}`} />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden bg-white overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
          style={{ borderTop: "1px solid #e0dede" }}
        >
          <nav className="flex flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 no-underline flex items-center justify-between"
                style={{
                  fontFamily: "'Roboto', sans-serif",
                  color: location === link.href ? "#34B1C4" : "#454545",
                  background: location === link.href ? "rgba(52,177,196,0.06)" : "transparent",
                  borderBottom: "1px solid #e0dede",
                }}
              >
                <span>{link.label}</span>
                {location === link.href && (
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#34B1C4" }} />
                )}
              </Link>
            ))}
            <div className="p-4">
              <a href="/education" className="va-btn w-full text-center block text-sm">
                Start Here — Free
              </a>
            </div>
          </nav>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer (VA charcoal #393F43) ── */}
      <footer style={{ background: "#393F43", color: "#ffffff" }} className="py-14">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">

            {/* Brand column */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <img
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/NnImPmoCbXXIfDiW.png"
                  alt="SC Visiting Angels"
                  className="w-8 h-8 object-contain"
                />
                <span
                  className="font-bold text-base text-white"
                  style={{ fontFamily: "'Roboto', sans-serif" }}
                >
                  SC Visiting Angels
                </span>
              </div>
              <p
                className="text-sm leading-relaxed mb-4"
                style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'Open Sans', sans-serif" }}
              >
                Helping families navigate long-term care insurance with confidence and clarity.
              </p>
              <a
                href="https://www.scvisitingangels.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm transition-colors duration-200 inline-flex items-center gap-1 group"
                style={{ color: "#34B1C4" }}
              >
                www.scvisitingangels.com
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs">↗</span>
              </a>
            </div>

            {/* Quick Links */}
            <div>
              <h4
                className="font-bold text-sm uppercase tracking-widest mb-5"
                style={{ fontFamily: "'Roboto', sans-serif", color: "#34B1C4" }}
              >
                Quick Links
              </h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { href: "/", label: "Home" },
                  { href: "/education", label: "Education" },
                  { href: "/policy-form", label: "Policy" },
                  { href: "/strategy", label: "Strategy" },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="transition-colors duration-200 no-underline inline-flex items-center gap-2 group"
                      style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'Open Sans', sans-serif" }}
                    >
                      <span
                        className="text-xs group-hover:text-[#34B1C4] transition-colors duration-200"
                        style={{ color: "#34B1C4" }}
                      >✔</span>
                      <span className="group-hover:text-white transition-colors duration-200">{label}</span>
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    className="flex items-center gap-2 text-sm transition-colors duration-200 group"
                    style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'Open Sans', sans-serif" }}
                    onClick={shareResource}
                  >
                    <Share2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" style={{ color: "#34B1C4" }} />
                    <span className="group-hover:text-white transition-colors duration-200">Share This Resource</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4
                className="font-bold text-sm uppercase tracking-widest mb-5"
                style={{ fontFamily: "'Roboto', sans-serif", color: "#34B1C4" }}
              >
                Resources
              </h4>
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
                        className="transition-colors duration-200 inline-flex items-center gap-2 group"
                        style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'Open Sans', sans-serif" }}
                      >
                        <span style={{ color: "#34B1C4" }} className="text-xs">✔</span>
                        <span className="group-hover:text-white transition-colors duration-200">{label}</span>
                      </a>
                    ) : (
                      <Link
                        href={href}
                        className="transition-colors duration-200 no-underline inline-flex items-center gap-2 group"
                        style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'Open Sans', sans-serif" }}
                      >
                        <span style={{ color: "#34B1C4" }} className="text-xs">✔</span>
                        <span className="group-hover:text-white transition-colors duration-200">{label}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4
                className="font-bold text-sm uppercase tracking-widest mb-5"
                style={{ fontFamily: "'Roboto', sans-serif", color: "#34B1C4" }}
              >
                Contact
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="tel:+18642446300"
                    className="flex items-center gap-2 transition-colors duration-200 group"
                    style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'Open Sans', sans-serif" }}
                  >
                    <Phone className="w-3.5 h-3.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" style={{ color: "#34B1C4" }} />
                    <span className="group-hover:text-white transition-colors duration-200">(864) 244-6300</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.scvisitingangels.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 transition-colors duration-200 group"
                    style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'Open Sans', sans-serif" }}
                  >
                    <Globe className="w-3.5 h-3.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" style={{ color: "#34B1C4" }} />
                    <span className="group-hover:text-white transition-colors duration-200">scvisitingangels.com</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="pt-8 text-center text-sm"
            style={{ borderTop: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.45)" }}
          >
            <div className="flex justify-center mb-3">
              <img
                src="/manus-storage/Dove-Trans_4328daa6.gif"
                alt="SC Visiting Angels dove"
                className="w-12 h-12 object-contain"
              />
            </div>
            <p style={{ fontFamily: "'Open Sans', sans-serif" }}>
              &copy; {new Date().getFullYear()} SC Visiting Angels. All rights reserved.
              &nbsp;·&nbsp;
              <Link href="/privacy" className="hover:text-[#34B1C4] transition-colors duration-200">Privacy Policy</Link>
              &nbsp;·&nbsp;
              <a
                href="https://www.visitingangels.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#34B1C4] transition-colors duration-200"
              >
                www.visitingangels.com
              </a>
              &nbsp;·&nbsp;
              <a
                href="https://www.scvisitingangels.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#34B1C4] transition-colors duration-200"
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
