import {$, $useEffect, $useMemo, $useState} from "../src";
import {StateUpdated} from "../src/extensions";

describe('extensions of dollar-js', () => {
    describe('$useMemo', () => {
        test('should cache value on deps change', () => {
            const func = $((value: number, deps: any[]) => {
                return $useMemo(() => value, deps);
            });
            expect(func(1, [])).toBe(1);
            expect(func(2, ['a'])).toBe(2);
            expect(func(3, ['a'])).toBe(2);
            expect(func(4, ['b'])).toBe(4);
            expect(func(5, ['a', 'b'])).toBe(5);
            expect(func(6, ['a', 'b'])).toBe(5);
        });
    })

    describe('$useEffect', () => {
        test('should cache value on deps change', () => {
            let effects = 0;
            let disposes = 0;
            const func = $((deps: Array<any>) => {
                return $useEffect(() => {
                    effects++;
                    return () => disposes++;
                }, deps);
            });
            func([]);
            expect([effects, disposes]).toEqual([1, 0]);
            func([]);
            expect([effects, disposes]).toEqual([1, 0]);
            func(['a']);
            expect([effects, disposes]).toEqual([2, 1]);
        });
    })

    describe('$useState', () => {
        test('should emit StateUpdated $effect on value change', () => {
            const effects = Array();
            const func = $(() => {
                return $useState(() => {
                    return 0;
                });
            }, (_) => (e: any) => effects.push(e));
            expect(func().get()).toEqual(0);
            func().set(1);
            expect(effects.length).toEqual(1);
            func().set(1);
            func().set(1);
            expect(effects.length).toEqual(3);
            expect(effects.every((e) => e instanceof StateUpdated)).toBeTruthy();
        });
    })


})
