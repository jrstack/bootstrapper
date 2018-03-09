import * as path from "path";
import { IStartInfo, StringMap } from "./types";

export class StartInfo implements IStartInfo {
    relativePath: string;
    argv: string[];
    env: {};

    constructor (options: IStartInfo) {
        this.relativePath = path.normalize(options.relativePath);
        this.argv = options.argv || [];
        this.env = options.env;
    }

    public equals(other: IStartInfo) {
        const info2 = new StartInfo(other);
        return this.relativePath === info2.relativePath &&
            StartInfo.arrayEquals(this.argv, info2.argv) &&
            StartInfo.objEq(this.env, info2.env) &&
            true;
    }

    public static arrayEquals(first: string[], second: string[]) {
        if (first === second) return true;
        if (!first && !second) return true;
        if (!first || !second) return false;
        if (first.length !== second.length) return false;
        for (let i = 0; i < first.length; ++i) {
            if (first[i] !== second[i]) return false;
        }
        return true;
    }

    public static objEq(first: StringMap<{}>, second: StringMap<{}>) {
        if (first === second) return true;
        if (!first && !second) return true;
        if (!first || !second) return false;
        const k1 = Object.keys(first);
        const k2 = Object.keys(second);
        if (k1.length !== k2.length) return false;
        k1.sort();
        k2.sort();
        if (!StartInfo.arrayEquals(k1, k2)) return false;
        for (const i of k1) {
            if (first[i] !== second[i]) return false;
        }
        return true;
    }
}
