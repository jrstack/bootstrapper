import { State } from "./state";
export declare abstract class Kernel {
    protected _notify: Action1<State>;
    register(emitter: Action1<State>): void;
    protected abstract _onStart(): void;
    protected abstract _onStop(): void;
    start(): void;
    stop(): void;
}
export declare abstract class RestartableKernel<T> extends Kernel {
    private _cached;
    readonly cached: T;
    constructor(_cached: T);
    protected abstract _startNew(input: T): boolean;
    startNew(input: T): boolean;
}
