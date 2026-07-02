type AiAction =
  | "quote_description"
  | "rewrite_description"
  | "pricing_suggestion"
  | "summarize_client_notes"
  | "follow_up_email"
  | "reminder_email"
  | "suggest_products"
  | "marketing_text";

interface AiRequest {
  action: AiAction;
  input: string;
  context?: Record<string, unknown>;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const prompts: Record<AiAction, string> = {
  quote_description: "Create a concise, premium SaaS quote line-item description. Include business value and implementation clarity.",
  rewrite_description: "Rewrite the supplied quote description in a professional, buyer-ready tone. Keep facts intact.",
  pricing_suggestion: "Suggest a commercially sensible price, discount range, and margin rationale. Return practical guidance.",
  summarize_client_notes: "Summarize client notes into risks, needs, buying signals, and next action.",
  follow_up_email: "Write a polished follow-up email for a sent quote. Be concise and helpful.",
  reminder_email: "Write a friendly quote reminder email with a clear next step.",
  suggest_products: "Suggest relevant products to add to the quote. Explain why each product fits.",
  marketing_text: "Create high-converting marketing text for the product or quote package.",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return Response.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500, headers: corsHeaders });
  }

  const body = (await request.json()) as AiRequest;
  if (!body.action || !prompts[body.action] || !body.input?.trim()) {
    return Response.json({ error: "A valid action and input are required" }, { status: 400, headers: corsHeaders });
  }

  const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-5";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify({
      model,
      reasoning: { effort: "low" },
      instructions: [
        "You are SmartQuote AI, a senior SaaS quoting assistant.",
        "Return immediately usable business copy. Avoid markdown tables unless asked.",
        prompts[body.action],
      ].join("\n"),
      input: JSON.stringify({ request: body.input, context: body.context ?? {} }),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return Response.json({ error: errorText }, { status: response.status, headers: corsHeaders });
  }

  const result = await response.json();
  const output = result.output_text ?? result.output?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content ?? []).map((item: { text?: string }) => item.text).filter(Boolean).join("\n") ?? "";

  return Response.json({ output }, { headers: corsHeaders });
});
