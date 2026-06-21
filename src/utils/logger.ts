import { AgentLog } from "../models/AgentLog";

type AgentLogEntry = {
  userId: string | null;
  feature: string;
  level: "info" | "warning" | "error";
  message: string;
};

export async function logAgentEvent(entry: AgentLogEntry): Promise<void> {
  try {
    await AgentLog.create({
      userId: entry.userId,
      feature: entry.feature,
      level: entry.level,
      message: entry.message,
    });
  } catch (error: unknown) {
    console.error("[utils/logger]", error);
  }
}

