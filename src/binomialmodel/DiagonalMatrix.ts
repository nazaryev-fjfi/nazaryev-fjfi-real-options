class DiagonalMatrix<T extends object> {
    private _matrix: T[][];

    constructor(size: number, defaultValue: T, nullValue: T) {
        this._matrix = new Array(size)
            .fill(0)
            .map((val, i) => i)
            .map(i =>
                new Array(size)
                    .fill(0)
                    .map((val, j) => j)
                    .map(j => (j >= i ? {...defaultValue} : {...nullValue}))
            );
    }

    get matrix() {
        return this._matrix;
    }
}

export {DiagonalMatrix};
