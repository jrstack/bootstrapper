export interface IDriver {
    run(): void;
}
export declare abstract class Driver implements IDriver {
    readonly args: string[];
    abstract run(): void;
    constructor(args: string[]);
}
export declare function getDriver(args: string[]): IDriver;
