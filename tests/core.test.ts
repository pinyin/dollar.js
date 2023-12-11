import {$, $effect, $fork, $merge, $value} from "../src";

describe('core logic of dollar-js', () => {
    describe('$ and $value', () => {
        test('should support in-function variable', () => {
            const inc = $(() => {
                const value = $value(() => 0);
                value.current++;
                return value.current;
            })
            expect(inc()).toBe(1);
            expect(inc()).toBe(2);
            expect(inc()).toBe(3);
            expect(inc()).toBe(4);
        });
    })

    describe('$effect', () => {
        test('should run by handlers', () => {
            const effects: Array<string> = [];
            const func = $(() => {
                $effect('a');
            }, (_) => (a: any) => effects.push(a))
            func();
            expect(effects).toEqual(['a']);
            func();
            func();
            expect(effects).toEqual(['a', 'a', 'a']);
        });
        test('should allow event popup', () => {
            const effects: Array<string> = [];
            const func = $(() => {
                $(() => {
                    $effect('a');
                }, (h) => (e: any) => h!(e + 'b'))();
            }, (_) => (a: any) => effects.push(a))
            func();
            expect(effects).toEqual(['ab']);
            func();
            func();
            expect(effects).toEqual(['ab', 'ab', 'ab']);
        });
    })

    describe('$fork and $merge', () => {
        test('should create new execution context', () => {
            const func = $((value: number) => {
                $fork(value)
                const result = $value(() => value);
                $merge()
                return result;
            });

            const a = func(1);
            expect(a.current).toEqual(1);
            const a2 = func(3);
            expect(a2.current).toEqual(3);
            a.current = 2;
            expect(a.current).toEqual(2);
            expect(a2.current).toEqual(3);
        });
    });

})
