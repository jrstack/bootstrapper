import { dirname } from "path";

import { ChildProcessKernel } from "./childProcessKernel";
import { LifecycleManager, reached } from "./lifecycleManager";
import { Kernel } from "./kernels";
import { State, StateString } from "./state";
import { IStartInfo, ILaunchFile, Func, StringMap } from "../types/types";

class ProcInfo {
    public readonly internal: ChildProcessKernel;
    public readonly sm: LifecycleManager;

    public get info() {
        return this.internal.cached;
    }

    public constructor(public readonly name: string, info: IStartInfo) {
        this.internal = new ChildProcessKernel(name, info);
        this.sm = new LifecycleManager(`CPSM:${name}`, this.internal);
    }
}

export class ChildManager extends Kernel {
    private _procs: StringMap<ProcInfo> = {};
    private _running = 0;

    public constructor(public readonly relativePath: string, public readonly initialLoad: Func<ILaunchFile>) {
        super();
    }

    public startNew(input: ILaunchFile): boolean {
        console.log("StartNew", JSON.stringify(input, null, '\t'));
        let changed = false;
        const newRun = input.run;
        const oldKeys = Object.keys(this._procs);
        const newKeys = Object.keys(newRun);

        newKeys.forEach(nk => {
            if (!(nk in this._procs)) {
                changed = true;
                this._startProc(nk, newRun[nk]);
            }
        });
        oldKeys.forEach(ok => {
            if (!(ok in newRun)) {
                changed = true;
                this._stopProc(ok);
                return;
            }
            const o = newRun[ok];
            const oldProc = this._procs[ok];
            if (oldProc.internal.startNew(o)) {
                console.log("StartNew", "restarting", ok, JSON.stringify(oldProc.info, null, '\t'), JSON.stringify(o, null, '\t'));
                changed = true;
                return;
            }
        });

        return changed;
    }

    private _stopProc(name: string) {
        const oldProc = this._procs[name];
        console.log("StartNew", "killing proc!", name, JSON.stringify(oldProc.info, null, '\t'));
        delete this._procs[name];
        oldProc.sm.stop();
    }

    private _startProc(name: string, info: IStartInfo) {
        console.log("StartNew", "new proc!", name, JSON.stringify(info, null, '\t'));
        const newProc = this._procs[name] = new ProcInfo(name, info);
        ++this._running;
        const sm = newProc.sm;
        sm.terminalEmitter.on(reached, (state: StateString) => {
            const stateEnum = State[state];
            if (stateEnum === State.Stopped) {
                if (--this._running <= 0) {
                    this._notify(State.Stopped);
                }
            }
        });
        sm.start();
    }

    protected _onStart(): void {
       this.startNew(this.initialLoad());
       this._notify(State.Running);
    }

    protected _onStop(): void {
        this._notify(State.Dirty);
        Object.keys(this._procs).forEach(this._stopProc.bind(this));
    }

}