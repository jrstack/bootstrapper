import { ChildProcess, fork } from "child_process";
import { dirname, join, isAbsolute } from "path";

import { RestartableKernel } from "./kernels";
import { StartInfo } from "./startInfo";
import { sendIPC } from "./helpers";
import { State } from "./state";
import { logger } from "./logger";

const log = logger("ChildProcessKernel");

export class ChildProcessKernel extends RestartableKernel<IStartInfo> {
    private _child: ChildProcess;
    private _killTimeout: NodeJS.Timer;
    private _log = (str: string) => log("CPI-" + this.name, str);

    public constructor(public readonly name: string, startInfo: IStartInfo) {
        super(startInfo);
    }

    protected _startNew(info: IStartInfo) {
        const newInfo2 = new StartInfo(info);
        const ret = !newInfo2.equals(this.cached);
        return ret;
    }

    protected _onStart(): void {
        const { relativePath, argv, env } = this.cached;
        const pathToCode = isAbsolute(relativePath) ? relativePath : join(__dirname, relativePath);
        const codeDir = dirname(pathToCode);
        this._log(`Child: [_onStart] going to start -> ${pathToCode}, [${argv.join(", ")}]`);
        const child = this._child = fork(pathToCode, argv, {
            env: env || {},
            cwd: codeDir,
        });
        this._log(`Child: ${child.pid} started`);
        child.on("exit", () => {
            if (this._killTimeout) {
                clearTimeout(this._killTimeout);
            }
            this._log(`Child: ${child.pid} died`);
            this._notify(State.Stopped);
        });
        sendIPC(child, "onStart");
        this._notify(State.Running);
    }

    protected _onStop(): void {
        this._notify(State.Dirty);
        this._child.kill("SIGINT");
        this._killTimeout = setTimeout(() => {
            this._log("ForceKill");
            this._child.kill("SIGKILL");
        }, 10000);
        sendIPC(this._child, "onStop");
    }
}
