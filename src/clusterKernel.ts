import { Worker, fork } from "cluster";

import { Kernel } from "./kernels";
import { State } from "./state";
import { logger } from "./logger";
import { sendIPC } from "./helpers";

const log = logger("ClusterInternal");

export class ClusterKernel extends Kernel {
    private _worker: Worker;
    private _killTimeout: NodeJS.Timer;

    protected _onStart() {
        const worker = this._worker = fork();
        worker.on("exit", () => {
            if (this._killTimeout) {
                clearTimeout(this._killTimeout);
            }
            this._notify(State.Stopped);
        });
        sendIPC(this._worker, "onStart");
        this._notify(State.Running);
    }

    protected _onStop() {
        sendIPC(this._worker, "onStop");
        this._notify(State.Dirty);
        this._killTimeout = setTimeout(() => {
            log("ForceKill");
            this._worker.kill("SIGKILL");
        }, 10000)
    }
}
