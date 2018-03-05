import { writeFileSync, readFileSync } from "fs";
import { isMaster } from "cluster";
import { execSync } from "child_process";

import { ClusterKernel } from "./clusterKernel";
import { ChildManager } from "./childManager";
import { State, StateString } from "./state";
import { reached, LifecycleManager } from "./lifecycleManager";
import { logger } from "./logger";

export interface IDriver {
    run(): void;
}

export abstract class Driver implements IDriver {
    public abstract run(): void;
    public constructor(public readonly args: string[]) {}
}

class MasterDriver extends Driver {
    public run() {
        const argv = this.args;
        const arg2 = argv[2];
        const pathArg = argv[argv.length - 1];
        if ((arg2 || "").toLowerCase() === "--install") {
            if (argv.length < 4) {
                console.log("Need a path");
                process.exit(0);
            }
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
ExecStart=${argv[0]} ${argv[1]} ${pathArg}
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
        //region master
        const log = (str: string) => logger("Master");
        log("I'm a parent");
        const internal = new ClusterKernel();
        const sm = new LifecycleManager("ClusterSM", internal);
        const handleExit = (message: string) =>
            process.on(message as any, () => {
                log(`Handling exit from ${message}`);
                sm.stop();
            });
        const unixSignals: NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGINT"];
        unixSignals.forEach(handleExit);
        ["exit"].forEach(handleExit);
        sm.start();

    }
}

class WorkerDriver extends Driver {
    public run() {
        const argv = this.args;
        const pathArg = argv[argv.length - 1];
        const launchPath = pathArg || "launch.json";
        const log = (str: string) => logger("Slave");
        log("I'm a child");
        log("Launch path: " + launchPath);

        let launch = "";

        const getFileToRun = function (input: string) {
            const run = JSON.parse(input) as ILaunchFile;
            return run;
        };

        const cp = new ChildManager(() => getFileToRun(launch = readFileSync(launchPath).toString()));
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

export function getDriver(args: string[]): IDriver {
    if (isMaster) {
        return new MasterDriver(args);
    }
    return new WorkerDriver(args);
}