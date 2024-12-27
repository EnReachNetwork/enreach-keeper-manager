import { config } from "dotenv";
import { join } from "path";
import { existsSync } from "fs";
import { logger } from "../utils/logger.js";

const envPath = join(process.cwd(), ".env");

if (!existsSync(envPath)) {
  logger.error("No .env file found");
} else {
  config();
}

export const ENV = {
  MNEMONIC: process.env.MNEMONIC || "",
};
