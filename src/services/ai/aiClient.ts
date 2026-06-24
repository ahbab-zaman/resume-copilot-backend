import { z, type ZodTypeAny } from "zod";

import { logAgentEvent } from "../../utils/logger";
import { generateWithGemini } from "./geminiClient";
import { generateWithOpenRouterModel } from "./openrouterClient";

type GenerateStructuredOptions<TSchema extends ZodTypeAny> = {
  feature: string;
  systemPrompt: string;
  userPrompt: string;
  userId: string | null;
  schema: TSchema;
};

type GenerateStructuredSuccess<T> = {
  success: true;
  data: T;
  modelUsed: string;
};

type GenerateStructuredFailure = {
  success: false;
  error: string;
};

function extractJsonPayload(text: string): unknown {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const jsonText =
    fencedMatch && fencedMatch[1] ? fencedMatch[1].trim() : trimmed;
  return JSON.parse(jsonText) as unknown;
}

function validateStructuredResponse<TSchema extends ZodTypeAny>(
  text: string,
  schema: TSchema,
): z.infer<TSchema> {
  const parsed = extractJsonPayload(text);
  const validated = schema.safeParse(parsed);

  if (!validated.success) {
    throw new Error("AI returned an unexpected shape");
  }

  return validated.data;
}

async function logFailure(
  userId: string | null,
  feature: string,
  level: "warning" | "error",
  error: unknown,
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  await logAgentEvent({
    userId,
    feature,
    level,
    message,
  });
}

function summarizeAiFailure(messages: string[]): string {
  const normalized = messages.map((message) => message.toLowerCase());

  if (normalized.some((message) => message.includes("status 402"))) {
    return "AI generation failed because one provider reported a billing or quota error. Check the AI API keys and account billing.";
  }

  if (
    normalized.some(
      (message) =>
        message.includes("status 401") || message.includes("status 403"),
    )
  ) {
    return "AI generation failed because one provider rejected the request. Check the AI API keys and account permissions.";
  }

  if (
    normalized.some(
      (message) =>
        message.includes("status 503") ||
        message.includes("status 502") ||
        message.includes("status 504") ||
        message.includes("timed out"),
    )
  ) {
    return "AI generation failed because the provider is temporarily unavailable. Please try again shortly.";
  }

  if (messages.length > 0) {
    return `AI generation failed: ${messages.join(" | ")}`;
  }

  return "AI generation failed. Please try again shortly.";
}

const OPENROUTER_MODELS = {
  atsAnalysis: [
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "qwen/qwen3-coder:free",
  ],
  default: ["qwen/qwen3-next-80b-a3b-instruct:free", "qwen/qwen3-coder:free"],
} as const;

function getOpenRouterModels(feature: string): readonly string[] {
  if (feature === "ats-analysis") {
    return OPENROUTER_MODELS.atsAnalysis;
  }

  return OPENROUTER_MODELS.default;
}

export async function generateStructured<TSchema extends ZodTypeAny>(
  options: GenerateStructuredOptions<TSchema>,
): Promise<
  GenerateStructuredSuccess<z.infer<TSchema>> | GenerateStructuredFailure
> {
  const failureMessages: string[] = [];

  try {
    const geminiText = await generateWithGemini(
      options.systemPrompt,
      options.userPrompt,
    );
    const data = validateStructuredResponse(geminiText, options.schema);

    return {
      success: true,
      data,
      modelUsed: "gemini-2.5-flash",
    };
  } catch (geminiError: unknown) {
    failureMessages.push(
      geminiError instanceof Error ? geminiError.message : String(geminiError),
    );
    await logFailure(options.userId, options.feature, "warning", geminiError);
  }

  try {
    const openRouterModels = [...getOpenRouterModels(options.feature)];
    let lastFallbackError: unknown = new Error(
      "OpenRouter returned no response",
    );

    for (const model of openRouterModels) {
      try {
        const openRouterText = await generateWithOpenRouterModel(
          model,
          options.systemPrompt,
          options.userPrompt,
        );
        const data = validateStructuredResponse(openRouterText, options.schema);

        return {
          success: true,
          data,
          modelUsed: `openrouter:${model}`,
        };
      } catch (error: unknown) {
        lastFallbackError = error;
        await logFailure(options.userId, options.feature, "warning", error);
      }
    }

    throw lastFallbackError;
  } catch (fallbackError: unknown) {
    failureMessages.push(
      fallbackError instanceof Error
        ? fallbackError.message
        : String(fallbackError),
    );
    await logFailure(options.userId, options.feature, "error", fallbackError);
    return {
      success: false,
      error: summarizeAiFailure(failureMessages),
    };
  }
}
