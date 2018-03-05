import { EventEmitter } from "events";

import { State } from "./state";
import { Kernel } from "./kernels";
import { logger } from "./logger";

const log = logger("LifecycleManager");

const newState = "newState";
const newDesiredState = "newDesiredState";
export const reached = "reached";

export class LifecycleManager {
    public readonly terminalEmitter = new EventEmitter();
    private readonly _emitter = new EventEmitter();
    private _state: State = State.Stopped;
    private _desiredState: State = State.Stopped;

    constructor (private readonly _name: string, private readonly _internal: Kernel) {
        this._emitter.on(newState, this._transition.bind(this));
        this._emitter.on(newDesiredState, this._transition.bind(this));
        this.terminalEmitter.on(reached, state => log(_name, `Reached desired ${state} state\n`));
        this._internal.register(this._updateState.bind(this));
    }

    public start() {
        this._updateDesiredState(State.Running);
    }

    public stop() {
        this._updateDesiredState(State.Stopped);
    }

    private _updateState(currentState: State) {
        this._state = currentState;
        this._emitter.emit(newState);
    }

    private _updateDesiredState(desiredState: State) {
        this._desiredState = desiredState;
        this._emitter.emit(newDesiredState);
    }

    private _transition() {
        const desiredState = this._desiredState;
        const currentState = this._state;
        log(this._name, `Transition ${State[currentState]} => ${State[desiredState]}`);
        if (desiredState === currentState) {
            this.terminalEmitter.emit(reached, State[currentState]);
        }
        switch (desiredState) {
            case State.Running:
                switch (currentState) {
                    case State.Stopped: return this._internal.start();
                }
                break;
            case State.Stopped:
                switch (currentState) {
                    case State.Running: return this._internal.stop();
                }
                break;
            case State.Starting:
            case State.Stopping:
            case State.Dirty:
                break;
            default:
                throw new Error(`Unknown desired state: ${desiredState}`);
        }
    }
}