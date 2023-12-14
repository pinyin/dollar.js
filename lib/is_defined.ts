export function isDefined<T>(obj: T): obj is Exclude<T, null | undefined | void | never> {
    return obj !== null && obj !== undefined;
}