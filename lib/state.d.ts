export declare enum State {
    Starting = 0,
    Running = 1,
    Stopping = 2,
    Stopped = 3,
    Dirty = 4,
}
export declare type StateString = keyof typeof State;
