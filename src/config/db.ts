import { Sequelize } from "sequelize";
import { env } from "./env";

function getDialectOptions(databaseUrl: string): {
  ssl?: {
    require: boolean;
    rejectUnauthorized: boolean;
  };
} {
  const url = new URL(databaseUrl);
  if (url.searchParams.get("sslmode") === "require") {
    return {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    };
  }

  return {};
}

export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions: getDialectOptions(env.DATABASE_URL),
});
