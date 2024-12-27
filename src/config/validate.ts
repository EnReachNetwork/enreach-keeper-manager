import { ENV } from "./env.js";
import chalk from "chalk";
import { logger } from "../utils/logger.js";

class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

interface ValidationRule {
  value: any;
  name: string;
  required?: boolean;
  validator?: (value: any) => boolean;
  message?: string;
}

export function validateConfig() {
  const rules: ValidationRule[] = [
    {
      value: ENV.MNEMONIC,
      name: "MNEMONIC",
      required: true,
      validator: (v) => typeof v === "string" && v.trim().length > 0,
      message: "MNEMONIC is required and cannot be empty",
    },
  ];

  const errors: string[] = [];

  for (const rule of rules) {
    const { value, name, required, validator, message } = rule;

    if (required && (value === undefined || value === null || value === "")) {
      errors.push(`${name} is required but not set`);
      continue;
    }

    if (value !== undefined && validator && !validator(value)) {
      errors.push(message || `Invalid value for ${name}: ${value}`);
    }
  }

  logger.info("\nChecking configuration...");

  const safeConfig = {
    ...ENV,
    MNEMONIC: "********",
  };

  logger.info("Current configuration:");
  console.log(chalk.gray(JSON.stringify(safeConfig, null, 2)));

  if (errors.length > 0) {
    logger.error("Configuration validation failed:");
    errors.forEach((error) => logger.error(`- ${error}`));
    throw new ConfigError(
      `Configuration validation failed with ${errors.length} errors`,
    );
  }

  logger.success("Configuration validation passed");
}
