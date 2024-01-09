import {$, $effect, $EffectHandlerCreator, $scope, $variable} from "./core";
import {isShallowlyEqual} from "../lib/is_shallowly_equal";
import {isDefined} from "../lib/is_defined";

export function $useMemo<T>(define: () => T, deps: any[]): T {
    const prevDeps = $readPrev(deps, () => null);
    const value = $variable<T | null>(() => null);

    const $test = $scope(prevDeps === null || !isShallowlyEqual(deps, prevDeps));
    if ($test.branch) {
        value.current = define();
    }
    $test.exit;

    return value.current!;
}

export function $useEffect(effect: () => () => void, deps: any[]) {
    const prevCleanup = $variable<(() => void) | null>(() => null);
    const prevDeps = $readPrev(deps, () => null);

    const $shouldCompute =
        $scope(prevCleanup.current === null || prevDeps === null || !isShallowlyEqual(deps, prevDeps));
    if ($shouldCompute.branch) {
        prevCleanup.current?.();
        prevCleanup.current = $effect({[$UsingEffect]: effect()})
    }
    $shouldCompute.exit;
}

export const $UsingEffect = Symbol('using effect');

export function useEffects(store: Set<() => void>): $EffectHandlerCreator {
    return (h) => (e: any) => {
        const cleanup = e[$UsingEffect];
        if (isDefined(cleanup)) {
            store.add(cleanup);
            return () => {
                cleanup();
                store.delete(cleanup);
            };
        } else {
            return h?.(e)
        }
    }
}

export function $useState<T>(define: () => T): State<T> {
    const value = $variable(define);

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

export function $readPrev<T>(current: T, define: () => T): T {
    const value = $variable<T>(define);
    const result = value.current;
    value.current = current;
    return result;
}

export function $bindFunc<P extends Array<any>, R>(func: (...p: P) => R): (...p: P) => R {
    return $(func, (h) => (e: any) => h?.(e), $variable(() => []).current);
}