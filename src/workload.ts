import { logger } from "./utils/logger.js";
import { PrismaClient } from "@prisma/client";
import { WorkReport } from "./types/work.js";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { ENV } from "./config/env.js";
import {
  MsgCreateWorkload,
  txClient,
} from "enreach-client-ts/lib/enreach.workload/module.js";

export const MinEpoch = 481973;
export const DECIMALS = 6;

export const startWorkloadModule = async (prisma: PrismaClient) => {
  const currentEpoch = Math.floor(Date.now() / 1000 / 3600);
  logger.info(`Starting workload module, current epoch is ${currentEpoch}`);

  await handleHistoryWorkReports(prisma);
};

export const handleHistoryWorkReports = async (prisma: PrismaClient) => {
  logger.info("Handling history work reports");
  const currentEpoch = Math.floor(Date.now() / 1000 / 3600);
  for (let i = MinEpoch; i < currentEpoch; i++) {
    const begin = new Date(i * 3600 * 1000);
    const end = new Date((i + 1) * 3600 * 1000);

    const reports = await prisma.workReport.findMany({
      where: {
        createdAt: {
          gte: begin,
          lt: end,
        },
      },
    });
    logger.info(`Handling ${reports.length} for epoch(${i})`);
    const wrs = reports.map((r) => r.data as unknown as WorkReport);
    const peerWrs = await calculateWorkload(wrs);
    console.log(peerWrs);
    for (let j = 0; j < peerWrs.length; j++) {
      const { peerId, score } = peerWrs[j];
      await uploadWorkload(i, peerId, score);
    }
  }
};

export const calculateWorkload = (wrs: WorkReport[]) => {
  const peerWorkloads = new Map<string, number>();

  for (const wr of wrs) {
    const currentScore = peerWorkloads.get(wr.peerId) || 0;

    const uploadBytes = wr.upload_volume;
    const gbScore = uploadBytes / (1024 * 1024 * 1024);

    peerWorkloads.set(wr.peerId, currentScore + gbScore);
  }

  return Array.from(peerWorkloads.entries()).map(([peerId, score]) => {
    const cappedScore = Math.min(score, 100);
    const scoreWithDecimals = Math.floor(cappedScore * Math.pow(10, DECIMALS));

    return {
      peerId,
      score: scoreWithDecimals,
      rawScore: cappedScore,
    };
  });
};

export const uploadWorkload = async (
  epoch: number,
  minerId: string,
  scoreWithDecimals: number,
) => {
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

  const msg: MsgCreateWorkload = {
    creator: account.address,
    epoch,
    managerId: account.address,
    minerId,
    score: scoreWithDecimals,
  };
  const tx = await client.sendMsgCreateWorkload({
    value: msg,
    fee: {
      amount: [],
      gas: "200000",
    },
  });

  logger.info(`Transaction hash: ${tx.transactionHash}`);
  logger.success("Manager upload workload successfully");
};
