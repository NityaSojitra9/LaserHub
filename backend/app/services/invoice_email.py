"""
Send invoices as PDF email attachments.

Reuses SMTP settings from :mod:`app.core.config`. Fails softly if SMTP is
not configured (returns False and logs — never raises).
"""

from __future__ import annotations

import logging
from email.message import EmailMessage
from typing import Any, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    import aiosmtplib  # type: ignore
except Exception:
    aiosmtplib = None  # type: ignore


_DEFAULT_BODY_HTML = """\
<div style="font-family:Arial,sans-serif;color:#111;max-width:560px;margin:auto;padding:12px;">
  <h2 style="color:#0ea5e9;margin:0 0 12px;">Your Invoice from {seller}</h2>
  <p>Dear {buyer},</p>
  <p>{intro}</p>
  <ul style="line-height:1.6;padding-left:18px;">
    <li><strong>Invoice #:</strong> {number}</li>
    <li><strong>Date:</strong> {date}</li>
    <li><strong>Amount Due:</strong> {amount}</li>
  </ul>
  <p>A PDF copy of your tax invoice is attached to this email for your records.</p>
  {custom}
  <p style="margin-top:20px;">Thanks,<br/>{seller}</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
  <p style="font-size:11px;color:#6b7280;">
    This is an automated message from LaserHub. If you have any questions about this
    invoice, please reply to this email.
  </p>
</div>
"""


def _fmt_amount(v: Any) -> str:
    try:
        return f"Rs. {float(v):,.2f}"
    except Exception:
        return str(v) if v is not None else "-"


def _fmt_date(v: Any) -> str:
    if v is None:
        return "-"
    try:
        return v.strftime("%d %b %Y")
    except Exception:
        return str(v)


async def send_invoice_email(
    invoice: Any,
    pdf_bytes: bytes,
    to: Optional[str] = None,
    custom_message: Optional[str] = None,
) -> bool:
    """Send ``invoice`` as a PDF attachment to ``to`` (or ``invoice.buyer_email``).

    Returns True on success, False otherwise. Never raises.
    """
    recipient = (to or getattr(invoice, "buyer_email", None) or "").strip()
    if not recipient:
        logger.warning("invoice_email.no_recipient", extra={"invoice": getattr(invoice, "invoice_number", None)})
        return False

    # Dev / mock path
    smtp_server = getattr(settings, "SMTP_SERVER", "") or ""
    if not smtp_server or smtp_server == "mock":
        logger.info(
            "MOCK EMAIL: invoice %s to %s (SMTP not configured)",
            getattr(invoice, "invoice_number", "?"),
            recipient,
        )
        return True

    if aiosmtplib is None:
        logger.warning("invoice_email.aiosmtplib_missing")
        return False

    invoice_number = getattr(invoice, "invoice_number", "") or "INV"
    seller = getattr(invoice, "seller_name", None) or "LaserHub"
    buyer = getattr(invoice, "buyer_name", None) or "Customer"

    subject = f"Invoice {invoice_number} from {seller}"
    intro = (
        "Please find your tax invoice attached. "
        "The details are summarised below."
    )
    custom_html = ""
    if custom_message:
        # custom_message is user-supplied — escape minimally and wrap in a paragraph
        safe = (
            custom_message.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        )
        custom_html = f'<p style="background:#f0f9ff;padding:10px;border-radius:4px;">{safe}</p>'

    html = _DEFAULT_BODY_HTML.format(
        seller=seller,
        buyer=buyer,
        intro=intro,
        number=invoice_number,
        date=_fmt_date(getattr(invoice, "invoice_date", None)),
        amount=_fmt_amount(getattr(invoice, "total_amount", 0)),
        custom=custom_html,
    )

    message = EmailMessage()
    message["From"] = getattr(settings, "SMTP_FROM_EMAIL", "noreply@laserhub.com")
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(
        f"Your invoice {invoice_number} is attached as a PDF. "
        f"Amount due: {_fmt_amount(getattr(invoice, 'total_amount', 0))}."
    )
    message.add_alternative(html, subtype="html")
    message.add_attachment(
        pdf_bytes,
        maintype="application",
        subtype="pdf",
        filename=f"{invoice_number}.pdf",
    )

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_SERVER,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER or None,
            password=settings.SMTP_PASSWORD or None,
            use_tls=settings.SMTP_TLS,
        )
        logger.info("invoice_email.sent", extra={"invoice": invoice_number, "to": recipient})
        return True
    except Exception as e:
        logger.error(
            "invoice_email.failed invoice=%s to=%s err=%s",
            invoice_number, recipient, e,
        )
        return False
