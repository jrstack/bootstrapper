import { Kernel } from "./kernels";
export declare class ChildManager extends Kernel {
    readonly initialLoad: Func<ILaunchFile>;
    private _procs;
    private _running;
    constructor(initialLoad: Func<ILaunchFile>);
    startNew(input: ILaunchFile): boolean;
    private _stopProc(name);
    private _startProc(name, info);
    protected _onStart(): void;
    protected _onStop(): void;
}
