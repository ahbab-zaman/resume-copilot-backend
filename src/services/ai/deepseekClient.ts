type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

function getDeepSeekApiKey(): string {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  return apiKey;
}

export async function generateWithDeepSeek(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getDeepSeekApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as DeepSeekResponse;
  const text = payload.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("DeepSeek returned an empty response");
  }

  return text;
}

