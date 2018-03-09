export interface Action { (): void; }
export interface Action1<T> { (arg: T): void; }
export interface Func<R> { (): R; }
export interface Func1<T, R> { (arg: T): R; }

export interface StringMap<T> {
    [key: string]: T;
}

export interface IStartInfo {
    relativePath: string;
    argv: string[];
    env: {};
}

export interface ILaunchFile {
    run: StringMap<IStartInfo>;
}

export type Message = "onStop" | "onStart";