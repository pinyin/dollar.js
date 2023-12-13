export function $<P extends Array<any>, R>(func: (...p: P) => R, onEffect?: $EffectHandlerCreator, scope?: $Scope): (...p: P) => R {
    const stack = scope?.stack ?? new Array<$Variable<any>>();
    const heap = scope?.heap ?? new Map<any, $Variable<any>>();
    const handler = onEffect?.(currentScope?.handler ?? null) ?? null;

    return (...p: P): R => {
        currentScope = {
            stack: stack,
            heap: heap,
            parent: null,
            cursor: 0,
            handler: handler,
        }
        const result = func(...p);
        if (currentScope?.parent !== null) {
            throw ('Scope not close.');
        }
        return result;
    };
}

export type $EffectHandler = (effect: any) => any;
export type $EffectHandlerCreator = (parent: $EffectHandler | null) => any;

export type $Scope = {
    stack: Array<$Variable<any>>
    heap: Map<any, $Variable<any>>
}

export function $effect(effect: any) {
    if (currentScope === null) {
        throw ('No available scope.');
    }
    const scope = currentScope;
    currentScope = null
    const result = scope.handler?.(effect);
    currentScope = scope;
    return result;
}

export function $stack<T>(init: () => T): $Variable<T> {
    if (currentScope === null) {
        throw ('No available scope.');
    }

    if (currentScope.stack.length < currentScope.cursor) {
        throw (`Stack length too short. Expecting ${currentScope.cursor}, got ${currentScope.stack.length}`);
    }

    if (currentScope.stack.length === currentScope.cursor) {
        const _scope = currentScope;
        currentScope = null;
        _scope.stack.push(new $Variable(init()));
        currentScope = _scope;
    }

    const result = currentScope.stack[currentScope.cursor]!;
    currentScope.cursor++;
    return result;
}

export class $Variable<T> {
    constructor(public current: T) {
    }
}

export function $heap<T>(key: any, init: () => T): $Variable<T> {
    if (currentScope === null) {
        throw ('No available scope.');
    }

    if (!currentScope.heap.has(key)) {
        const _scope = currentScope;
        currentScope = null;
        _scope.heap.set(key, new $Variable(init()))
        currentScope = _scope;
    }
    return currentScope.heap.get(key)!
}

export function $branch<T>(branch: T): $Branch<T> {
    if (currentScope === null) {
        throw ('No available scope.');
    }
    const branches = $stack(() => new Map<T, InternalScope>()).current;
    if (!branches.has(branch)) {
        branches.set(branch, {
            heap: new Map(),
            stack: [],
            parent: currentScope,
            cursor: 0,
            handler: currentScope.handler
        });
    }
    const newScope = branches.get(branch)!;
    currentScope = newScope
    currentScope.cursor = 0;

    return {
        branch: branch,
        branches: branches,
        get exit(): null {
            if (currentScope === null) {
                throw ('No available scope.');
            }
            if (currentScope.parent === null) {
                throw ("Not in scope.");
            }
            if (currentScope !== newScope) {
                throw ('Exiting from unexpected scope.');
            }
            currentScope = currentScope.parent;
            return null;
        }
    } as $Branch<T>
}

export type $Branch<T> = {
    readonly branch: T,
    readonly branches: Map<T, never> // only used for cleaning up other branches
    get exit(): null,
}

let currentScope: InternalScope | null

type InternalScope = {
    parent: InternalScope | null,
    cursor: number,
    handler: $EffectHandler | null
} & $Scope