import { App, WebSocket as WS } from "uWebSockets.js";
import { SocketMessage, SocketMessageType } from "./types/socket";
import { authenticate } from "./utils";
import WebSocket from "ws";
import Telegram from "./telegram";
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;;

const sleep = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));




export default class ServersideMonitor {
  private server = App();
  protected socket?: WebSocket;
  constructor() {
    this.setupServer();
    new Telegram(this.server).fetch()
  }

  protected async waitForSocketOpen() {
    if (!this.socket) {
      throw new Error("Socket does not exist");
    }

    while (this.socket?.readyState !== WebSocket.OPEN) {
      // if (this.socket.readyState === WebSocket.CLOSED) {
      //   throw new Error("Socket closed before opening");
      // }
      await sleep(1000);
    }
  }


  protected async sendMessage(message:string) {
    if (!this.socket) {
      throw new Error("Socket is not setup");
    }

    await this.waitForSocketOpen();

    this.socket.send(JSON.stringify(message));
  }
  



  private setupServer() {
    this.server
      .ws("/freeebies", {
        compression: 0,
        idleTimeout: 120,
        message: this.onServerMessage.bind(this),
        open: this.onServerOpen.bind(this),
        upgrade: (res, req, context) => {
        
        const upgradeAborted = {aborted: false};

        const url = req.getUrl();
        const secWebSocketKey = req.getHeader('sec-websocket-key');
        const secWebSocketProtocol = req.getHeader('sec-websocket-protocol');
        const secWebSocketExtensions = req.getHeader('sec-websocket-extensions');
        const jwt = req.getHeader("authorization").replace("Bearer ","");
        const hwid = req.getHeader("x-estock-hwid");

        setTimeout(async () => {
          if(!await authenticate(jwt, hwid)){
            res.close()
          }

          if (upgradeAborted.aborted) {
            //console.log("Client disconnected before the upgrade");
            return;
          }

          res.upgrade({
            url: url
          },
          secWebSocketKey,
          secWebSocketProtocol,
          secWebSocketExtensions,
          context);
        }, 1000);

        res.onAborted(() => {
          upgradeAborted.aborted = true;
    });
        }
        
      })
      .listen(PORT, () => {});
  }

  private async onServerOpen(
    ws: WS
  ){
    if (!ws.isSubscribed("freebies")) {
      ws.subscribe("freebies");
      console.log("New Client Subscribed")
    }
  }

  private async onServerMessage(
    ws: WS,
    message: ArrayBuffer,
  ) {
    try {
      const messageData = new TextDecoder().decode(message);
      const socketMessage = JSON.parse(messageData) as SocketMessage;

      if (socketMessage.type === SocketMessageType.PING) {
        ws.send("pong");
      }
      
    } catch (err) {
      console.error(err);
    }
  }
}
