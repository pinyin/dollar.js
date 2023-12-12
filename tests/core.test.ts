import {$, $effect, $scope, $stack, scope$} from "../src";
import {$heap} from "../src/core";

describe('core logic of dollar-js', () => {
    describe('$ and $Value', () => {
        describe('$stack', () => {
            test('should save value in order', () => {
                const inc = $(() => {
                    const value = $stack(() => 0);
                    const value2 = $stack(() => 0);
                    value.current++;
                    value2.current += 2;
                    return [value.current, value2.current];
                })
                expect(inc()).toEqual([1, 2]);
                expect(inc()).toEqual([2, 4]);
                expect(inc()).toEqual([3, 6]);
                expect(inc()).toEqual([4, 8]);
            });
        });

        describe('$heap', () => {
            test('should save value with same key', () => {
                const inc = $(() => {
                    const value = $heap(1, () => 0);
                    let value2Current = 0;
                    if (value.current % 3 === 0) {
                        const value2 = $heap(1, () => 8);
                        value2.current++;
                        value2Current = value2.current;
                    }
                    const value3 = $heap(2, () => 0);
                    value.current++;
                    value3.current += 2;
                    return [value.current, value2Current, value3.current];
                })
                expect(inc()).toEqual([2, 1, 2]);
                expect(inc()).toEqual([3, 0, 4]);
                expect(inc()).toEqual([5, 4, 6]);
                expect(inc()).toEqual([6, 0, 8]);
                expect(inc()).toEqual([8, 7, 10]);
            });
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

    describe('$scope', () => {
        test('should create new execution context', () => {
            const func = $((value: number) => {
                $scope(value)
                const result = $stack(() => value);
                scope$()
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
