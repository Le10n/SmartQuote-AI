import { env } from "@/lib/env";
import type { CompanySettingsRow, QuoteWithDetails } from "@/types";
import { storageService } from "@/services/storage.service";
import { formatCurrency, formatDate } from "@/utils/formatters";

export interface PdfResult {
  fileName: string;
  dataUri: string;
  base64: string;
}

function sanitizeText(value: string | null | undefined) {
  return (value ?? "").trim();
}

export const pdfService = {
  async generateQuotePdf(quote: QuoteWithDetails, settings: CompanySettingsRow): Promise<PdfResult> {
    const [{ jsPDF }, QRCode] = await Promise.all([import("jspdf"), import("qrcode")]);
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 44;
    const contentWidth = pageWidth - margin * 2;
    const primary = settings.brand_primary || "#0f766e";
    const secondary = settings.brand_secondary || "#2563eb";
    const logoUrl = storageService.getPublicUrl("company-assets", settings.logo_path);

    function addFooter(pageNumber: number) {
      doc.setDrawColor("#e5e7eb");
      doc.line(margin, pageHeight - 46, pageWidth - margin, pageHeight - 46);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor("#6b7280");
      doc.text(settings.company_name + " · " + (settings.email_signature || "SmartQuote AI"), margin, pageHeight - 28, { maxWidth: contentWidth - 80 });
      doc.text("Page " + pageNumber, pageWidth - margin - 34, pageHeight - 28);
    }

    function ensureSpace(y: number, needed: number) {
      if (y + needed <= pageHeight - 78) return y;
      addFooter(doc.getNumberOfPages());
      doc.addPage();
      return 72;
    }

    doc.setFillColor(primary);
    doc.rect(0, 0, pageWidth, 126, "F");
    doc.setFillColor(secondary);
    doc.rect(0, 118, pageWidth, 8, "F");
    doc.setTextColor("#ffffff");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(27);
    doc.text(settings.company_name, margin, 54, { maxWidth: contentWidth - 150 });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Premium proposal prepared with SmartQuote AI", margin, 78, { maxWidth: contentWidth - 150 });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(quote.quote_number, pageWidth - margin, 52, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Created " + formatDate(quote.created_at), pageWidth - margin, 72, { align: "right" });
    doc.setFillColor("#ffffff");
    doc.roundedRect(pageWidth - margin - 94, 86, 94, 24, 12, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(primary);
    doc.text(quote.status.toUpperCase(), pageWidth - margin - 47, 101, { align: "center" });

    if (logoUrl) {
      try {
        const image = await fetch(logoUrl).then((response) => response.blob()).then((blob) => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.readAsDataURL(blob);
        }));
        doc.addImage(image, "PNG", pageWidth - margin - 76, 22, 64, 64);
      } catch {
        doc.setDrawColor("#ffffff");
        doc.roundedRect(pageWidth - margin - 58, 28, 58, 58, 8, 8);
      }
    }

    let y = 158;
    doc.setTextColor("#111827");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Quote proposal", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor("#6b7280");
    doc.text("Clear scope, pricing, tax, and terms for approval.", margin, y + 18);

    const cardTop = y + 42;
    const cardWidth = (contentWidth - 16) / 2;
    doc.setFillColor("#f8fafc");
    doc.setDrawColor("#e5e7eb");
    doc.roundedRect(margin, cardTop, cardWidth, 102, 10, 10, "FD");
    doc.roundedRect(margin + cardWidth + 16, cardTop, cardWidth, 102, 10, 10, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor("#374151");
    doc.text("Client", margin + 16, cardTop + 24);
    doc.text("Company", margin + cardWidth + 32, cardTop + 24);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor("#4b5563");
    doc.text([sanitizeText(quote.client?.company) || "Client", sanitizeText(quote.client?.contact_person), sanitizeText(quote.client?.email), sanitizeText(quote.client?.address)].filter(Boolean), margin + 16, cardTop + 44, { maxWidth: cardWidth - 32, lineHeightFactor: 1.35 });
    doc.text([settings.company_name, sanitizeText(settings.address), sanitizeText(settings.vat) ? "VAT: " + settings.vat : "", sanitizeText(settings.iban) ? "IBAN: " + settings.iban : ""].filter(Boolean), margin + cardWidth + 32, cardTop + 44, { maxWidth: cardWidth - 32, lineHeightFactor: 1.35 });

    y = cardTop + 142;
    doc.setFillColor("#111827");
    doc.roundedRect(margin, y, contentWidth, 30, 8, 8, "F");
    doc.setTextColor("#ffffff");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("ITEM", margin + 14, y + 19);
    doc.text("QTY", pageWidth - margin - 236, y + 19);
    doc.text("PRICE", pageWidth - margin - 190, y + 19);
    doc.text("DISC.", pageWidth - margin - 126, y + 19);
    doc.text("TAX", pageWidth - margin - 78, y + 19);
    doc.text("TOTAL", pageWidth - margin - 14, y + 19, { align: "right" });
    y += 42;

    doc.setFont("helvetica", "normal");
    for (const [index, item] of quote.quote_items.entries()) {
      y = ensureSpace(y, 58);
      const rowHeight = 50;
      doc.setFillColor(index % 2 === 0 ? "#f8fafc" : "#ffffff");
      doc.setDrawColor("#eef2f7");
      doc.roundedRect(margin, y - 18, contentWidth, rowHeight, 8, 8, "FD");
      doc.setTextColor("#111827");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text(item.product?.name ?? "Product", margin + 14, y, { maxWidth: contentWidth - 330 });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor("#6b7280");
      const description = doc.splitTextToSize(item.product?.description ?? "", contentWidth - 340).slice(0, 2);
      if (description.length) doc.text(description, margin + 14, y + 13, { lineHeightFactor: 1.25 });
      doc.setFontSize(9);
      doc.setTextColor("#111827");
      doc.text(String(item.quantity), pageWidth - margin - 236, y);
      doc.text(formatCurrency(item.price), pageWidth - margin - 190, y);
      doc.text(item.discount ? item.discount + "%" : "-", pageWidth - margin - 126, y);
      doc.text(item.tax + "%", pageWidth - margin - 78, y);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(item.total), pageWidth - margin - 14, y, { align: "right" });
      y += rowHeight + 8;
    }

    const discountTotal = quote.quote_items.reduce((sum, item) => sum + (item.quantity * item.price * item.discount) / 100, 0);
    const totalsHeight = discountTotal > 0 ? 136 : 112;
    y = ensureSpace(y, totalsHeight + 20);
    const totalsX = pageWidth - margin - 240;
    doc.setFillColor("#f8fafc");
    doc.setDrawColor("#e5e7eb");
    doc.roundedRect(totalsX, y, 240, totalsHeight, 10, 10, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor("#4b5563");
    let summaryY = y + 28;
    doc.text("Subtotal", totalsX + 16, summaryY);
    doc.text(formatCurrency(quote.subtotal), totalsX + 224, summaryY, { align: "right" });
    if (discountTotal > 0) {
      summaryY += 24;
      doc.text("Discounts applied", totalsX + 16, summaryY);
      doc.text(formatCurrency(discountTotal), totalsX + 224, summaryY, { align: "right" });
    }
    summaryY += 24;
    doc.text("Tax", totalsX + 16, summaryY);
    doc.text(formatCurrency(quote.tax), totalsX + 224, summaryY, { align: "right" });
    doc.setDrawColor("#d1d5db");
    doc.line(totalsX + 16, summaryY + 16, totalsX + 224, summaryY + 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(secondary);
    doc.text("Total", totalsX + 16, summaryY + 40);
    doc.text(formatCurrency(quote.total), totalsX + 224, summaryY + 40, { align: "right" });

    const appUrl = env.appUrl.endsWith("/") ? env.appUrl.slice(0, -1) : env.appUrl;
    const quoteUrl = appUrl + "/quotes?quote=" + quote.id;
    const qr = await QRCode.toDataURL(quoteUrl, { margin: 1, width: 96 });
    doc.addImage(qr, "PNG", margin, y + 16, 72, 72);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor("#6b7280");
    doc.text("Scan to open quote", margin, y + 102);
    y += 140;

    if (quote.notes) {
      y = ensureSpace(y, 86);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor("#111827");
      doc.text("Notes", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor("#4b5563");
      const notes = doc.splitTextToSize(quote.notes, contentWidth);
      doc.text(notes, margin, y + 18, { lineHeightFactor: 1.35 });
      y += Math.min(90, notes.length * 12 + 34);
    }

    y = ensureSpace(y, 96);
    doc.setFillColor("#f0fdfa");
    doc.setDrawColor("#99f6e4");
    doc.roundedRect(margin, y, contentWidth, 74, 10, 10, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primary);
    doc.text("Approval-ready summary", margin + 16, y + 24);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor("#0f172a");
    doc.text("This proposal includes clear scope, line-item pricing, tax treatment, and commercial terms prepared for fast review.", margin + 16, y + 44, { maxWidth: contentWidth - 32 });
    y += 104;

    y = ensureSpace(y, 110);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor("#111827");
    doc.text("Terms & conditions", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor("#4b5563");
    const terms = doc.splitTextToSize(settings.pdf_terms, contentWidth);
    doc.text(terms, margin, y + 18, { lineHeightFactor: 1.35 });

    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page);
      addFooter(page);
    }

    const dataUri = doc.output("datauristring");
    const base64 = dataUri.split(",")[1] ?? "";
    return { fileName: quote.quote_number + ".pdf", dataUri, base64 };
  },
  download(result: PdfResult) {
    if (typeof document === "undefined") {
      throw new Error("PDF downloads are only available in the browser.");
    }

    const link = document.createElement("a");
    link.href = result.dataUri;
    link.download = result.fileName;
    link.click();
  },
};
