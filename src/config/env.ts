import { config } from "dotenv";
import { join } from "path";
import { existsSync } from "fs";
import { logger } from "../utils/logger";

const envPath = join(process.cwd(), ".env");

if (!existsSync(envPath)) {
  logger.error("No .env file found");
} else {
  config();
}

export const ENV = {
  MNEMONIC: process.env.MNEMONIC || "",
  OPERATOR_NAME: process.env.OPERATOR_NAME || "defaultManager",
  OPERATOR_DESC: process.env.OPERATOR_DESC || "defaultDesc",
  OPERATOR_WEBSITE_URL: process.env.OPERATOR_WEBSITE_URL || "https://enreach.network",
  HOST_ADDRESS: process.env.HOST_ADDRESS || "http://localhost",
  MANAGER_PORT: Number(process.env.MANAGER_PORT || "6677"),
  TRACKER_PORT: Number(process.env.TRACKER_PORT || "8080"),
  CHAIN_API_PORT: Number(process.env.CHAIN_API_PORT || "8888"),
  CHAIN_RPC_PORT: Number(process.env.CHAIN_RPC_PORT || "8889"),
  REGION_CODE: process.env.REGION_CODE || "sg",
  READ_CHAIN_URL: process.env.READ_CHAIN_URL || "http://localhost:1317",
  WRITE_CHAIN_URL: process.env.WRITE_CHAIN_URL || "http://localhost:26657",
  REDIS: {
    useCluster: process.env.REDIS_CLUSTER || "false",
    clusterNodes: process.env.REDIS_CLUSTER_NODES || '[{"host":"127.0.0.1","port":6379}]',
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || "false",
    user: process.env.REDIS_USER || "",
    tls: process.env.REDIS_TLS || "false",
  }
};
