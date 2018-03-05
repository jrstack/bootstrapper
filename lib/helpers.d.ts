export interface Sendable {
    send(message: string, handle?: {}, callback?: Action1<null | Error>): boolean;
}
export declare function sendIPC(sendTo: Sendable, message: "onStop" | "onStart"): void;
