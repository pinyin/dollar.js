import {$, $branch, $effect, $variable} from "./core";
import {isShallowlyEqual} from "../lib/is_shallowly_equal";

export function $useMemo<T>(init: () => T, deps: any[]): T {
    const prevDeps = $readPrev(deps, () => null);
    const value = $variable<T | null>(() => null);

    const $test = $branch(prevDeps === null || !isShallowlyEqual(deps, prevDeps));
    if ($test.branch) {
        value.current = init();
    }
    $test.exit;

    return value.current!;
}

export function $useEffect(effect: () => () => void, deps: any[]) {
    const prevCleanup = $variable(() => () => {
    });
    const prevDeps = $readPrev(deps, () => null);

    const $shouldCompute = $branch(prevDeps === null || !isShallowlyEqual(deps, prevDeps));
    if ($shouldCompute.branch) {
        prevCleanup.current();
        prevCleanup.current = effect();
    }
    $shouldCompute.exit;
}

export function $useState<T>(init: () => T): State<T> {
    const value = $variable(init);

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

export function $readPrev<T>(current: T, init: () => T): T {
    const value = $variable<T>(init);
    const result = value.current;
    value.current = current;
    return result;
}