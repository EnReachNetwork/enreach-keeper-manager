import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { ENV } from "../config/env";
import { txClient } from "enreach-client-ts/lib/enreach.manager";
import { mnemonicToAccount } from "viem/accounts";
import { MsgRegisterManager } from "enreach-client-ts/lib/enreach.manager/module";
import { queryClient } from "enreach-client-ts/lib/cosmos.bank.v1beta1";

export async function registManager(): Promise<string> {
    console.log(`start regist manager`)
    const mnemonic = ENV.MNEMONIC;
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: "enreach",
    });

    const client = txClient({
        signer: wallet,
        addr: ENV.WRITE_CHAIN_URL,
        prefix: "enreach",
    });

    const [account] = await wallet.getAccounts();
    console.log(`register manager account: ${account.address}`);
    const evmAccount = mnemonicToAccount(mnemonic);

    const msg: MsgRegisterManager = {
        creator: account.address,
        regionCode: ENV.REGION_CODE,
        managerAddress: account.address,
        operatorName: ENV.OPERATOR_NAME,
        operatorDesc: ENV.OPERATOR_DESC,
        operatorWebsiteURL: ENV.OPERATOR_WEBSITE_URL,
        evmAddress: evmAccount.address,
        hostAddress: ENV.HOST_ADDRESS,
        managerPort: ENV.MANAGER_PORT,
        trackerPort: ENV.TRACKER_PORT,
        chainAPIPort: ENV.CHAIN_API_PORT,
        chainRPCPort: ENV.CHAIN_RPC_PORT
    }
    const tx = await client.sendMsgRegisterManager({
        value: msg,
        fee: {
            amount: [],
            gas: "200000",
        },
    });
    return tx.transactionHash;
}

export async function checkBalance() {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(ENV.MNEMONIC, { prefix: "enreach" });
    const [firstAccount] = await wallet.getAccounts();
    const { address } = firstAccount;
    const client = queryClient({ addr: ENV.READ_CHAIN_URL });
    const result = await client.queryBalance(address, { denom: "stake" });

}