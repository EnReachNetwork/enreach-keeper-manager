#!/usr/bin/env node
import { Command } from "commander";
import { registerHelloCommand } from "./commands/hello.js";
import { registerRegisterCommand } from "./commands/register.js";
import { WebSocketManager } from "./manager.js";
import { PrismaClient } from "@prisma/client";
import { startWorkloadModule } from "./workload.js";
import { validateConfig } from "./config/validate.js";

const program = new Command();
const prisma = new PrismaClient();

program
  .name("manager")
  .description("CLI application built with Commander.js")
  .version("0.0.1")
  .action(async () => {
    await validateConfig();
    const manager = new WebSocketManager(prisma);
    startWorkloadModule(prisma);
    manager.start();
  });

registerHelloCommand(program);
registerRegisterCommand(program);

program.parse();
