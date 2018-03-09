import { Worker, fork } from "cluster";

import { ChildProcessKernel } from "./childProcessKernel";
import { State } from "./state";
import { logger } from "./logger";

const log = logger("ClusterInternal");
export const workerModeArg = "--bootstrapperWorkerMode";

export class ClusterKernel extends ChildProcessKernel {
    public constructor(indexPath: string, launchPath: string) {
        super("WorkerKernel", {
            relativePath: indexPath,
            argv: [launchPath, workerModeArg],
            env: process.env,
        })
    }
}
