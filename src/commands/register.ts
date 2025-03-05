import { Command } from "commander";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { logger } from "../utils/logger";
import { ENV } from "../config/env";
import { validateConfig } from "../config/validate.js";
import { mnemonicToAccount } from "viem/accounts";
import { MsgRegisterManager, txClient } from "enreach-client-ts/enreach.manager/module.js";

export function registerRegisterCommand(program: Command) {
  program
    .command("register")
    .description("Register manager to enreach chain")
    .option("-n, --name <name>", "name to say hello to")
    .action(async (options) => {
      console.log(`register start`)
      validateConfig();
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(ENV.MNEMONIC, {
        prefix: "enreach",
      });

      const client = txClient({
        signer: wallet,
        // addr: 'http://localhost:26657',
        addr: "http://localhost:26657",
        prefix: "enreach",
      });
      const [account] = await wallet.getAccounts();
      console.log(account);
      console.log(account.address);
      // const [account] = await wallet.getAccounts();
      // console.log(account);
      // console.log(account.address);

      // const mnemonic = ENV.MNEMONIC;
      // const evmAccount = mnemonicToAccount(mnemonic);

      // // const client = await SigningStargateClient.connectWithSigner('http://localhost:26657', wallet);
      // const msg: MsgRegisterManager = {
      //   creator: account.address,
      //   regionCode: ENV.REGION_CODE,
      //   managerAddress: evmAccount.address,
      //   operatorName: ENV.OPERATOR_NAME,
      //   operatorDesc: ENV.OPERATOR_DESC,
      //   operatorWebsiteURL: ENV.OPERATOR_WEBSITE_URL,
      //   evmAddress: evmAccount.address,
      //   hostAddress: ENV.HOST_ADDRESS,
      //   managerPort: ENV.MANAGER_PORT,
      //   trackerPort: ENV.TRACKER_PORT,
      //   chainAPIPort: ENV.CHAIN_API_PORT,
      //   chainRPCPort: ENV.CHAIN_RPC_PORT
      // }
      // const tx = await client.sendMsgRegisterManager({
      //   value: msg,
      //   fee: {
      //     amount: [],
      //     gas: "200000",
      //   },
      // });

      // logger.info(`Transaction hash: ${tx.transactionHash}`);
      logger.success("Manager registered successfully");
    });
}
