interface Action { (): void; }
interface Action1<T> { (arg: T): void; }
interface Func<R> { (): R; }
interface Func1<T, R> { (arg: T): R; }

interface StringMap<T> {
    [key: string]: T;
}

interface IStartInfo {
    relativePath: string;
    argv: string[];
    env: {};
}

interface ILaunchFile {
    run: StringMap<IStartInfo>;
}

type Message = "onStop" | "onStart";