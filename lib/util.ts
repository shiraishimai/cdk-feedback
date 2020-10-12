export function toUpperCamelCase(input: any): any {
    // If input is an Array, map values
    if (Array.isArray(input)) {
        return input.map(entry => toUpperCamelCase(entry));
    }
    // If input is not an Array and not an Object, return value
    if (typeof input !== "object" || input === null) return input;

    return Object.entries(input).map(([key, value]: [string, any]) => {
        return [`${key.slice(0, 1).toUpperCase()}${key.slice(1)}`, toUpperCamelCase(value)];
    })
        // Mitigate Object.fromEntries possibly not exist in deployment Node version
        .reduce(function fromEntries(reconstruct, [key, value]) {
            reconstruct[key] = value;
            return reconstruct;
        }, {} as any);
}