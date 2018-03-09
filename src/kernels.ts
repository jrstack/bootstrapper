import { State } from "./state";
import { Action1 } from "./types";

export abstract class Kernel {
    protected _notify: Action1<State>;

    public register(emitter: Action1<State>) {
        this._notify = emitter;
    }

    protected abstract _onStart(): void;
    protected abstract _onStop(): void;

    public start() {
        this._notify(State.Starting);
        this._onStart();
    }

    public stop() {
        this._notify(State.Stopping);
        this._onStop();
    }
}

export abstract class RestartableKernel<T> extends Kernel {
    public get cached() {
        return this._cached;
    }

    constructor(private _cached: T) {
        super();
    }

    protected abstract _startNew(input: T): boolean;

    public startNew(input: T) {
        if (this._startNew(input)) {
            this._cached = input;
            super.stop();
            return true;
        }
        return false;
    }
}