export enum State {
    Starting,
    Running,
    Stopping,
    Stopped,
    Dirty,
}

export type StateString = keyof typeof State;
