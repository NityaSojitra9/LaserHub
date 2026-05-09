"""
Invoice PDF generator.

Primary path: Jinja2 template + WeasyPrint (if installed).
Fallback: ReportLab Platypus — pure Python, no system deps.

Exposes:
    generate_invoice_pdf(invoice, line_items) -> bytes
    amount_to_words_inr(amount: Decimal) -> str
"""

from __future__ import annotations

import io
import logging
import os
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Iterable, List, Optional

logger = logging.getLogger(__name__)

# -----------------------------
# Optional dependencies
# -----------------------------
try:
    import weasyprint  # type: ignore
    _HAS_WEASYPRINT = True
except Exception:  # pragma: no cover — WeasyPrint has C deps; fall back silently
    weasyprint = None  # type: ignore
    _HAS_WEASYPRINT = False

try:
    from jinja2 import Environment, FileSystemLoader, select_autoescape  # type: ignore
    _HAS_JINJA = True
except Exception:
    Environment = None  # type: ignore
    _HAS_JINJA = False

try:
    from num2words import num2words  # type: ignore
    _HAS_NUM2WORDS = True
except Exception:
    num2words = None  # type: ignore
    _HAS_NUM2WORDS = False


# -----------------------------
# Amount-in-words helper
# -----------------------------
def _manual_inr_to_words(amount: Decimal) -> str:
    """Fallback INR → words converter (Indian numbering system, lakh/crore)."""
    amount = Decimal(amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    rupees = int(amount)
    paise = int((amount - rupees) * 100)

    ones = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
        "Sixteen", "Seventeen", "Eighteen", "Nineteen",
    ]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    def _two(n: int) -> str:
        if n < 20:
            return ones[n]
        return (tens[n // 10] + (" " + ones[n % 10] if n % 10 else "")).strip()

    def _three(n: int) -> str:
        parts = []
        if n >= 100:
            parts.append(ones[n // 100] + " Hundred")
            n %= 100
        if n:
            parts.append(_two(n))
        return " ".join(parts).strip()

    def _rupees_words(n: int) -> str:
        if n == 0:
            return "Zero"
        crore = n // 10000000
        n %= 10000000
        lakh = n // 100000
        n %= 100000
        thousand = n // 1000
        n %= 1000
        hundred = n

        chunks = []
        if crore:
            chunks.append(_three(crore) + " Crore")
        if lakh:
            chunks.append(_two(lakh) + " Lakh")
        if thousand:
            chunks.append(_two(thousand) + " Thousand")
        if hundred:
            chunks.append(_three(hundred))
        return " ".join(chunks).strip()

    rupees_part = _rupees_words(rupees) + " Rupees"
    if paise:
        return f"{rupees_part} and {_two(paise)} Paise Only"
    return rupees_part + " Only"


def amount_to_words_inr(amount: Decimal | float | int | str) -> str:
    """Convert a numeric amount to its Indian-English words form.

    Example:
        1234.56 -> 'One Thousand Two Hundred Thirty Four Rupees and Fifty Six Paise Only'
    """
    try:
        dec = Decimal(str(amount))
    except Exception:
        dec = Decimal("0")

    if _HAS_NUM2WORDS:
        try:
            dec = dec.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            rupees = int(dec)
            paise = int((dec - rupees) * 100)
            rupees_words = num2words(rupees, lang="en_IN").title()
            result = f"{rupees_words} Rupees"
            if paise:
                paise_words = num2words(paise, lang="en_IN").title()
                result = f"{result} and {paise_words} Paise Only"
            else:
                result = f"{result} Only"
            return result
        except Exception:
            pass

    return _manual_inr_to_words(dec)


# -----------------------------
# Public API
# -----------------------------
def generate_invoice_pdf(invoice: Any, line_items: Iterable[Any]) -> bytes:
    """Return PDF bytes for the given invoice and its line items.

    Accepts SQLAlchemy ORM instances or any objects exposing the same
    attribute names as ``Invoice`` / ``InvoiceLineItem``.
    """
    items = list(line_items or [])

    if _HAS_WEASYPRINT and _HAS_JINJA:
        try:
            return _render_with_weasyprint(invoice, items)
        except Exception as e:  # pragma: no cover — fall back gracefully
            logger.warning("WeasyPrint failed, falling back to ReportLab: %s", e)

    return _render_with_reportlab(invoice, items)


# -----------------------------
# WeasyPrint path
# -----------------------------
def _render_with_weasyprint(invoice: Any, items: List[Any]) -> bytes:
    template_dir = os.path.dirname(__file__)
    env = Environment(
        loader=FileSystemLoader(template_dir),
        autoescape=select_autoescape(["html", "xml"]),
    )
    template = env.get_template("invoice_pdf_template.html")

    ctx = _build_context(invoice, items)
    html = template.render(**ctx)
    pdf_bytes = weasyprint.HTML(string=html).write_pdf()  # type: ignore[union-attr]
    return pdf_bytes


# -----------------------------
# ReportLab fallback
# -----------------------------
def _render_with_reportlab(invoice: Any, items: List[Any]) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import (
        SimpleDocTemplate,
        Paragraph,
        Spacer,
        Table,
        TableStyle,
    )

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
        title=f"Invoice {getattr(invoice, 'invoice_number', '')}",
    )

    styles = getSampleStyleSheet()
    base = styles["Normal"]
    base.fontSize = 9
    base.leading = 11

    h1 = ParagraphStyle(
        "h1",
        parent=styles["Heading1"],
        fontSize=16,
        textColor=colors.HexColor("#0ea5e9"),
        spaceAfter=2,
    )
    h_right = ParagraphStyle(
        "h_right", parent=h1, alignment=2, fontSize=18,
        textColor=colors.HexColor("#111827"),
    )
    small = ParagraphStyle("small", parent=base, fontSize=8, leading=10, textColor=colors.HexColor("#374151"))
    small_right = ParagraphStyle("small_right", parent=small, alignment=2)
    label = ParagraphStyle("label", parent=base, fontSize=8, textColor=colors.HexColor("#6b7280"))
    bold = ParagraphStyle("bold", parent=base, fontName="Helvetica-Bold")
    bold_right = ParagraphStyle("bold_right", parent=bold, alignment=2)
    footer = ParagraphStyle("footer", parent=small, alignment=1, textColor=colors.HexColor("#6b7280"))

    story: List[Any] = []

    # ---------- Header: seller vs TAX INVOICE ----------
    seller_name = _text(getattr(invoice, "seller_name", "") or "LaserHub")
    seller_lines = []
    if getattr(invoice, "seller_address", None):
        seller_lines.append(_text(invoice.seller_address).replace("\n", "<br/>"))
    if getattr(invoice, "seller_gstin", None):
        seller_lines.append(f"GSTIN: {_text(invoice.seller_gstin)}")
    if getattr(invoice, "seller_pan", None):
        seller_lines.append(f"PAN: {_text(invoice.seller_pan)}")
    contact_bits = []
    if getattr(invoice, "seller_email", None):
        contact_bits.append(_text(invoice.seller_email))
    if getattr(invoice, "seller_phone", None):
        contact_bits.append(_text(invoice.seller_phone))
    if contact_bits:
        seller_lines.append(" · ".join(contact_bits))

    left_cell = [Paragraph(seller_name, h1)] + [Paragraph(ln, small) for ln in seller_lines]

    right_cell = [
        Paragraph("TAX INVOICE", h_right),
        Paragraph(
            f"<b>#{_text(getattr(invoice, 'invoice_number', ''))}</b>",
            small_right,
        ),
        Paragraph(
            f"Date: {_fmt_date(getattr(invoice, 'invoice_date', None))}",
            small_right,
        ),
    ]
    if getattr(invoice, "due_date", None):
        right_cell.append(
            Paragraph(f"Due: {_fmt_date(invoice.due_date)}", small_right)
        )
    right_cell.append(
        Paragraph(
            f"Status: <b>{_text(getattr(invoice, 'status', '') or '').upper()}</b>",
            small_right,
        )
    )

    header_tbl = Table([[left_cell, right_cell]], colWidths=[110 * mm, 70 * mm])
    header_tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(header_tbl)
    story.append(Spacer(1, 6))
    story.append(_hr())
    story.append(Spacer(1, 6))

    # ---------- Bill To / Ship To ----------
    def _party_block(title: str, name: str, address: str, gstin: str, state: str,
                     state_code: str, email: str, phone: str) -> List[Any]:
        lines = [Paragraph(title, label), Paragraph(_text(name) or "-", bold)]
        if address:
            lines.append(Paragraph(_text(address).replace("\n", "<br/>"), small))
        meta = []
        if state:
            meta.append(f"State: {_text(state)}{f' ({_text(state_code)})' if state_code else ''}")
        if gstin:
            meta.append(f"GSTIN: {_text(gstin)}")
        for m in meta:
            lines.append(Paragraph(m, small))
        contact = []
        if email:
            contact.append(_text(email))
        if phone:
            contact.append(_text(phone))
        if contact:
            lines.append(Paragraph(" · ".join(contact), small))
        return lines

    buyer_block = _party_block(
        "BILL TO",
        getattr(invoice, "buyer_name", "") or "",
        getattr(invoice, "buyer_address", "") or "",
        getattr(invoice, "buyer_gstin", "") or "",
        getattr(invoice, "buyer_state", "") or "",
        getattr(invoice, "buyer_state_code", "") or "",
        getattr(invoice, "buyer_email", "") or "",
        getattr(invoice, "buyer_phone", "") or "",
    )
    # Ship To mirrors Bill To in this schema (no separate ship fields on invoice)
    ship_block = _party_block(
        "SHIP TO",
        getattr(invoice, "buyer_name", "") or "",
        getattr(invoice, "buyer_address", "") or "",
        "",
        getattr(invoice, "buyer_state", "") or "",
        getattr(invoice, "buyer_state_code", "") or "",
        "",
        getattr(invoice, "buyer_phone", "") or "",
    )

    parties = Table(
        [[buyer_block, ship_block]],
        colWidths=[90 * mm, 90 * mm],
    )
    parties.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (0, 0), 0.5, colors.HexColor("#d1d5db")),
        ("BOX", (1, 0), (1, 0), 0.5, colors.HexColor("#d1d5db")),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(parties)
    story.append(Spacer(1, 8))

    # ---------- Place of supply / reverse charge ----------
    supply_bits = []
    pos = getattr(invoice, "place_of_supply", None)
    pos_code = getattr(invoice, "place_of_supply_code", None)
    if pos or pos_code:
        supply_bits.append(
            f"<b>Place of Supply:</b> {_text(pos or '')}{f' ({_text(pos_code)})' if pos_code else ''}"
        )
    supply_bits.append(
        f"<b>Reverse Charge:</b> {'Yes' if getattr(invoice, 'reverse_charge', False) else 'No'}"
    )
    supply_bits.append(
        f"<b>Interstate:</b> {'Yes' if getattr(invoice, 'is_interstate', False) else 'No'}"
    )
    story.append(Paragraph(" &nbsp; · &nbsp; ".join(supply_bits), small))
    story.append(Spacer(1, 6))

    # ---------- Line items table ----------
    headers = [
        "Sr", "Description", "HSN/SAC", "Qty", "Unit Price",
        "Disc %", "Taxable", "CGST", "SGST", "IGST", "Total",
    ]
    rows: List[List[Any]] = [headers]
    for idx, li in enumerate(items, start=1):
        cgst_cell = f"{_num(getattr(li, 'cgst_rate', 0))}%\n{_money(getattr(li, 'cgst_amount', 0))}"
        sgst_cell = f"{_num(getattr(li, 'sgst_rate', 0))}%\n{_money(getattr(li, 'sgst_amount', 0))}"
        igst_cell = f"{_num(getattr(li, 'igst_rate', 0))}%\n{_money(getattr(li, 'igst_amount', 0))}"
        rows.append([
            str(idx),
            Paragraph(_text(getattr(li, "description", "")) or "-", base),
            _text(getattr(li, "hsn_sac_code", "")) or "-",
            f"{_num(getattr(li, 'quantity', 0))}\n{_text(getattr(li, 'unit', '') or '')}",
            _money(getattr(li, "unit_price", 0)),
            _num(getattr(li, "discount_percent", 0)),
            _money(getattr(li, "taxable_value", 0)),
            cgst_cell,
            sgst_cell,
            igst_cell,
            _money(getattr(li, "total_amount", 0)),
        ])

    if len(rows) == 1:
        rows.append(["", Paragraph("<i>No line items</i>", small), "", "", "", "", "", "", "", "", ""])

    col_widths = [
        8 * mm, 42 * mm, 16 * mm, 14 * mm, 18 * mm,
        12 * mm, 18 * mm, 14 * mm, 14 * mm, 14 * mm, 20 * mm,
    ]
    items_tbl = Table(rows, colWidths=col_widths, repeatRows=1)
    items_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0ea5e9")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("ALIGN", (3, 1), (-1, -1), "RIGHT"),
        ("ALIGN", (0, 1), (0, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#d1d5db")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(items_tbl)
    story.append(Spacer(1, 10))

    # ---------- Totals ----------
    totals_rows = [
        ["Subtotal", _money(getattr(invoice, "subtotal", 0))],
    ]
    if _as_dec(getattr(invoice, "discount_amount", 0)) > 0:
        totals_rows.append(["Discount", f"- {_money(invoice.discount_amount)}"])
    totals_rows.append(["Taxable Amount", _money(getattr(invoice, "taxable_amount", 0))])
    if _as_dec(getattr(invoice, "cgst_amount", 0)) > 0:
        totals_rows.append(["CGST", _money(invoice.cgst_amount)])
    if _as_dec(getattr(invoice, "sgst_amount", 0)) > 0:
        totals_rows.append(["SGST", _money(invoice.sgst_amount)])
    if _as_dec(getattr(invoice, "igst_amount", 0)) > 0:
        totals_rows.append(["IGST", _money(invoice.igst_amount)])
    if _as_dec(getattr(invoice, "round_off", 0)) != 0:
        totals_rows.append(["Round Off", _money(invoice.round_off)])
    totals_rows.append(["Grand Total", _money(getattr(invoice, "total_amount", 0))])

    totals_tbl = Table(totals_rows, colWidths=[40 * mm, 35 * mm], hAlign="RIGHT")
    totals_tbl.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("LINEABOVE", (0, -1), (-1, -1), 1.0, colors.HexColor("#0ea5e9")),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#f0f9ff")),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(totals_tbl)
    story.append(Spacer(1, 8))

    # ---------- Amount in words ----------
    words = getattr(invoice, "amount_in_words", None) or amount_to_words_inr(
        _as_dec(getattr(invoice, "total_amount", 0))
    )
    story.append(Paragraph(f"<b>Amount in Words:</b> {_text(words)}", small))
    story.append(Spacer(1, 10))

    # ---------- Terms / Notes ----------
    if getattr(invoice, "notes", None):
        story.append(Paragraph("<b>Notes</b>", bold))
        story.append(Paragraph(_text(invoice.notes).replace("\n", "<br/>"), small))
        story.append(Spacer(1, 6))
    if getattr(invoice, "terms_and_conditions", None):
        story.append(Paragraph("<b>Terms &amp; Conditions</b>", bold))
        story.append(Paragraph(_text(invoice.terms_and_conditions).replace("\n", "<br/>"), small))
        story.append(Spacer(1, 6))

    # ---------- Signature + footer ----------
    sig_tbl = Table(
        [[
            Paragraph("", small),
            Paragraph(
                f"<br/><br/>For <b>{_text(getattr(invoice, 'seller_name', '') or 'LaserHub')}</b>"
                f"<br/><br/>_________________________<br/>Authorised Signatory",
                small_right,
            ),
        ]],
        colWidths=[110 * mm, 70 * mm],
    )
    sig_tbl.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(Spacer(1, 12))
    story.append(sig_tbl)
    story.append(Spacer(1, 12))
    story.append(_hr())
    story.append(Paragraph("This is a computer-generated invoice and does not require a physical signature.", footer))

    doc.build(story)
    return buf.getvalue()


# -----------------------------
# Template context (for WeasyPrint path)
# -----------------------------
def _build_context(invoice: Any, items: List[Any]) -> dict:
    return {
        "invoice": invoice,
        "line_items": items,
        "amount_in_words": (
            getattr(invoice, "amount_in_words", None)
            or amount_to_words_inr(_as_dec(getattr(invoice, "total_amount", 0)))
        ),
        "fmt_money": _money,
        "fmt_num": _num,
        "fmt_date": _fmt_date,
    }


# -----------------------------
# Small helpers
# -----------------------------
def _as_dec(v: Any) -> Decimal:
    if v is None:
        return Decimal("0")
    try:
        return Decimal(str(v))
    except Exception:
        return Decimal("0")


def _money(v: Any) -> str:
    d = _as_dec(v).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    # Indian digit grouping (lakh/crore)
    sign = "-" if d < 0 else ""
    d = abs(d)
    int_part, frac_part = f"{d:.2f}".split(".")
    if len(int_part) > 3:
        head, tail = int_part[:-3], int_part[-3:]
        # insert commas every 2 digits from the right of `head`
        groups: List[str] = []
        while len(head) > 2:
            groups.insert(0, head[-2:])
            head = head[:-2]
        if head:
            groups.insert(0, head)
        int_part = ",".join(groups) + "," + tail
    return f"{sign}Rs. {int_part}.{frac_part}"


def _num(v: Any) -> str:
    d = _as_dec(v)
    if d == d.to_integral():
        return str(int(d))
    # strip trailing zeros
    return format(d.normalize(), "f")


def _text(v: Optional[Any]) -> str:
    if v is None:
        return ""
    s = str(v)
    # minimal escaping for reportlab paragraphs
    return (
        s.replace("&", "&amp;")
         .replace("<", "&lt;")
         .replace(">", "&gt;")
    )


def _fmt_date(v: Any) -> str:
    if v is None:
        return ""
    try:
        return v.strftime("%d %b %Y")
    except Exception:
        return str(v)


def _hr():
    from reportlab.lib import colors
    from reportlab.platypus import Table, TableStyle
    t = Table([[""]], colWidths=[180], rowHeights=[0.5])
    t.setStyle(TableStyle([("LINEABOVE", (0, 0), (-1, 0), 0.75, colors.HexColor("#e5e7eb"))]))
    return t
