import { RestartableKernel } from "./kernels";
export declare class ChildProcessKernel extends RestartableKernel<IStartInfo> {
    readonly name: string;
    private _child;
    private _killTimeout;
    private _log;
    constructor(name: string, startInfo: IStartInfo);
    protected _startNew(info: IStartInfo): boolean;
    protected _onStart(): void;
    protected _onStop(): void;
}
