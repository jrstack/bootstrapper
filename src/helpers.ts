export interface Sendable {
    send(message: string, handle?: {}, callback?: Action1<null | Error>): boolean;
}
export function sendIPC(sendTo: Sendable, message: "onStop" | "onStart") {
    sendTo.send(message);
}