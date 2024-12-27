import ws from 'ws';
const WebSocketServer = ws.Server;

import {logger} from "./utils/logger.js";
import {Message} from "./types/ws.js";
import {WorkReport} from "./types/work.js";
import {PrismaClient} from "@prisma/client";

const PORT = 6677;

export class WebSocketManager {
    private prisma: PrismaClient
    private wss: ws.Server | null;
    private clients: Set<ws.WebSocket>;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma
        this.wss = null;
        this.clients = new Set();
    }

    start() {
        this.wss = new WebSocketServer({ port: PORT });

        this.wss.on('listening', () => {
            logger.success(`WebSocket server is listening on port ${PORT}`);
        });

        this.wss.on('connection', (ws, req) => {
            const clientAddress = req.socket.remoteAddress;
            logger.info(`New client connected from ${clientAddress}`);

            this.clients.add(ws);

            ws.on('message', (message: Message<unknown>) => {
                try {
                    const data = JSON.parse(message.toString());
                    logger.info(`Received message from ${clientAddress}: ${JSON.stringify(data)}`);

                    // @ts-ignore
                    this.handleMessage(ws, data);
                } catch (error) {
                    logger.error(`Failed to parse message: ${error}`);
                }
            });

            ws.on('close', () => {
                logger.warning(`Client ${clientAddress} disconnected`);
                this.clients.delete(ws);
            });

            ws.on('error', (error) => {
                logger.error(`WebSocket error from ${clientAddress}: ${error}`);
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
                logger.warning(`Unknown message type: ${message.type}`);
        }
    }

    // handleHello(ws: WebSocket, message: Message) {
    //     logger.info(`Handling hello message: ${JSON.stringify(message)}`);
    //     this.sendToClient(ws, {
    //         type: 'hello_response',
    //         message: 'Hello received'
    //     });
    // }

    async handleWorkReport(ws: WebSocket, message: Message<WorkReport>) {
        logger.info(`Handling work report: ${JSON.stringify(message)}`);
        const report = message.message;
        await this.prisma.workReport.create({
            data: {
                peerId: report.peerId,
                data: {...report}
            }
        });
        this.sendToClient(ws, {
            type: 'work_report_response',
            message: 'Handle work report successful'
        });
    }
    // handleRegister(ws: WebSocket, message: Message) {
    //     logger.info(`Handling register message: ${JSON.stringify(message)}`);
    //     this.sendToClient(ws, {
    //         type: 'register_response',
    //         message: 'Registration successful'
    //     });
    // }

    sendToClient(ws: WebSocket, message: Message<unknown>) {
        try {
            ws.send(JSON.stringify(message));
        } catch (error) {
            logger.error(`Failed to send message to client: ${error}`);
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
                logger.info('WebSocket server stopped');
            });
        }
    }
}
