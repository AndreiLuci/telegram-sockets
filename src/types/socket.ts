export enum SocketMessageType {
    PING = "PING",
    PONG = "PONG",
    RESTOCK = "RESTOCK",
    ERROR = "ERROR",
    SUBSCRIBE = "SUBSCRIBE",
    UNSUBSCRIBE = "UNSUBSCRIBE",
    AUTHENTICATE = "AUTHENTICATE"
  }
  export interface SocketMessage {
    type: SocketMessageType;
    data: any;
  }