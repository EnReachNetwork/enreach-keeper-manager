import ws from 'ws';
const WebSocketServer = ws.Server;

import { Message } from "./types/ws.js";
import { WorkReport } from "./types/work.js";
import { PrismaClient } from "@prisma/client";
import { ENV } from './config/env';
import { minerExist } from './utils/chain.js';

const PORT = ENV.MANAGER_PORT;

export class WebSocketManager {
    private prisma: PrismaClient
    private wss: ws.Server | null;
    private clients: Set<ws.WebSocket>;
    private managerId: string;

    constructor(prisma: PrismaClient, managerId: string) {
        this.prisma = prisma
        this.wss = null;
        this.clients = new Set();
        this.managerId = managerId;
    }

    start() {
        this.wss = new WebSocketServer({ port: PORT });

        this.wss.on('listening', () => {
            console.log(`WebSocket server is listening on port ${PORT}`);
        });

        this.wss.on('connection', async (ws, req) => {
            const token = req.headers['authorization']?.split(' ')[1];
            if (!token) {
                console.log('No token provided');
                ws.close(401, "No token provided");
                return;
            }
            const { authenticated, nodeInfo } = await this.authenticate(token);
            if (!authenticated) {
                console.log('Failed to authenticate');
                ws.close(401, "Failed to authenticate");
                return;
            }

            const clientAddress = req.socket.remoteAddress;
            console.log(`New client connected from ${clientAddress}`);

            this.clients.add(ws);

            ws.on('message', (message: Message<unknown>) => {
                try {
                    const data = JSON.parse(message.toString());
                    console.log(`Received message from ${clientAddress}: ${JSON.stringify(data)}`);

                    // @ts-ignore
                    this.handleMessage(ws, data);
                } catch (error) {
                    console.log(`Failed to parse message: ${error}`);
                }
            });

            ws.on('close', () => {
                console.log(`Client ${clientAddress} disconnected`);
                this.clients.delete(ws);
            });

            ws.on('error', (error) => {
                console.log(`WebSocket error from ${clientAddress}: ${error}`);
            });

            // @ts-ignore
            this.sendToClient(ws, {
                type: 'welcome',
                message: 'Successfully connected to manager'
            });
        });
    }

    handleMessage(ws: WebSocket, message: Message<unknown>) {
        switch (message.type) {
            // case 'register':
            //     return this.handleRegister(ws, message);
            case 'upload_work_report':
                return this.handleWorkReport(ws, message as Message<WorkReport>);
            default:
                console.log(`Unknown message type: ${message.type}`);
        }
    }

    async authenticate(token: string): Promise<{ authenticated: boolean, nodeInfo: { minerId: string } }> {
        const { minerId } = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
        const minerExistOnChain = await minerExist(minerId);
        if (minerExistOnChain) {
            return { authenticated: false, nodeInfo: null };
        } else {
            return { authenticated: true, nodeInfo: { minerId } };
        }
    }

    // handleHello(ws: WebSocket, message: Message) {
    //     console.log(`Handling hello message: ${JSON.stringify(message)}`);
    //     this.sendToClient(ws, {
    //         type: 'hello_response',
    //         message: 'Hello received'
    //     });
    // }

    async handleWorkReport(ws: WebSocket, message: Message<WorkReport>) {
        console.log(`Handling work report: ${JSON.stringify(message)}`);
        const report = message.message;
        await this.prisma.workReport.create({
            data: {
                peerId: report.peerId,
                data: { ...report }
            }
        });
        this.sendToClient(ws, {
            type: 'work_report_response',
            message: 'Handle work report successful'
        });
    }
    // handleRegister(ws: WebSocket, message: Message) {
    //     console.log(`Handling register message: ${JSON.stringify(message)}`);
    //     this.sendToClient(ws, {
    //         type: 'register_response',
    //         message: 'Registration successful'
    //     });
    // }

    sendToClient(ws: WebSocket, message: Message<unknown>) {
        try {
            ws.send(JSON.stringify(message));
        } catch (error) {
            console.log(`Failed to send message to client: ${error}`);
        }
    }

    // broadcast(message: Message) {
    //     this.clients.forEach(client => {
    //         @ts-ignore
    // if (client.readyState === WebSocket.OPEN) {
    //     @ts-ignore
    // this.sendToClient(client, message);
    // }
    // });
    // }

    stop() {
        if (this.wss) {
            this.wss.close(() => {
                console.log('WebSocket server stopped');
            });
        }
    }
}
