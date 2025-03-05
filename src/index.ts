import { getManagerId } from "./service/chain";
import { WebSocketManager } from "./manager";
import { prisma } from "./db";
import { startWorkloadModule } from "./workload";
import { registManager } from "./utils/chain";
async function start() {
  const tx = await registManager();
  console.log(`register manager tx: ${tx}`);
  // 查询该是否改区域账户,判断是否需要注册(所有参数均相同)
  const managerId = await getManagerId();
  // 启动webSocketServer,监听来自tracker的消息
  const webSocketManager = new WebSocketManager(prisma, managerId);
  webSocketManager.start();
  // 启动workload模块,定时上传workload
  startWorkloadModule(prisma);
  // 启动tracker模块,定时获取tracker的消息
}

start().catch((error) => {
  console.log(`Failed to start manager: ${error}`);
  process.exit(1);
})
