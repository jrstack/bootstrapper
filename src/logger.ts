let log = console.log;

export function logger(prefix:string) {
    return (...args:{}[]) => log(`${prefix} - ${new Date().toISOString()}`, ...args); 
}