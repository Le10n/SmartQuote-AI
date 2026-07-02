interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  pdfBase64?: string;
  fileName?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("QUOTE_EMAIL_FROM") ?? "SmartQuote AI <quotes@example.com>";
  if (!resendKey) {
    return Response.json({ error: "RESEND_API_KEY is not configured" }, { status: 500, headers: corsHeaders });
  }

  const body = (await request.json()) as EmailRequest;
  if (!body.to || !body.subject || !body.html) {
    return Response.json({ error: "Recipient, subject, and html are required" }, { status: 400, headers: corsHeaders });
  }

  const payload: Record<string, unknown> = {
    from,
    to: [body.to],
    subject: body.subject,
    html: body.html,
  };

  if (body.pdfBase64) {
    payload.attachments = [
      {
        filename: body.fileName ?? "quote.pdf",
        content: body.pdfBase64,
      },
    ];
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + resendKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return Response.json({ error: await response.text() }, { status: response.status, headers: corsHeaders });
  }

  return Response.json(await response.json(), { headers: corsHeaders });
});
