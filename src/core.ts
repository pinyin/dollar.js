export function $<P extends Array<any>, R>(func: (...p: P) => R, onEffect?: $EffectHandlerCreator): $DollarFunction<P, R> {
    const _rootStack: Stack = {values: [], cursor: 0};
    const _heap: Heap = new Map();
    const _handler = onEffect?.(context?.handler ?? null) ?? null;

    return (...p: P): R => {
        context = {
            scope: {
                stack: _rootStack,
                heap: _heap,
                parent: null,
            },
            handler: _handler,
        }
        context.scope.stack.cursor = 0;
        const result = func(...p);
        if (context.scope.parent !== null) {
            throw ('Scope not close.');
        }
        return result;
    }
}

export type $DollarFunction<P extends Array<any>, R> = {
    (...params: P): R;
}

export type $EffectHandler = (effect: any) => any;
export type $EffectHandlerCreator = (parent: $EffectHandler | null) => any;

export function $effect(effect: any) {
    if (context === null) {
        throw ('No available context.');
    }
    const _context = context;
    context = null
    const result = _context.handler?.(effect);
    context = _context;
    return result;
}

export function $stack<T>(init: () => T): $Variable<T> {
    if (context === null) {
        throw ('No available context.');
    }

    const stack = context.scope.stack;

    if (stack.values.length < stack.cursor) {
        throw (`Stack length too short. Expecting ${stack.cursor}, got ${stack.values.length}`);
    }

    if (stack.values.length === stack.cursor) {
        const _context = context;
        context = null;
        _context.scope.stack.values.push(new $Variable(init()));
        context = _context;
    }

    const result = stack.values[stack.cursor]!;
    stack.cursor++;
    return result;
}

export class $Variable<T> {
    constructor(public current: T) {
    }
}

export function $heap<T>(key: any, init: () => T): $Variable<T> {
    if (context === null) {
        throw ('No available context.');
    }

    if (!context.scope.heap.has(key)) {
        const _context = context;
        context = null;
        _context.scope.heap.set(key, new $Variable(init()))
        context = _context;
    }
    return context.scope.heap.get(key)!
}

export function $branch<T>(branch: T): $Branch<T> {
    if (context === null) {
        throw ('No available context.');
    }
    const branches = $stack(() => new Map<T, Scope>()).current;
    if (!branches.has(branch)) {
        branches.set(branch, {heap: new Map(), stack: {values: [], cursor: 0}, parent: context.scope});
    }
    const currentScope = branches.get(branch)!;
    context.scope = currentScope
    context.scope.stack.cursor = 0;

    return {
        branch: branch,
        branches: branches,
        get exit(): null {
            if (context === null) {
                throw ('No available context.');
            }
            if (context.scope.parent === null) {
                throw ("Not in scope.");
            }
            if (context.scope !== currentScope) {
                throw ('Finishing wrong scope.');
            }
            context.scope = context.scope.parent;
            return null;
        }
    } as $Branch<T>
}

export type $Branch<T> = {
    readonly branch: T,
    readonly branches: Map<T, never> // only used for cleaning up other branches
    get exit(): null,
}

let context: Context | null

type Context = {
    scope: Scope
    handler: $EffectHandler | null
};

type Scope = {
    stack: Stack,
    heap: Heap,
    parent: Scope | null,
}

type Stack = { values: Array<$Variable<any>>, cursor: number };

type Heap = Map<any, $Variable<any>>;