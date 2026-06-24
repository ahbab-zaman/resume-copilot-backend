import { env } from "../../config/env";

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_TITLE = "AI Resume Copilot";

function buildHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${env.OPEN_ROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": env.FRONTEND_URL,
    "X-OpenRouter-Title": OPENROUTER_TITLE,
  };
}

export async function generateWithOpenRouterModel(
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `OpenRouter request failed for ${model} with status ${response.status}${
        body.trim().length > 0 ? `: ${body.trim().slice(0, 240)}` : ""
      }`,
    );
  }

  const payload = (await response.json()) as OpenRouterResponse;
  const text = payload.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error(`OpenRouter returned an empty response for ${model}`);
  }

  return text;
}

export async function generateWithOpenRouter(
  models: string[],
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  let lastError: unknown = new Error("OpenRouter returned no response");

  for (const model of models) {
    try {
      return await generateWithOpenRouterModel(model, systemPrompt, userPrompt);
    } catch (error: unknown) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error(String(lastError));
}
