const fs = require("node:fs");
const path = require("node:path");

const envPath = path.resolve(__dirname, ".env");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function getDialectOptions(databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    if (parsed.searchParams.get("sslmode") === "require") {
      return {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      };
    }
  } catch (_error) {
    return {};
  }

  return {};
}

const dialectOptions = process.env.DATABASE_URL
  ? getDialectOptions(process.env.DATABASE_URL)
  : {};

module.exports = {
  development: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    logging: false,
    dialectOptions,
  },
  test: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    logging: false,
    dialectOptions,
  },
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    logging: false,
    dialectOptions,
  }
};
