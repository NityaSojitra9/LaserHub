import React from 'react';
import { Calendar, Printer } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const PrivacyPolicyPage: React.FC = () => {
  useDocumentTitle('Privacy Policy — LaserHub');
  const handlePrint = () => window.print();
  const tocItems = [
    { id: 'introduction', label: '1. Introduction' },
    { id: 'data-we-collect', label: '2. Data We Collect' },
    { id: 'how-we-use', label: '3. How We Use Your Data' },
    { id: 'data-sharing', label: '4. Data Sharing' },
    { id: 'payments', label: '5. Payment Data' },
    { id: 'google-oauth', label: '6. Google OAuth' },
    { id: 'cookies', label: '7. Cookies' },
    { id: 'analytics', label: '8. Analytics' },
    { id: 'data-retention', label: '9. Data Retention' },
    { id: 'your-rights', label: '10. Your Rights' },
    { id: 'data-deletion', label: '11. Data Deletion' },
    { id: 'security', label: '12. Data Security' },
    { id: 'children', label: '13. Children\'s Privacy' },
    { id: 'changes', label: '14. Changes to Policy' },
    { id: 'contact', label: '15. Contact Us' },
  ];

  return (
    <div className="policy-page-layout">
      {/* Floating TOC sidebar */}
      <aside className="policy-toc">
        <h4>Contents</h4>
        <ol>
          {tocItems.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`}>{item.label}</a>
            </li>
          ))}
        </ol>
      </aside>

      {/* Main content */}
      <div className="policy-content legal-content">
        <div className="legal-header">
          <h1>Privacy Policy</h1>
          <button className="legal-print-btn" onClick={handlePrint} aria-label="Print">
            <Printer size={14} /> Print
          </button>
        </div>
        <p className="policy-updated legal-updated">
          <Calendar size={14} /> Last updated: April 1, 2026
        </p>

        {/* ── 1. Introduction ── */}
        <h2 id="introduction">1. Introduction</h2>
        <p>
          This Privacy Policy describes how LaserHub, operated by hjLabs.in ("we," "us," or
          "our"), collects, uses, stores, and shares your personal information when you use
          our platform at laserhub.hjlabs.in (the "Platform"). By creating an account or
          using the Platform, you agree to the practices described in this policy.
        </p>
        <p>
          We are committed to protecting your privacy and handling your data transparently.
          If you have questions or concerns, contact us at{' '}
          <a href="mailto:hemangjoshi37a@gmail.com">hemangjoshi37a@gmail.com</a> before using
          the Platform.
        </p>
        <div className="policy-callout">
          <p>
            <strong>We do not sell, rent, or trade your personal information to third
            parties for marketing purposes.</strong>
          </p>
        </div>

        {/* ── 2. Data We Collect ── */}
        <h2 id="data-we-collect">2. Data We Collect</h2>
        <h3>2.1 Account Information</h3>
        <p>When you create an account or place an order, we collect:</p>
        <ul>
          <li><strong>Email address</strong> — used for authentication, order notifications,
              and support communication.</li>
          <li><strong>Name</strong> — used for personalisation and order records.</li>
          <li><strong>Phone number</strong> (optional) — used for order-related communication
              if provided.</li>
          <li><strong>Shipping and billing address</strong> — provided when placing an order;
              shared with the fulfilling vendor.</li>
          <li><strong>Business name and tax ID</strong> (for vendor accounts) — used for
              vendor onboarding and payouts.</li>
        </ul>
        <h3>2.2 Uploaded File Metadata</h3>
        <p>
          When you upload a design file (SVG, DXF, AI, PDF, EPS), we store:
        </p>
        <ul>
          <li>The file itself during active order processing and fulfilment;</li>
          <li>File metadata: filename, file size, file type, upload timestamp;</li>
          <li>Parsed technical data: cut path length, estimated area, number of paths —
              used for cost calculation.</li>
        </ul>
        <p>
          We do <strong>not</strong> retain your design files indefinitely. Files associated
          with completed orders are eligible for deletion after 90 days unless you have an
          active account storing them. Files are your intellectual property; see our Terms of
          Service for details.
        </p>
        <h3>2.3 Order History</h3>
        <p>
          We retain records of all orders placed through the Platform, including order details,
          status history, selected materials, quantities, pricing, and communications between
          buyer and vendor. Order records are kept for a minimum of 5 years for legal and
          accounting compliance.
        </p>
        <h3>2.4 Usage and Technical Data</h3>
        <p>
          We automatically collect certain technical information when you use the Platform:
        </p>
        <ul>
          <li>IP address and approximate geolocation;</li>
          <li>Browser type, version, and language;</li>
          <li>Device type and operating system;</li>
          <li>Pages visited, time on page, and navigation patterns;</li>
          <li>Referring URL (how you arrived at the Platform).</li>
        </ul>
        <p>
          This data is collected to maintain platform security, troubleshoot bugs, and
          improve the user experience. It is not used for advertising profiling.
        </p>

        {/* ── 3. How We Use ── */}
        <h2 id="how-we-use">3. How We Use Your Data</h2>
        <p>We use the data we collect for the following purposes:</p>
        <ul>
          <li><strong>Order processing:</strong> To create, manage, and fulfil your laser
              cutting orders and communicate status updates.</li>
          <li><strong>Authentication:</strong> To verify your identity when you log in and
              maintain session security.</li>
          <li><strong>Cost estimation:</strong> To parse uploaded file metadata and calculate
              material cost, laser time, and order total.</li>
          <li><strong>Communication:</strong> To send order confirmations, shipping updates,
              support responses, and (if opted in) product announcements.</li>
          <li><strong>Platform improvement:</strong> To analyse usage patterns, identify bugs,
              and improve features.</li>
          <li><strong>Fraud prevention and security:</strong> To detect suspicious activity,
              enforce our Terms of Service, and protect users.</li>
          <li><strong>Legal compliance:</strong> To comply with applicable Indian laws,
              including GST reporting and court orders.</li>
        </ul>

        {/* ── 4. Data Sharing ── */}
        <h2 id="data-sharing">4. Data Sharing</h2>
        <p>
          We do not sell your personal information. We share your data only in the following
          limited circumstances:
        </p>
        <ul>
          <li>
            <strong>Vendors:</strong> When you place an order, we share your name, shipping
            address, and order details with the vendor fulfilling your order. We share only
            what is necessary for order fulfilment.
          </li>
          <li>
            <strong>Payment processors:</strong> Payment is handled by Stripe and/or Razorpay.
            We share the minimum required information (order amount, currency, email) to
            initiate a payment session. We never see your full card number (see Section 5).
          </li>
          <li>
            <strong>Hosting and infrastructure providers:</strong> We use third-party cloud
            hosting for the Platform. These providers process data on our behalf and are
            contractually bound to protect it.
          </li>
          <li>
            <strong>Email delivery service:</strong> We use an SMTP provider to deliver
            transactional emails (order confirmations, password resets). Only your email
            address and the content of the email are shared.
          </li>
          <li>
            <strong>Legal requirements:</strong> We may disclose your information if required
            by law, court order, or a government authority in India, or to protect the safety
            of users and the integrity of the Platform.
          </li>
        </ul>

        {/* ── 5. Payment Data ── */}
        <h2 id="payments">5. Payment Data</h2>
        <p>
          All payment processing on LaserHub is handled entirely by <strong>Stripe</strong>{' '}
          and/or <strong>Razorpay</strong> — third-party payment processors with their own
          privacy policies and PCI DSS compliance certifications.
        </p>
        <ul>
          <li>
            <strong>We never see or store your card number, CVV, or full bank account
            details.</strong> This information is entered directly into the payment
            processor's secure form and is tokenised before reaching our servers.
          </li>
          <li>
            We store only: order amount, currency, payment status, and a payment reference
            token issued by the processor. This is sufficient for order confirmation and
            refund processing.
          </li>
          <li>
            For refunds, we initiate a refund request via the payment processor's API using
            the stored reference token. We do not hold or transfer funds directly.
          </li>
        </ul>
        <p>
          For information on how Stripe or Razorpay handle your data, please review their
          respective privacy policies at stripe.com and razorpay.com.
        </p>

        {/* ── 6. Google OAuth ── */}
        <h2 id="google-oauth">6. Google OAuth (Sign in with Google)</h2>
        <p>
          LaserHub offers "Sign in with Google" as an authentication option. If you choose
          to sign in using your Google account, Google will share the following data with us:
        </p>
        <ul>
          <li><strong>Email address</strong> — used as your account identifier on LaserHub;</li>
          <li><strong>Name</strong> (first and last) — used to pre-fill your account profile;</li>
          <li>
            <strong>Profile picture URL</strong> — used to display your avatar in the
            Platform interface (the image itself is served from Google's CDN; we do not
            download or store it on our servers).
          </li>
        </ul>
        <p>
          We do <strong>not</strong> receive access to your Google Drive, Gmail, contacts,
          or any other Google service. The OAuth scope we request is limited to basic
          profile information (openid, email, profile).
        </p>
        <p>
          You can revoke LaserHub's access to your Google account at any time via
          your Google Account security settings at myaccount.google.com/permissions.
          Revoking access does not delete your LaserHub account; you can still log in
          using email and password if you set one.
        </p>

        {/* ── 7. Cookies ── */}
        <h2 id="cookies">7. Cookies</h2>
        <p>
          LaserHub uses a small number of cookies and browser storage mechanisms. We do
          not use advertising cookies or cross-site tracking cookies.
        </p>
        <ul>
          <li>
            <strong>Session / authentication cookie (essential):</strong> A JWT token stored
            in a secure, httpOnly cookie (or localStorage, depending on browser settings) to
            keep you logged in during your session. This cookie is required for the Platform
            to function. It expires when you log out or after a set inactivity period.
          </li>
          <li>
            <strong>Preference cookie:</strong> Stores your dark mode / light mode preference
            so it persists across sessions. This cookie contains no personal data.
          </li>
        </ul>
        <p>
          You can control or delete cookies through your browser settings. Disabling the
          session cookie will prevent you from logging in. Disabling the preference cookie
          will reset your theme preference on each visit.
        </p>

        {/* ── 8. Analytics ── */}
        <h2 id="analytics">8. Analytics</h2>
        <p>
          <strong>At this time, LaserHub does not use any third-party analytics services</strong>{' '}
          (such as Google Analytics, Mixpanel, or similar). We collect basic server-side
          usage logs (page views, API request counts) for performance monitoring and
          debugging only. These logs do not contain personally identifiable information
          beyond IP addresses, and they are retained for no longer than 30 days.
        </p>
        <p>
          If we introduce third-party analytics in the future, we will update this policy
          and provide opt-out mechanisms where required by law.
        </p>

        {/* ── 9. Data Retention ── */}
        <h2 id="data-retention">9. Data Retention</h2>
        <ul>
          <li>
            <strong>Account data</strong> (email, name): Retained for as long as your
            account is active. Deleted within 30 days of a verified account deletion request.
          </li>
          <li>
            <strong>Order records and transaction data:</strong> Retained for a minimum of
            5 years from the order date for legal, tax, and accounting compliance under
            Indian law.
          </li>
          <li>
            <strong>Uploaded design files:</strong> Retained during active order processing.
            Files linked to completed orders are eligible for deletion after 90 days unless
            you store them in your account's design library.
          </li>
          <li>
            <strong>Server logs:</strong> Retained for up to 30 days for security and
            debugging purposes, then automatically purged.
          </li>
        </ul>

        {/* ── 10. Your Rights ── */}
        <h2 id="your-rights">10. Your Rights</h2>
        <p>
          Depending on your jurisdiction, you may have the following rights regarding your
          personal data. To exercise any of these rights, contact us at{' '}
          <a href="mailto:hemangjoshi37a@gmail.com">hemangjoshi37a@gmail.com</a>:
        </p>
        <ul>
          <li>
            <strong>Access:</strong> Request a copy of the personal data we hold about you.
          </li>
          <li>
            <strong>Correction:</strong> Request correction of inaccurate or incomplete data.
          </li>
          <li>
            <strong>Deletion:</strong> Request deletion of your personal data (see Section 11).
          </li>
          <li>
            <strong>Portability:</strong> Request your data in a structured, machine-readable
            format (JSON or CSV).
          </li>
          <li>
            <strong>Objection:</strong> Object to specific processing of your personal data
            (e.g., marketing emails).
          </li>
          <li>
            <strong>Withdraw consent:</strong> Where processing is based on your consent,
            withdraw it at any time without affecting the lawfulness of prior processing.
          </li>
        </ul>
        <p>
          We will respond to verifiable requests within 30 days. We may need to verify
          your identity before processing sensitive requests.
        </p>

        {/* ── 11. Data Deletion ── */}
        <h2 id="data-deletion">11. Data Deletion Request</h2>
        <p>
          To request deletion of your LaserHub account and associated personal data, email us
          at <a href="mailto:hemangjoshi37a@gmail.com">hemangjoshi37a@gmail.com</a> with the
          subject line <em>"Account Deletion Request"</em> from the email address linked to
          your account.
        </p>
        <p>We will:</p>
        <ul>
          <li>Verify your identity;</li>
          <li>Delete your account, profile, uploaded files, and non-mandatory data within
              <strong> 30 days</strong>;</li>
          <li>Retain order records and transaction data for 5 years as required by Indian
              accounting and tax law — this cannot be deleted on request.</li>
        </ul>
        <p>
          After deletion, you will no longer be able to log in to your account, and your
          order history will not be accessible through the Platform.
        </p>

        {/* ── 12. Security ── */}
        <h2 id="security">12. Data Security</h2>
        <p>
          We implement industry-standard security measures to protect your personal information:
        </p>
        <ul>
          <li>All data in transit is encrypted using TLS 1.2 or higher;</li>
          <li>Passwords are hashed using bcrypt before storage — we never store plaintext
              passwords;</li>
          <li>Access to production databases and servers is restricted to authorised
              personnel only;</li>
          <li>JWT authentication tokens have short expiry windows and are invalidated
              on logout.</li>
        </ul>
        <p>
          Despite these measures, no method of electronic transmission or storage is
          100% secure. In the event of a data breach affecting your personal information,
          we will notify you and relevant authorities as required by applicable law.
        </p>

        {/* ── 13. Children's Privacy ── */}
        <h2 id="children">13. Children's Privacy</h2>
        <p>
          The Platform is not intended for users under the age of 18. We do not knowingly
          collect personal information from minors. If you believe a child under 18 has
          created an account or provided us with personal data, please contact us at{' '}
          <a href="mailto:hemangjoshi37a@gmail.com">hemangjoshi37a@gmail.com</a> and we
          will take prompt steps to delete that data and close the account.
        </p>

        {/* ── 14. Changes ── */}
        <h2 id="changes">14. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our
          practices, technology, or applicable law. When we make material changes, we will
          update the "Last updated" date at the top of this page and, where required by law,
          notify you by email at least 30 days before the changes take effect.
        </p>
        <p>
          Your continued use of the Platform after the effective date of a revised Privacy
          Policy constitutes your acceptance of the changes.
        </p>

        {/* ── 15. Contact ── */}
        <h2 id="contact">15. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, want to exercise your data rights,
          or wish to make a deletion request, please contact us:
        </p>
        <ul>
          <li>Email: <a href="mailto:hemangjoshi37a@gmail.com">hemangjoshi37a@gmail.com</a></li>
          <li>Website: <a href="https://hjlabs.in" target="_blank" rel="noopener noreferrer">hjlabs.in</a></li>
          <li>Platform: <a href="https://laserhub.hjlabs.in" target="_blank" rel="noopener noreferrer">laserhub.hjlabs.in</a></li>
          <li>Operator: LaserHub by hjLabs.in, Gujarat, India</li>
        </ul>
      </div>
    </div>
  );
};
