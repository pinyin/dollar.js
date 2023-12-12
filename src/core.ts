export function $<P extends Array<any>, R>(func: (...p: P) => R, onEffect?: $EffectHandlerCreator): $DollarFunction<P, R> {
    const _rootStack: Stack = {values: [], parent: null, cursor: 0};
    const _heap: Heap = new Map();
    const _handler = onEffect?.(context?.handler ?? null) ?? null;

    return (...p: P): R => {
        context = {
            memory: {
                stack: _rootStack,
                heap: _heap,
            },
            handler: _handler,
        }
        context.memory.stack.cursor = 0;
        const result = func(...p);
        if (context.memory.stack.parent !== null) {
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

    const stack = context.memory.stack;

    if (stack.values.length < stack.cursor) {
        throw (`Stack length too short. Expecting ${stack.cursor}, got ${stack.values.length}`);
    }

    if (stack.values.length === stack.cursor) {
        const _context = context;
        context = null;
        _context.memory.stack.values.push(new $Variable(init()));
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
    if (!context.memory.heap.has(key)) {
        const _context = context;
        context = null;
        _context.memory.heap.set(key, new $Variable(init()))
        context = _context;
    }
    return context.memory.heap.get(key)!
}

export function $scope(key: any) {
    if (context === null) {
        throw ('No available context.');
    }
    const branches = $stack(() => new Map<any, Stack>()).current;
    if (!branches.has(key)) {
        branches.set(key, {values: [], parent: context.memory.stack, cursor: 0});
    }
    context.memory.stack = branches.get(key)!;
    context.memory.stack.cursor = 0;
}

export function scope$() {
    if (context === null) {
        throw ('No available context.');
    }
    if (context.memory.stack.parent === null) {
        throw ("Not in scope.");
    }
    context.memory.stack = context.memory.stack.parent!;
}

let context: Context | null

type Context = {
    memory: Memory
    handler: $EffectHandler | null
};

type Memory = {
    stack: Stack,
    heap: Heap,
}

type Stack = { values: Array<$Variable<any>>, parent: Stack | null, cursor: number };

type Heap = Map<any, $Variable<any>>;