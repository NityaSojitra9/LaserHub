import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  Github,
  ExternalLink,
  Upload,
  Zap,
  Users,
  Star,
  Target,
  Rocket,
  Cpu,
  UserCircle,
  BookOpen,
  Linkedin,
} from 'lucide-react';

export const AboutUsPage: React.FC = () => {
  useDocumentTitle('About — LaserHub');
  return (
    <div className="about-page">
      {/* Hero */}
      <div className="about-hero about-hero-split">
        <div className="about-hero-content">
          <div className="about-hero-badge">Open Source</div>
          <h1 className="about-hero-title">About LaserHub</h1>
          <p className="about-hero-tagline">
            The open marketplace for laser cutting services.
          </p>
          <div className="about-hero-actions">
            <Link to="/upload" className="btn-primary-lg">
              <Upload size={18} />
              Upload Your Design
            </Link>
            <a
              href="https://github.com/hemangjoshi37a/LaserHub"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline-lg"
            >
              <Github size={18} />
              View on GitHub
            </a>
          </div>
        </div>
        <div className="about-hero-visual" aria-hidden="true">
          <div className="about-hero-visual-blob" />
          <div className="about-hero-visual-grid" />
          <div className="about-hero-visual-icon">
            <Zap size={48} />
          </div>
        </div>
      </div>

      <div className="about-body">
        {/* Mission */}
        <section className="about-section">
          <div className="about-section-label"><Target size={14} /> Our Mission</div>
          <h2>Democratizing fabrication for everyone</h2>
          <p>
            LaserHub was built on a simple belief: high-quality laser cutting should be accessible
            to anyone with a good idea — not just large companies with procurement budgets and
            vendor relationships. Whether you are a hobbyist prototyping a gadget, a designer
            producing a run of custom parts, or a small business bringing a product to market,
            you deserve instant pricing, real vendor comparison, and a smooth ordering experience.
          </p>
          <p>
            We eliminate the friction of getting a quote. Upload your DXF, SVG, PDF, or AI file,
            select your material and thickness, and receive a detailed cost breakdown in seconds.
            No phone calls. No back-and-forth emails. No guesswork.
          </p>
        </section>

        {/* What makes us different */}
        <section className="about-section">
          <div className="about-section-label"><Star size={14} /> Why LaserHub</div>
          <h2>What makes us different</h2>
          <div className="about-features-grid">
            <div className="about-feature-card">
              <div className="about-feature-icon">
                <Zap size={22} />
              </div>
              <h3>Instant, transparent quotes</h3>
              <p>
                Our cost calculator analyses your vector geometry — cut length, area, laser time,
                energy, and machine time — and produces an itemised quote in real time. No hidden
                fees, no surprises at checkout.
              </p>
            </div>
            <div className="about-feature-card">
              <div className="about-feature-icon">
                <Users size={22} />
              </div>
              <h3>Multi-vendor marketplace</h3>
              <p>
                Browse verified laser cutting vendors, compare capabilities and pricing, and place
                orders directly through the platform. Healthy competition keeps prices fair and
                quality high.
              </p>
            </div>
            <div className="about-feature-card">
              <div className="about-feature-icon">
                <Star size={22} />
              </div>
              <h3>Free design sharing</h3>
              <p>
                Upload your designs to the public gallery and let the community discover and
                order from them. Share your creativity, earn recognition, and help other makers
                skip the design phase.
              </p>
            </div>
            <div className="about-feature-card">
              <div className="about-feature-icon">
                <Github size={22} />
              </div>
              <h3>Fully open source</h3>
              <p>
                Every line of LaserHub is publicly available on GitHub. Audit the code, run your
                own instance, or contribute improvements. Transparency is not an afterthought —
                it is the foundation.
              </p>
            </div>
          </div>
        </section>

        {/* Platform story */}
        <section className="about-section">
          <div className="about-section-label"><Rocket size={14} /> Our Story</div>
          <h2>Built by makers, for makers</h2>
          <p>
            LaserHub was created by <strong>Hemang Joshi</strong> at{' '}
            <a href="https://hjlabs.in" target="_blank" rel="noopener noreferrer">
              hjLabs.in
            </a>
            , an India-based engineering and AI/ML lab that builds open-source tools for
            real-world problems. The platform grew out of a recurring frustration: getting a
            laser cutting quote was still a manual, slow, vendor-dependent process even in 2025.
          </p>
          <p>
            We set out to build what SendCutSend proved was possible in the US — an instant,
            online fabrication marketplace — but as an open platform that any vendor can join
            and any developer can extend. LaserHub starts with laser cutting and expands from
            there: CNC routing, waterjet, 3D printing, and more.
          </p>
          <p>
            The project is community-driven. Feature requests, bug reports, and pull requests are
            all welcome. If you build something useful with LaserHub, we want to hear about it.
          </p>
        </section>

        {/* Technology */}
        <section className="about-section">
          <div className="about-section-label"><Cpu size={14} /> Technology</div>
          <h2>How the platform works</h2>
          <p>
            LaserHub accepts standard vector formats — <strong>DXF</strong>, <strong>SVG</strong>,
            <strong> AI</strong>, <strong>PDF</strong>, and <strong>EPS</strong> — and parses
            the geometry server-side using ezdxf, Shapely, and NumPy. The cost engine computes
            material cost per cm², laser travel time, energy consumption, and machine overhead
            to produce a per-piece quote that vendors can honour with confidence.
          </p>
          <p>
            The stack is modern and self-hostable: <strong>FastAPI</strong> (Python 3.13) on the
            backend with async SQLAlchemy and Pydantic v2, and <strong>React 18 + TypeScript
            + Vite</strong> on the frontend. Payments are handled by Stripe. Everything runs on
            SQLite in development and PostgreSQL in production.
          </p>
          <p>
            Full setup instructions and architecture documentation are available in the repository.
          </p>
        </section>

        {/* Team */}
        <section className="about-section">
          <div className="about-section-label"><UserCircle size={14} /> Team</div>
          <h2>Who we are</h2>
          <div className="about-founder-card">
            <div className="about-founder-photo" aria-hidden="true">
              <div className="about-founder-photo-inner">HJ</div>
            </div>
            <div className="about-founder-info">
              <h3>Hemang Joshi</h3>
              <p className="about-founder-role">Founder &amp; Lead Engineer · hjLabs.in</p>
              <p>
                Hemang is an engineer and open-source developer based in India. He builds
                production-grade tools at the intersection of AI/ML, web platforms, and physical
                fabrication. LaserHub is his attempt to bring modern software engineering
                discipline to the manufacturing marketplace space.
              </p>
              <div className="about-founder-links">
                <a href="https://hjlabs.in" target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} />
                  hjlabs.in
                </a>
                <a
                  href="https://github.com/hemangjoshi37a"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github size={14} />
                  GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/hemangjoshi37a/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin size={14} />
                  LinkedIn
                </a>
                <a href="mailto:hemangjoshi37a@gmail.com">hemangjoshi37a@gmail.com</a>
              </div>
            </div>
          </div>
        </section>

        {/* Open Source */}
        <section className="about-section about-oss-section">
          <div className="about-section-label"><BookOpen size={14} /> Open Source</div>
          <h2>Contribute to LaserHub</h2>
          <p>
            LaserHub is MIT-licensed and developed in the open. The full source code, issue
            tracker, and roadmap live on GitHub. We welcome contributions of all kinds —
            bug fixes, new features, documentation improvements, or just a star if you
            find the project useful.
          </p>
          <a
            href="https://github.com/hemangjoshi37a/LaserHub"
            target="_blank"
            rel="noopener noreferrer"
            className="about-oss-cta"
          >
            <Github size={20} />
            github.com/hemangjoshi37a/LaserHub
          </a>
        </section>

        {/* Footer CTA */}
        <div className="about-cta-banner">
          <h2>Ready to cut?</h2>
          <p>Upload your design and get an instant quote — no account required.</p>
          <Link to="/upload" className="btn-primary-lg">
            <Upload size={18} />
            Upload Your Design
          </Link>
        </div>
      </div>
    </div>
  );
};
