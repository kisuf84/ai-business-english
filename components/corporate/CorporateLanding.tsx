"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import "./corporateLanding.css";

// Faithful port of the client's prototype landing page
// (_PLATFORM PROTOTYPE/langslate/index.html + assets/js/landing.js, shared.js).
// Markup, copy and behavior follow the original; only catalog-derived numbers
// and prototype-only link targets (app.html) are wired to the real app.

export type CorporateLandingTab = {
  key: string;
  label: string;
  categoryCount: number;
  href: string;
  cards: { slug: string; name: string; count: number; href: string; thumbnailSrc: string }[];
};

export type CorporateLandingProps = {
  totalLessons: number;
  totalLessonsRounded: number;
  totalCategories: number;
  professionCount: number;
  tabs: CorporateLandingTab[];
};

const ROUTES = {
  landing: "/apps/corporate",
  dashboard: "/dashboard",
  pricing: "/pricing",
  explore: "/apps/corporate/professions",
};

export default function CorporateLanding({
  totalLessons,
  totalLessonsRounded,
  totalCategories,
  professionCount,
  tabs,
}: CorporateLandingProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(tabs[0]?.key ?? "");
  const [yearly, setYearly] = useState(false);
  const roundedLabel = `${totalLessonsRounded.toLocaleString("en-US")}+`;
  const currentTab = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];

  // initNavScroll
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // initRevealOnScroll + initStatCounters
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("lc-is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    root.querySelectorAll(".lc-reveal:not(.lc-is-visible)").forEach((el) => revealObserver.observe(el));

    const frames = new Set<number>();
    const animate = (el: HTMLElement) => {
      const target = parseInt(el.dataset.count ?? "0", 10);
      const suffix = el.dataset.suffix || "";
      const duration = 1400;
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased).toLocaleString("en-US") + suffix;
        if (progress < 1) frames.add(requestAnimationFrame(step));
      };
      frames.add(requestAnimationFrame(step));
    };
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target as HTMLElement);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    root.querySelectorAll(".lc-hero-stat .lc-num").forEach((el) => counterObserver.observe(el));

    return () => {
      revealObserver.disconnect();
      counterObserver.disconnect();
      frames.forEach((id) => cancelAnimationFrame(id));
    };
  }, []);

  return (
    <div ref={rootRef} className="lc-root">
      <nav className={`lc-nav${navScrolled ? " lc-scrolled" : ""}`} id="nav">
        <div className="lc-nav-inner">
          <Link href={ROUTES.landing} className="lc-brand">
            <span className="lc-brand-mark">L</span> Langslate{" "}
            <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: 2 }}>Corporate</span>
          </Link>
          <div className="lc-nav-links">
            <a href="#solutions">Solutions</a>
            <a href="#professions">Professions</a>
            <a href="#pricing">Pricing</a>
            <a href="#testimonials">Reviews</a>
            <Link href={ROUTES.dashboard}>Dashboard preview</Link>
          </div>
          <div className="lc-nav-actions">
            <Link href={ROUTES.dashboard} className="lc-btn lc-btn-ghost lc-btn-sm lc-back-apps">
              <span className="lc-back-apps-icon" aria-hidden="true">←</span>
              <span>Back to Langslate</span>
            </Link>
            <Link href={ROUTES.dashboard} className="lc-btn lc-btn-ghost lc-btn-sm lc-login-link">
              Log in
            </Link>
            <Link href={ROUTES.pricing} className="lc-btn lc-btn-primary lc-btn-sm">
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      <header className="lc-hero">
        <div className="lc-hero-grid"></div>
        <div className="lc-container lc-hero-inner">
          <div className="lc-hero-badge lc-fade-up">
            <span className="lc-dot"></span> Now live — {totalLessons.toLocaleString("en-US")}+ embedded lessons across{" "}
            {totalCategories} categories
          </div>
          <h1 className="lc-display-1 lc-fade-up" style={{ animationDelay: ".05s" }}>
            Business English,
            <br />
            <em>engineered</em> for your career.
          </h1>
          <p className="lc-lede lc-fade-up" style={{ animationDelay: ".12s" }}>
            Langslate Corporate is the premium learning platform built for professionals — organized by your
            profession, your industry, your department, or our elite Langslate Pro programs. No generic courses. No
            wasted time.
          </p>
          <div className="lc-hero-cta lc-fade-up" style={{ animationDelay: ".18s" }}>
            <Link href={ROUTES.explore} className="lc-btn lc-btn-primary lc-btn-lg">
              Explore the platform →
            </Link>
            <a href="#solutions" className="lc-btn lc-btn-secondary lc-btn-lg">
              See how it works
            </a>
          </div>
          <div className="lc-hero-stats lc-fade-up" style={{ animationDelay: ".24s" }}>
            <div className="lc-hero-stat">
              <div className="lc-num" data-count={totalLessons}>
                0
              </div>
              <div className="lc-label">Learning modules</div>
            </div>
            <div className="lc-hero-stat">
              <div className="lc-num" data-count={totalCategories}>
                0
              </div>
              <div className="lc-label">Categories covered</div>
            </div>
            <div className="lc-hero-stat">
              <div className="lc-num" data-count={professionCount}>
                0
              </div>
              <div className="lc-label">Professions</div>
            </div>
            <div className="lc-hero-stat">
              <div className="lc-num" data-count={98} data-suffix="%">
                0
              </div>
              <div className="lc-label">Learner satisfaction</div>
            </div>
          </div>
        </div>

        <div className="lc-container">
          <div className="lc-hero-preview lc-reveal">
            <div className="lc-preview-chrome">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="lc-preview-body">
              <div className="lc-preview-side">
                <div className="lc-p-item lc-active">◆ Dashboard</div>
                <div className="lc-p-item">◇ Professions</div>
                <div className="lc-p-item">◇ Industries</div>
                <div className="lc-p-item">◇ Departments</div>
                <div className="lc-p-item">◇ Langslate Pro</div>
                <div className="lc-p-item">◇ Bookmarks</div>
              </div>
              <div className="lc-preview-main">
                {[
                  "linear-gradient(120deg,#2f7bff,#1d3fe0)",
                  "linear-gradient(120deg,#10b981,#059669)",
                  "linear-gradient(120deg,#7fb0ff,#2f7bff)",
                  "linear-gradient(120deg,#34d399,#10b981)",
                  "linear-gradient(120deg,#1d3fe0,#0a1330)",
                  "linear-gradient(120deg,#2f7bff,#34d399)",
                ].map((background) => (
                  <div key={background} className="lc-preview-card">
                    <div className="lc-pc-tile" style={{ background }}></div>
                    <div className="lc-pc-line"></div>
                    <div className="lc-pc-line lc-short"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="lc-logo-strip">
        <div className="lc-container">
          <div className="lc-label">Trusted by teams building world-class English programs</div>
          <div className="lc-logo-row">
            <div className="lc-logo-item">Meridian&nbsp;Group</div>
            <div className="lc-logo-item">Vantara</div>
            <div className="lc-logo-item">Northfield&nbsp;Capital</div>
            <div className="lc-logo-item">Orbital&nbsp;Health</div>
            <div className="lc-logo-item">Ferro&nbsp;Dynamics</div>
            <div className="lc-logo-item">Lucera</div>
          </div>
        </div>
      </section>

      <section className="lc-section" id="solutions">
        <div className="lc-container">
          <div className="lc-section-head lc-reveal">
            <span className="lc-eyebrow">● Why Langslate</span>
            <h2 className="lc-display-2">A learning system built like Stripe, not like a course catalog.</h2>
            <p className="lc-lede">
              Every lesson is a self-contained, beautifully designed application — embedded directly inside your
              workspace. No redirects, no clunky LMS, no clutter.
            </p>
          </div>
          <div className="lc-feature-grid">
            <div className="lc-card lc-feature-card lc-reveal">
              <div className="lc-tile" style={{ background: "var(--gradient-accent)" }}>
                ◆
              </div>
              <h3>Organized around you</h3>
              <p>
                Study by profession, industry, department, or our flagship Langslate Pro executive tracks — not a
                one-size-fits-all syllabus.
              </p>
            </div>
            <div className="lc-card lc-feature-card lc-reveal" style={{ transitionDelay: ".05s" }}>
              <div className="lc-tile" style={{ background: "var(--gradient-emerald)" }}>
                ✓
              </div>
              <h3>Progress that sticks</h3>
              <p>Automatic completion tracking, bookmarks, streaks and resume-where-you-left-off across every device.</p>
            </div>
            <div className="lc-card lc-feature-card lc-reveal" style={{ transitionDelay: ".1s" }}>
              <div className="lc-tile" style={{ background: "linear-gradient(120deg,#7fb0ff,#1d3fe0)" }}>
                ✦
              </div>
              <h3>AI learning assistant</h3>
              <p>Personalized paths, vocabulary review, and writing feedback from an assistant that understands your role.</p>
            </div>
            <div className="lc-card lc-feature-card lc-reveal">
              <div className="lc-tile" style={{ background: "linear-gradient(120deg,#34d399,#059669)" }}>
                ▣
              </div>
              <h3>Built for teams</h3>
              <p>Enterprise seat management, manager dashboards, and department-level reporting for L&amp;D leaders.</p>
            </div>
            <div className="lc-card lc-feature-card lc-reveal" style={{ transitionDelay: ".05s" }}>
              <div className="lc-tile" style={{ background: "linear-gradient(120deg,#2f7bff,#0a1330)" }}>
                ◈
              </div>
              <h3>Certified outcomes</h3>
              <p>
                Premium, verifiable completion certificates for every track — ready to add to a resume or LinkedIn
                profile.
              </p>
            </div>
            <div className="lc-card lc-feature-card lc-reveal" style={{ transitionDelay: ".1s" }}>
              <div className="lc-tile" style={{ background: "linear-gradient(120deg,#1d3fe0,#10b981)" }}>
                ⌁
              </div>
              <h3>Instant, global search</h3>
              <p>Filter {roundedLabel} modules by CEFR level, duration, popularity, or department in milliseconds.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lc-section" style={{ background: "var(--bg-app-alt)" }} id="professions">
        <div className="lc-container">
          <div className="lc-section-head lc-reveal">
            <span className="lc-eyebrow">● The library</span>
            <h2 className="lc-display-2">Four ways to learn. One elegant platform.</h2>
            <p className="lc-lede">Explore a sample of the categories already live inside Langslate Corporate.</p>
          </div>
          <div className="lc-category-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`lc-category-tab${tab.key === currentTab?.key ? " lc-active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label} · {tab.categoryCount}
              </button>
            ))}
          </div>
          <div className="lc-category-showcase-grid" id="categoryShowcase">
            {currentTab?.cards.map((card) => (
              <Link
                key={`${currentTab.key}-${card.slug}`}
                href={card.href}
                className="lc-card lc-mini-cat-card lc-reveal lc-is-visible"
              >
                <div className="lc-mini-cat-thumb">
                  <img src={card.thumbnailSrc} alt="" loading="lazy" />
                </div>
                <div>
                  <div className="lc-cat-name">{card.name}</div>
                  <div className="lc-cat-count">{card.count} lessons</div>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link href={currentTab?.href ?? ROUTES.landing} className="lc-btn lc-btn-dark">
              Browse the full catalog →
            </Link>
          </div>
        </div>
      </section>

      <section className="lc-section" id="testimonials">
        <div className="lc-container">
          <div className="lc-section-head lc-reveal">
            <span className="lc-eyebrow">● Loved by professionals</span>
            <h2 className="lc-display-2">Learners don&apos;t just finish lessons. They finish careers, elevated.</h2>
          </div>
          <div className="lc-testimonial-grid">
            <div className="lc-card lc-testimonial-card lc-reveal">
              <div className="lc-stars">★★★★★</div>
              <p className="lc-quote">
                &quot;It feels like Stripe built a language school. The Architect track alone was worth the yearly
                plan.&quot;
              </p>
              <div className="lc-testimonial-person">
                <div className="lc-tile-sm" style={{ background: "linear-gradient(120deg,#2f7bff,#1d3fe0)" }}>
                  MK
                </div>
                <div>
                  <div className="lc-name">Mira Kessler</div>
                  <div className="lc-role">Senior Architect, Vantara</div>
                </div>
              </div>
            </div>
            <div className="lc-card lc-testimonial-card lc-reveal" style={{ transitionDelay: ".05s" }}>
              <div className="lc-stars">★★★★★</div>
              <p className="lc-quote">
                &quot;We rolled Langslate Pro out to 200 employees across 6 departments. Manager reporting made
                adoption trivial.&quot;
              </p>
              <div className="lc-testimonial-person">
                <div className="lc-tile-sm" style={{ background: "linear-gradient(120deg,#10b981,#059669)" }}>
                  JD
                </div>
                <div>
                  <div className="lc-name">Jonas Ebele</div>
                  <div className="lc-role">Head of L&amp;D, Northfield Capital</div>
                </div>
              </div>
            </div>
            <div className="lc-card lc-testimonial-card lc-reveal" style={{ transitionDelay: ".1s" }}>
              <div className="lc-stars">★★★★★</div>
              <p className="lc-quote">
                &quot;Every lesson feels custom-made for my job as an AI engineer. I&apos;ve never finished a course
                this fast.&quot;
              </p>
              <div className="lc-testimonial-person">
                <div className="lc-tile-sm" style={{ background: "linear-gradient(120deg,#7fb0ff,#2f7bff)" }}>
                  RS
                </div>
                <div>
                  <div className="lc-name">Rhea Suvari</div>
                  <div className="lc-role">AI Engineer, Ferro Dynamics</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lc-section" style={{ background: "var(--bg-app-alt)" }} id="pricing">
        <div className="lc-container">
          <div className="lc-section-head lc-reveal">
            <span className="lc-eyebrow">● Pricing</span>
            <h2 className="lc-display-2">Simple, transparent, built to scale with you.</h2>
          </div>
          <div className="lc-pricing-toggle">
            <span style={{ fontWeight: 600, fontSize: ".9rem" }}>Monthly</span>
            <button
              type="button"
              className={`lc-toggle-switch${yearly ? " lc-on" : ""}`}
              id="billingToggle"
              aria-label="Toggle yearly billing"
              aria-pressed={yearly}
              onClick={() => setYearly((value) => !value)}
            ></button>
            <span style={{ fontWeight: 600, fontSize: ".9rem" }}>
              Yearly <span className="lc-badge lc-badge-emerald">Save 44%</span>
            </span>
          </div>
          <div className="lc-pricing-grid">
            <div className="lc-card lc-price-card lc-reveal">
              <div className="lc-plan-name">Individual</div>
              <div className="lc-price" id="priceIndividual">
                {yearly ? "$16.67" : "$30"}
                <span>/mo</span>
              </div>
              <div className="lc-price-sub">or $500 lifetime, one time</div>
              <ul>
                <li>
                  <span className="lc-check">✓</span> Full library — {roundedLabel} lessons
                </li>
                <li>
                  <span className="lc-check">✓</span> Progress tracking &amp; certificates
                </li>
                <li>
                  <span className="lc-check">✓</span> AI learning assistant
                </li>
                <li>
                  <span className="lc-check">✓</span> All devices, offline downloads
                </li>
              </ul>
              <Link href={ROUTES.pricing} className="lc-btn lc-btn-secondary lc-btn-block">
                Start free trial
              </Link>
            </div>
            <div className="lc-card lc-price-card lc-featured lc-reveal" style={{ transitionDelay: ".05s" }}>
              <div className="lc-popular-flag">Most popular</div>
              <div className="lc-plan-name">Enterprise — 20 seats</div>
              <div className="lc-price">
                $500<span>/mo</span>
              </div>
              <div className="lc-price-sub">$25 per seat / month</div>
              <ul>
                <li>
                  <span className="lc-check">✓</span> Everything in Individual
                </li>
                <li>
                  <span className="lc-check">✓</span> Admin &amp; manager dashboards
                </li>
                <li>
                  <span className="lc-check">✓</span> Department-level reporting
                </li>
                <li>
                  <span className="lc-check">✓</span> CSV export &amp; certificate tracking
                </li>
              </ul>
              <Link href={ROUTES.pricing} className="lc-btn lc-btn-primary lc-btn-block">
                Talk to sales
              </Link>
            </div>
            <div className="lc-card lc-price-card lc-reveal" style={{ transitionDelay: ".1s" }}>
              <div className="lc-plan-name">Enterprise — 50+ seats</div>
              <div className="lc-price" style={{ fontSize: "2.1rem" }}>
                Contact us
              </div>
              <div className="lc-price-sub">Custom pricing for your org</div>
              <ul>
                <li>
                  <span className="lc-check">✓</span> Volume discounts
                </li>
                <li>
                  <span className="lc-check">✓</span> SSO &amp; dedicated onboarding
                </li>
                <li>
                  <span className="lc-check">✓</span> Custom content requests
                </li>
                <li>
                  <span className="lc-check">✓</span> Priority support &amp; SLA
                </li>
              </ul>
              <Link href={ROUTES.pricing} className="lc-btn lc-btn-secondary lc-btn-block">
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="lc-section">
        <div className="lc-container">
          <div className="lc-cta-band lc-reveal">
            <span className="lc-eyebrow" style={{ color: "#7fb0ff" }}>
              ● Ready when you are
            </span>
            <h2 className="lc-display-2">Give your career the vocabulary it deserves.</h2>
            <p className="lc-lede">
              Join thousands of professionals learning inside the most premium Business English platform ever built.
            </p>
            <Link href={ROUTES.pricing} className="lc-btn lc-btn-primary lc-btn-lg">
              Start your free trial →
            </Link>
          </div>
        </div>
      </section>

      <footer className="lc-footer">
        <div className="lc-container">
          <div className="lc-footer-grid">
            <div className="lc-footer-brand">
              <div className="lc-brand">
                <span className="lc-brand-mark">L</span> Langslate Corporate
              </div>
              <p>The premium Business English platform for professions, industries, departments, and elite executive programs.</p>
            </div>
            <div className="lc-footer-col">
              <h4>Product</h4>
              <a href="#solutions">Solutions</a>
              <a href="#pricing">Pricing</a>
              <Link href={ROUTES.dashboard}>Dashboard</Link>
              <a href="#">Certificates</a>
            </div>
            <div className="lc-footer-col">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Press</a>
              <a href="#">Contact</a>
            </div>
            <div className="lc-footer-col">
              <h4>Resources</h4>
              <a href="#">Help center</a>
              <a href="#">Enterprise</a>
              <a href="#">Partners</a>
              <a href="#">Status</a>
            </div>
            <div className="lc-footer-col">
              <h4>Legal</h4>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Security</a>
            </div>
          </div>
          <div className="lc-footer-bottom">
            <span>© 2026 Langslate Corporate. All rights reserved.</span>
            <span>Made for professionals who mean business.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
