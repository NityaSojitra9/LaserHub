import React from 'react';
import { Calendar, Printer } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const TermsOfServicePage: React.FC = () => {
  useDocumentTitle('Terms of Service — LaserHub');
  const handlePrint = () => window.print();
  const tocItems = [
    { id: 'platform-description', label: '1. Platform Description' },
    { id: 'eligibility', label: '2. Eligibility' },
    { id: 'user-accounts', label: '3. User Accounts' },
    { id: 'vendor-obligations', label: '4. Vendor Obligations' },
    { id: 'buyer-obligations', label: '5. Buyer Obligations' },
    { id: 'intellectual-property', label: '6. Intellectual Property' },
    { id: 'prohibited-content', label: '7. Prohibited Content' },
    { id: 'platform-liability', label: '8. Limitation of Liability' },
    { id: 'disclaimer', label: '9. Disclaimer of Warranties' },
    { id: 'dispute-resolution', label: '10. Dispute Resolution' },
    { id: 'account-suspension', label: '11. Account Suspension' },
    { id: 'governing-law', label: '12. Governing Law' },
    { id: 'modifications', label: '13. Modifications to Terms' },
    { id: 'contact', label: '14. Contact Us' },
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
          <h1>Terms of Service</h1>
          <button className="legal-print-btn" onClick={handlePrint} aria-label="Print">
            <Printer size={14} /> Print
          </button>
        </div>
        <p className="policy-updated legal-updated">
          <Calendar size={14} /> Last updated: April 1, 2026
        </p>

        <div className="policy-callout warning">
          <p>
            <strong>Important:</strong> LaserHub is a marketplace intermediary. We do not manufacture,
            ship, or guarantee any products or services provided by vendors. By using this platform
            you acknowledge and accept the terms below in full.
          </p>
        </div>

        <p>
          These Terms of Service ("Terms") govern your access to and use of the LaserHub platform
          operated by hjLabs.in ("we," "us," "our," or "Platform"), accessible at
          laserhub.hjlabs.in. By creating an account or placing an order, you confirm that you have
          read, understood, and agree to be bound by these Terms and our Privacy Policy. If you
          do not agree, please do not use the Platform.
        </p>

        {/* ── 1. Platform Description ── */}
        <h2 id="platform-description">1. Platform Description</h2>
        <p>
          LaserHub is an online marketplace that connects buyers seeking laser cutting, engraving,
          and related fabrication services with independent vendors who provide those services.
          hjLabs.in acts solely as a technology intermediary — like a marketplace platform — and
          is <strong>not</strong> a laser cutting service provider, manufacturer, or retailer.
        </p>
        <p>
          All manufacturing, quality control, packaging, and delivery are the exclusive
          responsibility of the vendor who accepts an order. LaserHub facilitates the connection
          but is not a party to the contract formed between a buyer and a vendor.
        </p>
        <div className="policy-callout">
          <p>
            LaserHub's role is limited to providing the technology platform. We do not control,
            inspect, or guarantee the quality, safety, legality, or timely delivery of any goods
            or services listed or sold on the Platform.
          </p>
        </div>

        {/* ── 2. Eligibility ── */}
        <h2 id="eligibility">2. Eligibility</h2>
        <p>
          You must be at least <strong>18 years of age</strong> to create an account, upload files,
          or place orders on LaserHub. By using the Platform, you represent and warrant that:
        </p>
        <ul>
          <li>You are 18 years of age or older;</li>
          <li>You have the legal capacity to enter into binding contracts;</li>
          <li>You are not barred from using the Platform under any applicable law;</li>
          <li>You will comply with these Terms and all applicable local, state, national, and
              international laws and regulations.</li>
        </ul>
        <p>
          If you are registering on behalf of a business entity, you represent that you have
          authority to bind that entity to these Terms.
        </p>

        {/* ── 3. User Accounts ── */}
        <h2 id="user-accounts">3. User Accounts</h2>
        <h3>3.1 Registration</h3>
        <p>
          To access most features you must create an account. You agree to provide accurate,
          current, and complete information and to keep your account details updated. Providing
          false information is grounds for immediate account suspension.
        </p>
        <h3>3.2 Account Security</h3>
        <p>
          You are solely responsible for all activity that occurs under your account, including
          all orders placed, files uploaded, and payments made. Notify us immediately at{' '}
          <a href="mailto:hemangjoshi37a@gmail.com">hemangjoshi37a@gmail.com</a> if you suspect
          unauthorized access.
        </p>
        <h3>3.3 One Account Per User</h3>
        <p>
          Each person may maintain only one buyer account and one vendor account. Creating
          duplicate accounts to circumvent restrictions or penalties is prohibited.
        </p>

        {/* ── 4. Vendor Obligations ── */}
        <h2 id="vendor-obligations">4. Vendor Obligations</h2>
        <p>
          By registering as a vendor on LaserHub, you agree to the following obligations. Failure
          to meet these obligations may result in order cancellation, withheld payouts, account
          suspension, or permanent removal from the Platform.
        </p>
        <h3>4.1 Accurate Listings</h3>
        <p>
          Vendors must provide accurate, truthful, and complete descriptions of their services,
          materials offered, production capabilities, pricing, and estimated turnaround times.
          Material substitutions require buyer consent before production begins.
        </p>
        <h3>4.2 Timely Fulfilment</h3>
        <p>
          Vendors must fulfil orders within the turnaround time stated on their listing.
          If a delay is unavoidable, the vendor must notify the buyer within 24 hours of
          becoming aware of the delay. Repeated late deliveries are grounds for account review.
        </p>
        <h3>4.3 Quality Guarantee</h3>
        <p>
          The finished product must match the buyer's approved file and specifications within
          industry-standard tolerances. Vendors are solely responsible for defects arising
          from their manufacturing process, material choices, or quality control failures.
          LaserHub does not inspect, certify, or guarantee any vendor's work.
        </p>
        <h3>4.4 Compliance with Law</h3>
        <p>
          Vendors are responsible for complying with all applicable laws related to their
          business operations, including business registration, GST/tax obligations, and
          health and safety requirements relevant to laser cutting operations.
        </p>
        <h3>4.5 Platform Fees</h3>
        <p>
          Vendors agree to the fee structure communicated at registration. Platform fees are
          non-negotiable and may be updated with 30 days' notice. Continued use of the Platform
          after the notice period constitutes acceptance of the updated fee structure.
        </p>

        {/* ── 5. Buyer Obligations ── */}
        <h2 id="buyer-obligations">5. Buyer Obligations</h2>
        <h3>5.1 Accurate Shipping Information</h3>
        <p>
          Buyers are solely responsible for providing a correct and complete shipping address
          at the time of order. LaserHub and vendors accept no liability for non-delivery or
          delay caused by an incorrect address provided by the buyer. Re-delivery charges
          (if any) are the buyer's responsibility.
        </p>
        <h3>5.2 File Accuracy and Design Ownership</h3>
        <p>
          Buyers are responsible for uploading design files that are technically correct,
          print-ready, and free from errors. Vendors will manufacture exactly what is in the
          approved file. LaserHub is not liable for errors in buyer-supplied design files.
          Additionally, buyers represent that they own or hold sufficient rights in all designs
          they upload (see Section 6).
        </p>
        <h3>5.3 No Chargebacks Without Prior Communication</h3>
        <p>
          Buyers agree not to initiate a payment chargeback or reversal with their bank or
          payment provider without first:
        </p>
        <ul>
          <li>Contacting the vendor through the Platform's messaging system;</li>
          <li>Waiting a minimum of 7 calendar days for a response; and</li>
          <li>If unresolved, escalating to LaserHub at{' '}
              <a href="mailto:hemangjoshi37a@gmail.com">hemangjoshi37a@gmail.com</a>.</li>
        </ul>
        <p>
          Initiating a chargeback without following this process may result in account
          suspension and the buyer being held liable for any associated chargeback fees
          passed on to LaserHub or the vendor.
        </p>
        <h3>5.4 Payment</h3>
        <p>
          Buyers agree to pay the full listed price, applicable taxes, and shipping charges
          at the time of order. All payments are processed by Stripe or Razorpay. LaserHub
          never stores card numbers or full payment credentials.
        </p>

        {/* ── 6. Intellectual Property ── */}
        <h2 id="intellectual-property">6. Intellectual Property</h2>
        <h3>6.1 Buyer Responsibility for Uploaded Designs</h3>
        <p>
          <strong>You, the uploader, bear full and exclusive responsibility for the intellectual
          property status of any file you upload to LaserHub.</strong> By uploading a file you
          represent and warrant that:
        </p>
        <ul>
          <li>You are the original creator of the design, or you hold a valid license to
              reproduce and manufacture it commercially;</li>
          <li>The design does not infringe any third-party copyright, trademark, patent,
              trade secret, or other proprietary right;</li>
          <li>You have obtained all necessary permissions from the rights-holder if the design
              is based on, derived from, or includes elements owned by a third party.</li>
        </ul>
        <p>
          LaserHub does not review uploaded designs for IP compliance. We disclaim all liability
          for any infringement claim arising from buyer-uploaded content. You agree to indemnify
          and hold harmless LaserHub, hjLabs.in, and our employees from any claim, loss, damage,
          or expense (including legal fees) arising from your uploaded content.
        </p>
        <h3>6.2 License Grant to Vendors</h3>
        <p>
          By placing an order, you grant the fulfilling vendor a limited, non-exclusive,
          non-transferable licence to use your uploaded file solely for the purpose of
          manufacturing your specific order. This licence terminates upon order completion.
          Vendors must not reproduce, distribute, or commercially exploit your design beyond
          your order.
        </p>
        <h3>6.3 DMCA Takedown Process</h3>
        <p>
          If you believe content on the Platform infringes your copyright, please send a
          notice to <a href="mailto:hemangjoshi37a@gmail.com">hemangjoshi37a@gmail.com</a> with:
        </p>
        <ul>
          <li>Your name, address, and contact details;</li>
          <li>A description of the copyrighted work you claim has been infringed;</li>
          <li>The URL or other identification of the allegedly infringing content;</li>
          <li>A statement that you have a good-faith belief that the use is not authorised;</li>
          <li>A statement that the information in the notice is accurate and, under penalty
              of perjury, that you are the copyright owner or authorised to act on behalf of
              the owner;</li>
          <li>Your electronic or physical signature.</li>
        </ul>
        <p>
          We will review valid DMCA notices and, where appropriate, remove or disable access
          to the infringing content. Counter-notices may be submitted by affected uploaders.
        </p>
        <h3>6.4 Platform Content</h3>
        <p>
          The LaserHub name, logo, and all platform-created content are the intellectual
          property of hjLabs.in. You may not copy, modify, or distribute our branding or
          platform content without prior written permission.
        </p>

        {/* ── 7. Prohibited Content ── */}
        <h2 id="prohibited-content">7. Prohibited Content and Uses</h2>
        <p>You may not use LaserHub to upload, list, order, or manufacture:</p>
        <ul>
          <li><strong>Weapons and weapon parts:</strong> Firearms, firearm components, silencers,
              conversion kits, or any item designed to harm a person;</li>
          <li><strong>Illegal items:</strong> Any product whose manufacture, sale, or possession
              is prohibited under Indian law or the law of the buyer's jurisdiction;</li>
          <li><strong>NSFW / adult content:</strong> Sexually explicit, pornographic, or
              adult-oriented designs unless the vendor has verified user age (18+) via a
              separate age-gated process approved by LaserHub;</li>
          <li><strong>Counterfeit goods:</strong> Products bearing copied trademarks, logos,
              or branding of third parties without authorisation;</li>
          <li><strong>Malicious code:</strong> Files containing viruses, malware, or any code
              intended to damage or gain unauthorised access to any system;</li>
          <li><strong>Hate content:</strong> Designs promoting discrimination, violence, or hatred
              based on race, religion, gender, sexuality, or any other protected characteristic.</li>
        </ul>
        <p>
          We reserve the right — but are not obligated — to review, reject, or remove any
          listing or order that we believe violates these prohibitions. Violations may result in
          immediate account suspension and referral to law enforcement.
        </p>

        {/* ── 8. Limitation of Liability ── */}
        <h2 id="platform-liability">8. Limitation of Liability</h2>
        <div className="policy-callout warning">
          <p>
            <strong>Zero Liability Clause:</strong> LaserHub and hjLabs.in expressly disclaim
            all liability for the quality, safety, legality, or delivery of any product or
            service provided by vendors. All such responsibility rests solely with the vendor
            and, where applicable, the buyer.
          </p>
        </div>
        <p>
          To the maximum extent permitted by applicable law, LaserHub, its owners, directors,
          employees, and affiliates shall not be liable for:
        </p>
        <ul>
          <li>Defective, damaged, or non-conforming products manufactured by vendors;</li>
          <li>Failure or delay in delivery by vendors or shipping carriers;</li>
          <li>Payment disputes between buyers and vendors;</li>
          <li>Copyright, trademark, or other IP infringement claims arising from buyer-uploaded
              design files;</li>
          <li>Any physical injury, property damage, or consequential loss arising from the
              use of a laser-cut product;</li>
          <li>Loss of data, designs, or uploaded files due to system failures;</li>
          <li>Business interruption, lost profits, or indirect, special, punitive, or
              consequential damages of any kind.</li>
        </ul>
        <p>
          <strong>Cap on Liability:</strong> In the event that a court of competent jurisdiction
          finds LaserHub or hjLabs.in liable for any claim arising from or related to the
          Platform, our total aggregate liability shall not exceed the lesser of:
        </p>
        <ul>
          <li>₹10,000 (ten thousand Indian Rupees), or</li>
          <li>The platform fee (service charge) actually paid by you to LaserHub in the
              three months preceding the claim.</li>
        </ul>
        <p>
          This limitation of liability reflects the fundamental nature of LaserHub as a
          marketplace intermediary and applies regardless of the theory of liability asserted
          (contract, tort, negligence, strict liability, or otherwise).
        </p>

        {/* ── 9. Disclaimer of Warranties ── */}
        <h2 id="disclaimer">9. Disclaimer of Warranties</h2>
        <p>
          The Platform and all content on it are provided "as is" and "as available" without
          warranties of any kind, express or implied. We specifically disclaim all implied
          warranties of merchantability, fitness for a particular purpose, title, and
          non-infringement. We do not warrant that:
        </p>
        <ul>
          <li>The Platform will be uninterrupted, error-free, or free from harmful components;</li>
          <li>Any vendor's products or services will meet your expectations;</li>
          <li>Information on the Platform is accurate, complete, or current;</li>
          <li>Defects in the Platform will be corrected within any particular timeframe.</li>
        </ul>

        {/* ── 10. Dispute Resolution ── */}
        <h2 id="dispute-resolution">10. Dispute Resolution</h2>
        <h3>10.1 Buyer–Vendor Disputes</h3>
        <p>
          All disputes regarding order quality, delivery, or fulfilment are <strong>between the
          buyer and the vendor</strong>. LaserHub is not a party to these disputes and is under no
          obligation to resolve them. Buyers and vendors are encouraged to resolve disputes
          directly through the Platform's messaging system.
        </p>
        <h3>10.2 Platform Mediation</h3>
        <p>
          If direct resolution fails, either party may request non-binding mediation by
          LaserHub by emailing{' '}
          <a href="mailto:hemangjoshi37a@gmail.com">hemangjoshi37a@gmail.com</a> with the order
          number, a description of the dispute, and any supporting evidence. LaserHub will
          attempt to facilitate a resolution within 10 business days but makes no guarantee
          of outcome. Mediation assistance by LaserHub does not imply acceptance of liability.
        </p>
        <h3>10.3 Arbitration for Claims Under ₹50,000</h3>
        <p>
          For any dispute between a user and LaserHub (not buyer–vendor disputes) involving
          an amount of ₹50,000 or less, the parties agree to submit the dispute to binding
          arbitration under the Arbitration and Conciliation Act, 1996 (India) before a
          mutually agreed sole arbitrator. The seat of arbitration shall be Ahmedabad, Gujarat,
          India. The language of arbitration shall be English or Gujarati. The arbitrator's
          decision shall be final and binding.
        </p>
        <h3>10.4 Claims Above ₹50,000</h3>
        <p>
          Claims exceeding ₹50,000 shall be subject to the exclusive jurisdiction of the
          courts in Gujarat, India (see Section 12).
        </p>

        {/* ── 11. Account Suspension ── */}
        <h2 id="account-suspension">11. Account Suspension and Termination</h2>
        <p>
          LaserHub reserves the right to suspend, restrict, or permanently terminate any
          account at any time, at our sole discretion, with or without cause and with or
          without prior notice. Grounds for suspension include (but are not limited to):
        </p>
        <ul>
          <li>Violation of any provision of these Terms;</li>
          <li>Fraudulent activity or misrepresentation;</li>
          <li>Repeated buyer complaints or negative reviews against a vendor;</li>
          <li>Chargeback abuse by a buyer;</li>
          <li>Uploading prohibited content;</li>
          <li>Any activity that, in LaserHub's sole judgment, is harmful to other users,
              vendors, or the Platform's reputation.</li>
        </ul>
        <p>
          Upon termination, your right to access the Platform ceases immediately. Outstanding
          vendor payouts may be withheld pending investigation of any suspected violations.
          LaserHub shall not be liable to you for any losses resulting from the suspension or
          termination of your account.
        </p>

        {/* ── 12. Governing Law ── */}
        <h2 id="governing-law">12. Governing Law</h2>
        <p>
          These Terms are governed by and construed in accordance with the laws of India,
          without regard to its conflict-of-law principles. For disputes that proceed to
          court (per Section 10.4), both parties submit to the exclusive jurisdiction of
          the civil courts located in Gujarat, India.
        </p>

        {/* ── 13. Modifications ── */}
        <h2 id="modifications">13. Modifications to Terms</h2>
        <p>
          We may update these Terms at any time. When we make material changes, we will post
          the revised Terms on this page and update the "Last updated" date. We will also
          attempt to notify registered users by email at least <strong>30 days before</strong>{' '}
          material changes take effect.
        </p>
        <p>
          Your continued use of the Platform after the effective date of revised Terms
          constitutes your acceptance of those changes. If you do not agree to the updated
          Terms, you must stop using the Platform before the effective date.
        </p>

        {/* ── 14. Contact ── */}
        <h2 id="contact">14. Contact Us</h2>
        <p>
          Questions about these Terms of Service? Reach us at:
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
