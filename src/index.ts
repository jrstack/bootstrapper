import { getDriver } from "./driver";
if (require.main === module) {
    console.log("Running as main");

    if (process.argv.length < 3 || process.argv.length > 4) {
        console.log("ARGS");
        process.exit(1);
    }

    getDriver(process.argv).run();
}
console.log("Outside the if", process.argv);
export { getDriver, IDriver } from "./driver";