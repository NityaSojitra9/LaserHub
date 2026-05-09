import React, { useState } from 'react';
import { Mail, Github, Clock } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const SUBJECTS = [
  'General Inquiry',
  'Vendor Inquiry',
  'Bug Report',
  'Feature Request',
  'Other',
];

export const ContactUsPage: React.FC = () => {
  useDocumentTitle('Contact — LaserHub');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${message}`
    );
    const subjectEncoded = encodeURIComponent(`[LaserHub] ${subject}`);
    window.location.href = `mailto:hemangjoshi37a@gmail.com?subject=${subjectEncoded}&body=${body}`;
  };

  return (
    <div className="contact-page">
      {/* Hero */}
      <div className="contact-hero">
        <div className="contact-hero-content">
          <h1 className="contact-hero-title">Get in Touch</h1>
          <p className="contact-hero-sub">
            We typically respond within 24 hours. Reach out for bug reports, vendor
            inquiries, feature requests, or general questions.
          </p>
        </div>
      </div>

      <div className="contact-body">
        {/* Info cards */}
        <div className="contact-grid">
          <div className="contact-card">
            <div className="contact-card-icon">
              <Mail size={22} />
            </div>
            <h3>Email</h3>
            <p>Send us a message directly.</p>
            <a href="mailto:hemangjoshi37a@gmail.com" className="contact-card-link">
              hemangjoshi37a@gmail.com
            </a>
          </div>

          <div className="contact-card">
            <div className="contact-card-icon">
              <Github size={22} />
            </div>
            <h3>GitHub Issues</h3>
            <p>Report bugs or request features on the public tracker.</p>
            <a
              href="https://github.com/hemangjoshi37a/LaserHub/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-card-link"
            >
              Open an issue
            </a>
          </div>

          <div className="contact-card">
            <div className="contact-card-icon">
              <Clock size={22} />
            </div>
            <h3>Response Time</h3>
            <p>We respond to all enquiries within 24–48 hours on business days.</p>
          </div>
        </div>

        {/* Contact form */}
        <div className="contact-form-wrapper">
          <h2>Send a Message</h2>
          <p className="contact-form-note">
            Submitting this form will open your email client pre-filled with your message.
          </p>
          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="contact-form-row">
              <div className="contact-form-group">
                <label htmlFor="contact-name">Name</label>
                <input
                  id="contact-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className="contact-form-group">
                <label htmlFor="contact-email">Email</label>
                <input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="contact-form-group">
              <label htmlFor="contact-subject">Subject</label>
              <select
                id="contact-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="contact-form-group">
              <label htmlFor="contact-message">Message</label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your question or issue in detail..."
                rows={7}
                required
              />
            </div>

            <button type="submit" className="contact-submit-btn">
              <Mail size={16} />
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
