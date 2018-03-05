/// <reference types="node" />
import { EventEmitter } from "events";
import { Kernel } from "./kernels";
export declare const reached = "reached";
export declare class LifecycleManager {
    private readonly _name;
    private readonly _internal;
    readonly terminalEmitter: EventEmitter;
    private readonly _emitter;
    private _state;
    private _desiredState;
    constructor(_name: string, _internal: Kernel);
    start(): void;
    stop(): void;
    private _updateState(currentState);
    private _updateDesiredState(desiredState);
    private _transition();
}
