import { Command } from "commander";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import {
  MsgCreateManager,
  txClient,
} from "enreach-client-ts/lib/enreach.manager/module.js";
import { logger } from "../utils/logger.js";
import { ENV } from "../config/env.js";
import { validateConfig } from "../config/validate.js";
import { mnemonicToAccount } from "viem/accounts";

export function registerRegisterCommand(program: Command) {
  program
    .command("register")
    .description("Register manager to enreach chain")
    .option("-n, --name <name>", "name to say hello to")
    .action(async (options) => {
      await validateConfig();
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(ENV.MNEMONIC, {
        prefix: "enreach",
      });

      const client = txClient({
        signer: wallet,
        // addr: 'http://localhost:26657',
        addr: "http://150.109.123.18:26657",
        prefix: "enreach",
      });
      const [account] = await wallet.getAccounts();
      console.log(account);

      const mnemonic = ENV.MNEMONIC;
      const evmAccount = mnemonicToAccount(mnemonic);

      // const client = await SigningStargateClient.connectWithSigner('http://localhost:26657', wallet);

      const msg: MsgCreateManager = {
        creator: account.address,
        managerId: "manager-1",
        evmAddress: evmAccount.address,
        regionCode: "sg",
        status: "active",
      };
      const tx = await client.sendMsgCreateManager({
        value: msg,
        fee: {
          amount: [],
          gas: "200000",
        },
      });

      logger.info(`Transaction hash: ${tx.transactionHash}`);
      logger.success("Manager registered successfully");
    });
}
