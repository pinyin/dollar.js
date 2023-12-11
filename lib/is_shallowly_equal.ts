export function isShallowlyEqual(a: Array<any>, b: Array<any>) {
    if (a.length != b.length)
        return false;
    else {
        for (let i = 0; i < a.length; i++)
            if (a[i] != b[i])
                return false;
        return true;
    }
}