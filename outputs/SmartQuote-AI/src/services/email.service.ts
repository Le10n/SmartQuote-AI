import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import type { PdfResult } from "@/services/pdf.service";
import type { QuoteWithDetails } from "@/types";
import type { CompanySettingsRow } from "@/types/database";
import { formatCurrency } from "@/utils/formatters";

export const emailService = {
  async sendQuote(quote: QuoteWithDetails, settings: CompanySettingsRow, pdf: PdfResult) {
    const recipient = quote.client?.email;
    if (!recipient) throw new Error("The selected client does not have an email address.");

    const plainText = [
      "Hello " + (quote.client?.contact_person ?? "there") + ",",
      "",
      "Please find quote " + quote.quote_number + " from " + settings.company_name + ".",
      "Total: " + formatCurrency(quote.total),
      quote.notes ? "" : null,
      quote.notes || null,
      "",
      settings.email_signature,
    ].filter((line): line is string => line !== null).join("\n");

    if (env.demoMode) {
      if (typeof window === "undefined") return;
      const subject = encodeURIComponent("Quote " + quote.quote_number + " from " + settings.company_name);
      const body = encodeURIComponent(plainText + "\n\nPDF file: " + pdf.fileName);
      window.location.href = "mailto:" + encodeURIComponent(recipient) + "?subject=" + subject + "&body=" + body;
      return;
    }

    const html = [
      "<p>Hello " + (quote.client?.contact_person ?? "there") + ",</p>",
      "<p>Please find quote <strong>" + quote.quote_number + "</strong> attached.</p>",
      "<p>Total: <strong>" + formatCurrency(quote.total) + "</strong></p>",
      quote.notes ? "<p>" + quote.notes + "</p>" : "",
      "<p>" + settings.email_signature.replaceAll("\n", "<br />") + "</p>",
    ].join("");

    const { error } = await supabase.functions.invoke("send-quote-email", {
      body: {
        to: recipient,
        subject: "Quote " + quote.quote_number + " from " + settings.company_name,
        html,
        pdfBase64: pdf.base64,
        fileName: pdf.fileName,
      },
    });

    if (error) throw error;
  },
};
