import { Kernel } from "./kernels";
export declare class ClusterKernel extends Kernel {
    private _worker;
    private _killTimeout;
    protected _onStart(): void;
    protected _onStop(): void;
}
