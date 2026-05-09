import React from 'react';
import { Calendar, Printer } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const RefundPolicyPage: React.FC = () => {
  useDocumentTitle('Refund Policy — LaserHub');
  const handlePrint = () => window.print();
  const tocItems = [
    { id: 'overview', label: '1. Overview' },
    { id: 'responsibility-table', label: '2. Responsibility Table' },
    { id: 'non-refundable', label: '3. Non-Refundable Items' },
    { id: 'eligibility', label: '4. Refund Eligibility' },
    { id: 'timeframes', label: '5. Request Timeframes' },
    { id: 'how-to-request', label: '6. How to Request a Refund' },
    { id: 'vendor-process', label: '7. Vendor Refund Process' },
    { id: 'platform-mediation', label: '8. Platform Mediation' },
    { id: 'chargebacks', label: '9. Chargebacks' },
    { id: 'cancellations', label: '10. Order Cancellations' },
    { id: 'processing', label: '11. Refund Processing' },
    { id: 'changes', label: '12. Changes to Policy' },
    { id: 'contact', label: '13. Contact Us' },
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
          <h1>Refund Policy</h1>
          <button className="legal-print-btn" onClick={handlePrint} aria-label="Print">
            <Printer size={14} /> Print
          </button>
        </div>
        <p className="policy-updated legal-updated">
          <Calendar size={14} /> Last updated: April 1, 2026
        </p>

        {/* ── 1. Overview ── */}
        <h2 id="overview">1. Overview</h2>
        <div className="policy-callout warning">
          <p>
            <strong>LaserHub is a marketplace intermediary.</strong> We do not manufacture,
            ship, or hold inventory. All refund obligations rest with the individual vendor who
            accepted your order. LaserHub may facilitate communication and provide mediation
            assistance but does not guarantee refund outcomes.
          </p>
        </div>
        <p>
          This Refund Policy outlines the terms and conditions under which buyers may request
          refunds on the LaserHub platform (laserhub.hjlabs.in), operated by hjLabs.in. When
          you place an order on LaserHub, your purchase contract is with the vendor — not with
          LaserHub. Accordingly, the vendor bears primary responsibility for resolving refund
          and return requests.
        </p>

        {/* ── 2. Responsibility Table ── */}
        <h2 id="responsibility-table">2. Who Is Responsible — Quick Reference</h2>
        <div className="policy-table-wrap">
          <table className="policy-table">
            <thead>
              <tr>
                <th>Issue</th>
                <th>Who Is Responsible</th>
                <th>Resolution Path</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Defective or damaged product</td>
                <td>Vendor</td>
                <td>Contact vendor → vendor resolves or replaces within 7 days of complaint</td>
              </tr>
              <tr>
                <td>Wrong item / wrong material delivered</td>
                <td>Vendor</td>
                <td>Contact vendor → full re-make or refund at vendor's cost</td>
              </tr>
              <tr>
                <td>Order not delivered (lost in shipping)</td>
                <td>Vendor (for goods in transit) / Carrier</td>
                <td>Contact vendor after estimated delivery date + 7 days grace period</td>
              </tr>
              <tr>
                <td>Buyer-provided incorrect design file</td>
                <td>Buyer</td>
                <td>No refund; buyer may re-order with corrected file</td>
              </tr>
              <tr>
                <td>Buyer change of mind after production starts</td>
                <td>Buyer</td>
                <td>No refund; partial credit at vendor's discretion only</td>
              </tr>
              <tr>
                <td>Digital design file downloaded</td>
                <td>Buyer (non-refundable)</td>
                <td>No refund once downloaded</td>
              </tr>
              <tr>
                <td>Vendor does not respond to refund request</td>
                <td>Vendor (non-responsive)</td>
                <td>Escalate to LaserHub mediation after 7 days of no response</td>
              </tr>
              <tr>
                <td>Payment processing error / double charge</td>
                <td>LaserHub / Payment processor</td>
                <td>Contact LaserHub directly; resolved within 5 business days</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── 3. Non-Refundable Items ── */}
        <h2 id="non-refundable">3. Non-Refundable Items</h2>
        <p>The following are expressly non-refundable under this policy:</p>
        <ul>
          <li>
            <strong>Digital design files (SVG, DXF, AI, PDF, etc.):</strong> Once a digital
            file has been downloaded or made available for download, the sale is final and no
            refund will be issued, regardless of reason.
          </li>
          <li>
            <strong>Custom laser-cut items produced to specification:</strong> Items manufactured
            exactly in accordance with the buyer's approved design file are non-refundable
            unless they are defective or materially non-conforming.
          </li>
          <li>
            <strong>Buyer-error orders:</strong> Orders where the defect, error, or
            non-conformity is attributable to an incorrect file, wrong dimensions, or
            inaccurate specifications provided by the buyer.
          </li>
          <li>
            <strong>Change-of-mind requests:</strong> Requests made solely because the buyer
            changed their mind after the vendor began production or shipped the order.
          </li>
          <li>
            <strong>Minor variations within tolerance:</strong> Slight variations in colour,
            texture, or finish inherent to the laser cutting process and within
            industry-standard tolerances (typically ±0.1 mm dimensional tolerance) are not
            defects and are not grounds for a refund.
          </li>
          <li>
            <strong>Platform fees and service charges:</strong> The LaserHub platform fee
            (service charge) is non-refundable regardless of the outcome of a buyer–vendor
            dispute, except in cases of a verified payment processing error attributable to
            LaserHub.
          </li>
        </ul>

        {/* ── 4. Eligibility ── */}
        <h2 id="eligibility">4. Refund Eligibility</h2>
        <p>A refund request may be eligible if:</p>
        <ul>
          <li>
            <strong>Defective product:</strong> The item received has a clear manufacturing
            defect, material flaw, or production damage not present in the buyer's design file.
          </li>
          <li>
            <strong>Wrong item delivered:</strong> The vendor delivered the wrong material,
            wrong design, or wrong quantity compared to what was agreed in the order.
          </li>
          <li>
            <strong>Non-delivery:</strong> The order has not arrived more than 14 calendar days
            after the vendor's stated delivery date, and tracking (if applicable) shows no
            movement.
          </li>
          <li>
            <strong>Significant quality deviation:</strong> The product substantially and
            objectively deviates from the quality described in the vendor's listing, beyond
            normal manufacturing tolerances.
          </li>
          <li>
            <strong>Shipping damage:</strong> The item was damaged in transit, provided the
            buyer submits photographic evidence within 48 hours of delivery.
          </li>
        </ul>

        {/* ── 5. Timeframes ── */}
        <h2 id="timeframes">5. Request Timeframes</h2>
        <p>
          Refund requests must be submitted within the following windows. Requests submitted
          outside these windows will not be considered unless exceptional circumstances are
          demonstrated:
        </p>
        <ul>
          <li><strong>Defective or wrong items:</strong> Within 7 calendar days of delivery.</li>
          <li><strong>Shipping damage:</strong> Within 48 hours of delivery, with photographs.</li>
          <li>
            <strong>Non-delivery:</strong> No earlier than 14 calendar days and no later than
            30 calendar days after the vendor's stated delivery date.
          </li>
          <li>
            <strong>Significant quality issues:</strong> Within 7 calendar days of delivery.
          </li>
        </ul>

        {/* ── 6. How to Request ── */}
        <h2 id="how-to-request">6. How to Request a Refund</h2>
        <p>Follow these steps in order:</p>
        <ol style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          <li style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
            <strong>Contact the vendor first</strong> through the Platform's messaging system.
            Include your order number, a clear description of the issue, and photographic
            evidence where applicable.
          </li>
          <li style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
            <strong>Wait 7 calendar days</strong> for the vendor to respond and propose a
            resolution.
          </li>
          <li style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
            If the vendor does not respond within 7 days, or if their proposed resolution is
            unsatisfactory, <strong>escalate to LaserHub</strong> by emailing{' '}
            <a href="mailto:hemangjoshi37a@gmail.com">hemangjoshi37a@gmail.com</a> with the
            subject line <em>"Refund Dispute — Order #[order number]"</em> and all supporting
            documentation.
          </li>
        </ol>
        <p>
          Do not initiate a chargeback before completing all steps above. See Section 9 for
          our chargeback policy.
        </p>

        {/* ── 7. Vendor Refund Process ── */}
        <h2 id="vendor-process">7. Vendor Refund Process</h2>
        <p>
          Vendors are contractually obligated to handle refund requests in good faith and
          within the following framework:
        </p>
        <ul>
          <li>
            Vendors must respond to a buyer's refund request within <strong>7 calendar
            days</strong> of the complaint being raised.
          </li>
          <li>
            Vendors may request the defective item be returned before issuing a refund.
            Return shipping costs for defective or wrong items are the vendor's responsibility.
          </li>
          <li>
            Vendors may offer a replacement, re-make, or partial refund as an alternative
            to a full refund, subject to the buyer's agreement.
          </li>
          <li>
            Once a refund or resolution is agreed upon, the vendor must initiate the
            payment or action within <strong>5 business days</strong>.
          </li>
          <li>
            Vendors who repeatedly fail to resolve legitimate refund requests may have their
            accounts suspended or permanently removed from the Platform.
          </li>
        </ul>
        <p>
          <strong>LaserHub's role in this process is limited to facilitating communication.
          The final refund decision and its execution are the vendor's responsibility.
          LaserHub does not guarantee that a vendor will issue a refund.</strong>
        </p>

        {/* ── 8. Platform Mediation ── */}
        <h2 id="platform-mediation">8. Platform Mediation</h2>
        <p>
          If a buyer–vendor dispute cannot be resolved directly, LaserHub may — at its
          sole discretion — offer mediation assistance. This process:
        </p>
        <ul>
          <li>
            Involves a review of evidence provided by both parties (photos, messages, order
            details, tracking information).
          </li>
          <li>
            May result in a non-binding recommendation from LaserHub. The final decision
            to issue or withhold a refund rests with the vendor.
          </li>
          <li>
            Does not create any obligation for LaserHub to fund or guarantee any refund.
            LaserHub will not issue a refund from its own funds on behalf of a vendor, except
            in the limited case of a verified payment processing error attributable to
            LaserHub's own systems.
          </li>
          <li>
            May take up to 10 business days from the date the dispute is escalated to
            LaserHub.
          </li>
        </ul>
        <div className="policy-callout">
          <p>
            LaserHub's mediation is a facilitation service only. We do not act as an insurer,
            guarantor, or arbitrator of vendor performance. Offering mediation in a specific
            case does not obligate LaserHub to do so in future cases.
          </p>
        </div>

        {/* ── 9. Chargebacks ── */}
        <h2 id="chargebacks">9. Chargebacks (Stripe / Razorpay)</h2>
        <p>
          When a buyer files a chargeback or payment dispute with their bank or card issuer,
          LaserHub and the vendor may incur significant fees and administrative burdens.
          Our policy on chargebacks:
        </p>
        <ul>
          <li>
            <strong>LaserHub will defend vendor interests</strong> in any chargeback case
            unless there is clear evidence of vendor fraud (e.g., the vendor knowingly
            shipped a counterfeit item or misappropriated funds).
          </li>
          <li>
            In all other cases — including dissatisfaction with quality, disputes over design
            interpretation, or late delivery — LaserHub will submit evidence to the payment
            processor supporting the validity of the original transaction.
          </li>
          <li>
            If a chargeback is filed without following the refund request steps in Section 6,
            the buyer's account may be suspended and the buyer may be liable for chargeback
            fees incurred by LaserHub or the vendor.
          </li>
          <li>
            Buyers who initiate chargebacks in bad faith or as a pattern of behaviour will
            be permanently banned from the Platform and reported to payment processors.
          </li>
        </ul>

        {/* ── 10. Cancellations ── */}
        <h2 id="cancellations">10. Order Cancellations</h2>
        <ul>
          <li>
            <strong>Before production begins:</strong> A buyer may request cancellation and
            receive a full refund (minus any payment processing fees) by contacting the vendor
            immediately after placing the order. Cancellation is not guaranteed once the vendor
            has acknowledged the order.
          </li>
          <li>
            <strong>During production:</strong> Cancellation is at the vendor's discretion.
            A partial refund may be offered, minus materials and labour already expended. The
            vendor must provide an itemised breakdown if a partial refund is proposed.
          </li>
          <li>
            <strong>After shipment:</strong> Orders cannot be cancelled once shipped. Standard
            refund eligibility criteria (Section 4) apply upon receipt of the item.
          </li>
          <li>
            <strong>Vendor-initiated cancellation:</strong> If a vendor cancels an order
            (e.g., due to stock unavailability), the buyer is entitled to a full refund
            including any platform fees paid. The vendor bears the payment processing fees
            for vendor-initiated cancellations.
          </li>
        </ul>

        {/* ── 11. Refund Processing ── */}
        <h2 id="processing">11. Refund Processing</h2>
        <ul>
          <li>
            Approved refunds are returned to the original payment method used at the time
            of order (Stripe or Razorpay).
          </li>
          <li>
            Refunds typically take <strong>5–10 business days</strong> to appear in your
            account after the vendor initiates them, depending on your bank or card issuer.
          </li>
          <li>
            Partial refunds may be issued where only part of an order is defective or
            non-conforming.
          </li>
          <li>
            LaserHub's platform fee is <strong>non-refundable</strong> unless the refund
            arises from a verified LaserHub payment processing error.
          </li>
        </ul>

        {/* ── 12. Changes ── */}
        <h2 id="changes">12. Changes to This Policy</h2>
        <p>
          We may update this Refund Policy from time to time. Material changes will be
          communicated with at least 30 days' notice via the Platform or email. The version
          of this policy in effect at the time you place an order governs that transaction.
        </p>

        {/* ── 13. Contact ── */}
        <h2 id="contact">13. Contact Us</h2>
        <p>
          For refund inquiries, dispute escalation, or general questions about this policy:
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
