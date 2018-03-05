export declare class StartInfo implements IStartInfo {
    relativePath: string;
    argv: string[];
    env: {};
    constructor(options: IStartInfo);
    equals(other: IStartInfo): boolean;
    static arrayEquals(first: string[], second: string[]): boolean;
    static objEq(first: StringMap<{}>, second: StringMap<{}>): boolean;
}
