import { Action1, Message } from "./types";
export interface Sendable {
    send(message: string, handle?: {}, callback?: Action1<null | Error>): boolean;
}
export function sendIPC(sendTo: Sendable, message: Message) {
    sendTo.send(message);
}