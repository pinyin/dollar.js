export function $<P extends Array<any>, R>(func: (...p: P) => R, onEffect?: $EffectHandlerCreator, scope?: $Scope): (...p: P) => R {
    const stack = scope?.[$StackKey] ?? new Array<$Variable<any>>();
    const handler = onEffect?.(currentScope?.handler ?? null) ?? null;

    return (...p: P): R => {
        currentScope = {
            [$StackKey]: stack,
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
    [$StackKey]: Array<$Variable<any>>
}

export function is$Scope(obj: any): obj is $Scope {
    return obj.hasOwnProperty($StackKey);
}

export const $StackKey = Symbol('scope');

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

export function $variable<T>(init: () => T): $Variable<T> {
    if (currentScope === null) {
        throw ('No available scope.');
    }

    if (currentScope[$StackKey].length < currentScope.cursor) {
        throw (`Stack length too short. Expecting ${currentScope.cursor}, got ${currentScope[$StackKey].length}`);
    }

    if (currentScope[$StackKey].length === currentScope.cursor) {
        const _scope = currentScope;
        currentScope = null;
        _scope[$StackKey].push(new $Variable(init()));
        currentScope = _scope;
    }

    const result = currentScope[$StackKey][currentScope.cursor]!;
    currentScope.cursor++;
    return result;
}

export class $Variable<T> {
    constructor(public current: T) {
    }
}

export function $branch<T>(branch: T): $Branch<T> {
    if (currentScope === null) {
        throw ('No available scope.');
    }
    const branches = $variable(() => new Map<T, InternalScope>()).current;
    if (!branches.has(branch)) {
        branches.set(branch, {
            [$StackKey]: [],
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