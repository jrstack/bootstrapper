import { isAbsolute, join } from "path";

import { getDriver as getDriverInternal, workerModeArg, install } from "./driver";
console.log("Running --", process.argv, __dirname, __filename, process.cwd());
if (require.main === module) {
    const [_0, _1, ...args] = process.argv;
    console.log("Running as main", args);

    const workerIndex = args.indexOf(workerModeArg);
    const workerMode = workerIndex >= 0;
    if (workerMode) {
        args.splice(workerIndex, 1);
    }

    const installIndex = args.indexOf("--install");
    const installMode = installIndex >= 0;
    if (workerMode && installMode) {
        throw new Error("Cannot run in install mode and worker mode");
    } else if (installMode) {
        args.splice(installIndex, 1);
    }

    if (args.length !== 1) {
        console.log("ARGS");
        process.exit(1);
    }

    const launchPath = isAbsolute(args[0]) ? args[0] : join(process.cwd(), args[0]);
    if (installMode) {
        install(_0, __filename, launchPath);
    }

    console.log("LaunchPath", launchPath);

    getDriverInternal(!workerMode, launchPath, __filename).run()
} else {
    console.log("Outside the if", process.argv);
}

function getDriver(launchPath: string) {
    return getDriverInternal(true, launchPath, __filename);
}
export { getDriver, IDriver } from "./driver";