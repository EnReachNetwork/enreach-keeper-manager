import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { prisma } from "../db";
import { ENV } from "../config/env";
import { Status } from "../types/common";
import { create } from "domain";
import { queryClient } from "enreach-client-ts/lib/enreach.manager";
import { sleep } from "../utils/common";
import { ManagerStatus } from "../types/manager";
import { registManager } from "../utils/chain";

export async function getManagerId(): Promise<string> {
     // 在链上查询如果存在managerAddress 和 配置的助记词对应的地址相同则不需要注册
     const wallet = await DirectSecp256k1HdWallet.fromMnemonic(ENV.MNEMONIC, {
          prefix: "enreach",
     });
     const [account] = await wallet.getAccounts();
     const creator = account.address;
     let manager = null;
     while (true) {
          manager = await queryManagerByAddress(creator);
          if (manager) {
               if (manager.status === ManagerStatus.Activate || manager.status === ManagerStatus.Working) {
                    return manager.id;
               } else {
                    console.log(`manager status is ${manager.status}, wait for 20s`);
                    await sleep(20);
                    continue;
               }
          } else {
               console.log(`manager not found, register manager`);
               // 注册manager
               const tx = await registManager();
               console.log(`register manager tx: ${tx}`);

          }
     }
}

async function queryManagerByAddress(address: string): Promise<{ id: string, status: string } | null> {
     const client = queryClient({
          addr: ENV.READ_CHAIN_URL
     });
     const result = await client.queryGetManagerByRegion(ENV.REGION_CODE);
     const { managers } = result.data;
     const manager = managers.find((m: any) => {
          return `${m.managerAddress}`.toUpperCase() === address.toUpperCase()
     });
     if (manager) {
          return { id: manager.id, status: manager.status };
     }
     return null;
}


