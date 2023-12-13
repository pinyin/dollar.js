import {$, $branch, $effect, $stack} from "./core";
import {isShallowlyEqual} from "../lib/is_shallowly_equal";

export function $useMemo<T>(init: () => T, deps: Array<any>): T {
    const prevDeps = $readPrev(deps);
    const value = $stack<T | null>(() => null);

    const $test = $branch(prevDeps === null || !isShallowlyEqual(deps, prevDeps));
    if ($test.branch) {
        value.current = init();
    }
    $test.exit;

    return value.current!;
}

export function $useEffect(effect: () => () => void, deps: Array<any>) {
    const prevCleanup = $stack(() => () => {
    });
    const prevDeps = $readPrev(deps);

    const $shouldCompute = $branch(prevDeps === null || !isShallowlyEqual(deps, prevDeps));
    if ($shouldCompute.branch) {
        prevCleanup.current();
        prevCleanup.current = effect();
    }
    $shouldCompute.exit;
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