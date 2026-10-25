import { errorHandler, type VuegcError } from "vuegc";

/** An error of vueg itself (vuegc's errors have an `errno` or a `code`). */
export interface VuegError {
    vueg: true;
    message: string;
}

export function vuegError(message: string): VuegError {
    return { vueg: true, message };
}

function isVuegError(err: unknown): err is VuegError {
    return typeof err === "object" && err !== null && (err as VuegError).vueg === true;
}

/**
 * Print the error like the vuegc command does, then exit with code 1:
 * vueg's own errors here, vuegc's errors through vuegc's errorHandler (same messages).
 */
export function handleError(err: unknown): never {
    if(isVuegError(err)) {
        console.log(`\t[!] ${ err.message } [!]`);
        console.log("> Generating vue component failure");
        process.exit(1);
    }
    return errorHandler(err as VuegcError);
}
