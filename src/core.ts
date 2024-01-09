import {isDefined} from "../lib/is_defined";

export function $<P extends Array<any>, R>(func: (...p: P) => R, onEffect?: $EffectHandlerCreator, scope?: $Variable<any>[]): (...p: P) => R {
    scope = scope ?? []
    const handler = onEffect?.(currentHandler ?? null) ?? null;

    return (...p: P): R => {
        const context = getContext();
        setContext([scope!, 0, handler])
        const result = func(...p);
        if (currentScope !== scope) {
            throw ('Scope not close.');
        }
        setContext(context);
        return result;
    };
}

export type $EffectHandler = (effect: any) => any;
export type $EffectHandlerCreator = (parent: $EffectHandler | null) => any;

export function $effect(effect: any) {
    if (!isDefined(currentScope)) {
        throw ('No available scope.');
    }

    const context = getContext()
    const handler = context[2];
    setContext([null, null, null])
    const result = handler?.(effect)
    setContext(context);

    return result;
}

export function $variable<T>(define: () => T): $Variable<T> {
    if (!isDefined(currentScope) || !isDefined(currentCursor)) {
        throw ('No available scope.');
    }

    if (currentScope.length < currentCursor) {
        throw (`Stack length too short. Expecting ${currentCursor}, got ${currentScope.length}`);
    }

    if (currentScope.length === currentCursor || currentScope[currentCursor] === undefined) {
        const context = getContext()
        setContext([null, null, null])
        const initialValue = define()
        setContext(context)
        if (currentScope.length === currentCursor) {
            currentScope.push(initialValue);
        } else {
            currentScope[currentCursor] = initialValue;
        }
    }

    const scope = currentScope;
    const cursor = currentCursor;
    currentCursor = currentCursor! + 1;
    return {
        get current(): T {
            return scope[cursor]!;
        },
        set current(to: T) {
            scope[cursor] = to;
        }
    };
}

export type $Variable<T> = {
    current: T
}

export function $scope<T>(branch: T): $Scope<T> {
    if (!isDefined(currentScope)) {
        throw ('No available scope.');
    }

    const context = getContext()
    const branches = $variable(() => new Map<T, []>()).current;
    if (!branches.has(branch)) {
        branches.set(branch, []);
    }
    const newScope = branches.get(branch)!;
    setContext([newScope, 0, currentHandler])

    return {
        branch: branch,
        branches: branches,
        get exit(): null {
            if (currentScope !== newScope) {
                throw ('Exiting from unexpected scope.');
            }
            setContext(context)
            return null;
        }
    } as $Scope<T>
}

export type $Scope<T> = {
    readonly branch: T,
    readonly branches: Map<T, never> // only used for cleaning up other branches
    get exit(): null,
}

let currentScope: any[] | null
let currentCursor: number | null
let currentHandler: $EffectHandler | null

type Context = [typeof currentScope, typeof currentCursor, typeof currentHandler];

function getContext(): Context {
    return [currentScope, currentCursor, currentHandler]
}

function setContext(context: Context) {
    [currentScope, currentCursor, currentHandler] = [...context]
}