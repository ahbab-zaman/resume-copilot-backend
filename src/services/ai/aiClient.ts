import { z, type ZodTypeAny } from "zod";

import { logAgentEvent } from "../../utils/logger";
import { generateWithDeepSeek } from "./deepseekClient";
import { generateWithGemini } from "./geminiClient";

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

export async function generateStructured<TSchema extends ZodTypeAny>(
  options: GenerateStructuredOptions<TSchema>,
): Promise<GenerateStructuredSuccess<z.infer<TSchema>> | GenerateStructuredFailure> {
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
    await logFailure(options.userId, options.feature, "warning", geminiError);
  }

  try {
    const deepSeekText = await generateWithDeepSeek(
      options.systemPrompt,
      options.userPrompt,
    );
    const data = validateStructuredResponse(deepSeekText, options.schema);

    return {
      success: true,
      data,
      modelUsed: "deepseek-v3",
    };
  } catch (deepSeekError: unknown) {
    await logFailure(options.userId, options.feature, "error", deepSeekError);
    return {
      success: false,
      error: "AI generation failed. Please try again shortly.",
    };
  }
}
