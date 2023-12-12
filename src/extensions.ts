import {$, $effect, $fork, $merge, $stack} from "./core";
import {isShallowlyEqual} from "../lib/is_shallowly_equal";

export function $useMemo<T>(init: () => T, deps: Array<any>): T {
    const prevDeps = $readPrev(deps);
    const value = $stack<T | null>(() => null);

    const shouldCompute = prevDeps === null || !isShallowlyEqual(deps, prevDeps);
    $fork(shouldCompute);
    if (shouldCompute) {
        value.current = init();
    }
    $merge()

    return value.current!;
}

export function $useEffect(effect: () => () => void, deps: Array<any>) {
    const prevCleanup = $stack(() => () => {
    });
    const prevDeps = $readPrev(deps);

    const shouldCompute = prevDeps === null || !isShallowlyEqual(deps, prevDeps);
    $fork(shouldCompute);
    if (shouldCompute) {
        prevCleanup.current();
        prevCleanup.current = effect();
    }
    $merge()
}

export function $useState<T>(init: () => T): State<T> {
    const value = $stack(init);

    const setter = $((to: T) => {
        value.current = to;
        $effect(new StateUpdated());
    }, (h) => h);

    return new State<T>(setter, () => value.current);
}

export class StateUpdated {
}

export class State<T> {
    constructor(public readonly set: (to: T) => void, public readonly get: () => T) {
    }
}

export function $readPrev<T>(current: T): T | null {
    const value = $stack<T | null>(() => null);
    const result = value.current;
    value.current = current;
    return result;
}