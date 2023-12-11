# dollar.ts

Use React Hooks without React**.

** with if/for/recursive hook support

## Usage

Instead of hooks' `useXXX` in React, dollar.ts uses `$` to identify their limitations.
So we'll call them ***Dollar Functions***.

### Create Dollar Functions

Wrap your function with `$` to create a dollar function, then call it anywhere.

```typescript
import {$, $useMemo} from "dollar.ts";

const func = $((value: number, deps: Array<any>) => {
    return $useMemo(() => value, deps);
});
expect(func(1, [])).toBe(1);
expect(func(2, ['a'])).toBe(2);
expect(func(3, ['a'])).toBe(2);
expect(func(4, ['b'])).toBe(4);
expect(func(5, ['a', 'b'])).toBe(5);
expect(func(6, ['a', 'b'])).toBe(5);
```

### Use Dollar Functions with if/for/switch...

To use JavaScript's native control imperatives, wrap them with `$fork()` and `$merge()`.

```typescript
const condition: boolean = true;
$fork(condition);
if (condition) {
    // A
}
// B
$merge()
```

When `condition` is `true` or `false`, `Dollar Function` calls in `A` and `B` would have different values.

###           

Only synchronous dollar functions are supported now, asynchronous/generator functions support is planned.

## License

MIT

Notice: this library is different from https://www.npmjs.com/package/dollar-js