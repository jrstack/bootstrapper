import { writeFileSync, readFileSync } from "fs";
import { execSync } from "child_process";
import { join, dirname } from "path";

import { ClusterKernel, workerModeArg } from "./clusterKernel";
import { ChildManager } from "./childManager";
import { State, StateString } from "./state";
import { reached, LifecycleManager } from "./lifecycleManager";
import { logger } from "./logger";
import { ILaunchFile, Message } from "../types/types";

export interface IDriver {
    run(): void;
}

export { workerModeArg };

class MasterDriver implements IDriver {
    public constructor(public readonly indexPath: string, public readonly launchPath: string) { }

    public run() {
        const log = (str: string) => logger("Master");
        log("I'm a parent");
        const internal = new ClusterKernel(this.indexPath, this.launchPath);
        const sm = new LifecycleManager("ClusterSM", internal);
        const handleExit = (message: string) =>
            process.on(message as any, () => {
                log(`Handling exit from ${message}`);
                sm.stop();
            });
        const unixSignals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
        unixSignals.forEach(handleExit);
        ["exit"].forEach(handleExit);
        sm.start();
    }
}

class WorkerDriver implements IDriver {
    public constructor(private readonly launchPath?: string) { }

    public run() {
        const launchPath = this.launchPath || "launch.json";
        const log = (str: string) => logger("Slave");
        console.log("!!!!!!!!!!!!!!");
        log("I'm a child");
        log("Launch path: " + launchPath);

        let launch = "";

        const getFileToRun = function (input: string) {
            const run = JSON.parse(input) as ILaunchFile;
            for(const index in run.run) {
                const startInfo = run.run[index];
                startInfo.relativePath = join(dirname(launchPath), startInfo.relativePath);
            }
            return run;
        };

        const cp = new ChildManager(launchPath, () => getFileToRun(launch = readFileSync(launchPath).toString()));
        const sm = new LifecycleManager("CPSM", cp);

        const interval = setInterval(() => {
            let newContents: string;
            try {
                newContents = readFileSync(launchPath).toString();
            } catch (e) {
                log("Failed to read " + e.toString());
                return;
            }
            if (newContents && newContents !== launch) {
                if (cp.startNew(getFileToRun(launch = newContents))) {
                    log("Found new file to run " + newContents);
                }
            }
        }, 5000);

        sm.terminalEmitter.on(reached, (state: StateString) => {
            const stateEnum = State[state];
            if (stateEnum === State.Stopped) {
                log("Going to exit now..");
                process.exit(0);
            }
        })

        process.on("message", (message: Message) => {
            log(`Got message ${message}`);
            switch (message) {
                case "onStart":
                    sm.start();
                    break;
                case "onStop":
                    clearInterval(interval);
                    sm.stop();
                    break;
                default:
                    log(`Unknown event ${message}`);
            }
        });

    }
}

let run = false;
function observerSignals(isMaster: boolean) {
    if (run) return;
    // Observe all of the signals so we can handle them the way we want to later
    const signalLog = logger("Signal");
    [
        "SIGABRT",
        "SIGALRM",
        "SIGBUS",
        "SIGCHLD",
        "SIGCONT",
        "SIGFPE",
        "SIGHUP",
        "SIGILL",
        "SIGINT",
        "SIGIO",
        "SIGIOT",
        "SIGPIPE",
        "SIGPOLL",
        "SIGPWR",
        "SIGQUIT",
        "SIGSEGV",
        "SIGSTKFLT",
        "SIGSYS",
        "SIGTERM",
        "SIGTRAP",
        "SIGTSTP",
        "SIGTTIN",
        "SIGTTOU",
        "SIGUNUSED",
        "SIGURG",
        "SIGUSR1",
        "SIGUSR2",
        "SIGVTALRM",
        "SIGWINCH",
        "SIGXCPU",
        "SIGXFSZ",
        "SIGBREAK",
        "SIGLOST",
        "SIGINFO",
    ]
        .forEach((p: any) => {
            process.on(p, () => signalLog(`Got signal ${p} in ${isMaster ? "master" : "worker"}`));
        });
    run = true;
}

export function install(nodePath: string, indexPath: string, launchPath: string) {
    const serviceFile = `#
# Written ${new Date()}
#
[Unit]
Description=Node kernel

[Service]
User=jirobert
StandardOutput=syslog+console
StandardError=syslog+console
Type=simple
ExecStart=${nodePath} ${indexPath} ${launchPath}
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
`;
    console.log(serviceFile);
    writeFileSync("/etc/systemd/system/nodeKernel.service", serviceFile);
    execSync("systemctl enable nodeKernel");
    execSync("reboot");
    process.exit(0);
}

export function getDriver(master: boolean, launchPath: string, indexPath?: string): IDriver {
    observerSignals(master);
    if (master) {
        return new MasterDriver(indexPath, launchPath);
    }
    return new WorkerDriver(launchPath);
}