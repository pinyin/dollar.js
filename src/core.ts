export function $<P extends Array<any>, R>(func: (...p: P) => R, onEffect?: $EffectHandlerCreator): $DollarFunction<P, R> {
    const _rootStack: Stack = {values: [], parent: null, cursor: 0};
    const _heap: Heap = new Map();
    const _handler = onEffect?.(context?.handler ?? null) ?? null;

    return (...p: P): R => {
        context = {
            stack: _rootStack,
            heap: _heap,
            handler: _handler,
        }
        context.stack.cursor = 0;
        const result = func(...p);
        if (context.stack.parent !== null) {
            throw ('More $fork than $merge.');
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

export function $stack<T>(init: () => T): $Value<T> {
    if (context === null) {
        throw ('No available context.');
    }
    if (context.stack.values.length < context.stack.cursor) {
        throw (`Stack length too short. Expecting ${context.stack.cursor}, got ${context.stack.values.length}`);
    }

    if (context.stack.values.length === context.stack.cursor) {
        const _context = context;
        context = null;
        _context.stack.values.push(new $Value(init()));
        context = _context;
    }

    const result = context.stack.values[context.stack.cursor]!;
    context.stack.cursor++;
    return result;
}

export class $Value<T> {
    constructor(public current: T) {
    }
}

export function $heap<T>(key: any, init: () => T): $Value<T> {
    if (context === null) {
        throw ('No available context.');
    }
    if (!context.heap.has(key)) {
        const _context = context;
        context = null;
        _context.heap.set(key, new $Value(init()))
        context = _context;
    }
    return context.heap.get(key)!
}

export function $fork(key: any) {
    if (context === null) {
        throw ('No available context.');
    }
    const branches = $stack(() => new Map<any, Stack>()).current;
    if (!branches.has(key)) {
        branches.set(key, {values: [], parent: context.stack, cursor: 0});
    }
    context.stack = branches.get(key)!;
    context.stack.cursor = 0;
}

export function $merge() {
    if (context === null) {
        throw ('No available context.');
    }
    if (context.stack.parent === null) {
        throw ("More $merge than $fork.");
    }
    context.stack = context.stack.parent!;
}

let context: Context | null

type Context = {
    stack: Stack,
    heap: Heap,
    handler: $EffectHandler | null
};

type Stack = { values: Array<$Value<any>>, parent: Stack | null, cursor: number };

type Heap = Map<any, $Value<any>>;