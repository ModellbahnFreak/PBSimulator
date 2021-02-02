export function compile(input) {
    return input.split("\n").map((cmd) => {});
}

export function loader(memFile) {
    return new Uint32Array(
        memFile
            .split("\n")
            .filter(
                (l) => l.length > 0 && !l.startsWith("@") && !l.startsWith(";")
            )
            .map((v) => parseInt(v.trim(), 16))
    );
}
