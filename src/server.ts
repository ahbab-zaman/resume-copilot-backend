import { app } from "./app";
import { sequelize } from "./config/db";
import { env } from "./config/env";

async function startServer(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log("AI Resume Copilot database connection established");

    app.listen(env.PORT, () => {
      console.log(`AI Resume Copilot listening on port ${env.PORT}`);
    });
  } catch (error: unknown) {
    console.error("AI Resume Copilot", error);
    process.exit(1);
  }
}

void startServer();
