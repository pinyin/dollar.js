import {$, $effect, $scope, $variable} from "../src";

describe('core logic of dollar-js', () => {
    describe('$ and $Variable', () => {
        describe('$variable', () => {
            test('should save value in order', () => {
                const inc = $(() => {
                    const value = $variable(() => 0);
                    const value2 = $variable(() => 0);
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
        test('should create new variables stack', () => {
            const func = $((value: number) => {
                const $results = $scope(value)
                const result = $variable(() => value);
                $results.exit;
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
