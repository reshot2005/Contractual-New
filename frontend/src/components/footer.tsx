import Link from "next/link"
import { Twitter, Linkedin, Instagram, Github } from "lucide-react"

const footerLinks = {
  forBusinesses: {
    title: "For Businesses",
    links: [
      { label: "Post a Gig", href: "/business/post-gig" },
      { label: "Browse Talent", href: "/browse" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "", href: "/pricing" },
    ],
  },
  forFreelancers: {
    title: "For Freelancers",
    links: [
      { label: "Find Gigs", href: "/browse" },
      { label: "Create Profile", href: "/auth/register" },
      { label: "", href: "/success-stories" },
      { label: "Resources", href: "/resources" },
    ],
  },
  platform: {
    title: "Platform",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Partner Program", href: "/partners" },
    ],
  },
  support: {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Contact Us", href: "/contact" },
      { label: "Dispute Resolution", href: "/disputes" },
      { label: "Trust & Safety", href: "/trust-safety" },
    ],
  },
}

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Github, href: "https://github.com", label: "GitHub" },
]

export function Footer() {
  return (
    <footer className="bg-[var(--dark-surface)] text-white/75">
      <div className="container-page py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="flex shrink-0 items-center gap-2.5 group mb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--gradient-primary)] shadow-[0_0_20px_rgba(109,156,159,0.25)] transition-transform group-hover:scale-105 group-hover:rotate-3">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </span>
              <span className="text-xl font-bold tracking-tight text-white font-display">Contractual</span>
            </Link>
            <p className="text-sm text-white/60 mb-6 max-w-[200px]">
              Structured work. Trusted outcomes.
            </p>
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all duration-200"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-white mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-page py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/40">
              &copy; 2025 Contractual. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-white/40">
              <Link href="/privacy" className="hover:text-white/60 transition-colors">
                Privacy Policy
              </Link>
              <span>·</span>
              <Link href="/terms" className="hover:text-white/60 transition-colors">
                Terms of Service
              </Link>
              <span>·</span>
              <button className="hover:text-white/60 transition-colors">
                Cookie Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
