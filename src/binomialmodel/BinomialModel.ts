import {DiagonalMatrix} from "./DiagonalMatrix";
import {BinomialModelProps} from "./BinomialModelProps";
import {UnderlyingAsset, CashFlow, MarketValue} from "./BinomialModelTypes";

interface RealOptionCell {
    X: UnderlyingAsset;
    Y: CashFlow;
    V: MarketValue;
}

class BinomialModel {
    private matrix: DiagonalMatrix<RealOptionCell>;
    private props: BinomialModelProps;

    constructor(props: BinomialModelProps) {
        this.matrix = new DiagonalMatrix<RealOptionCell>(
            props.steps,
            {
                X: -1,
                Y: 0,
                V: 0,
            },
            {
                X: null,
                Y: null,
                V: null,
            }
        );
        this.props = props;
    }

    /**
     * `valuate()` must be called before calling `getMarketValue()`
     */
    getMarketValue() {
        return this.matrix.matrix[0][0].V;
    }

    /**
     * `valuate()` must be called before calling `getMarketValue()`
     */
    valuate() {
        // underlyingVariable
        for (let x = this.props.steps - 1; x >= 0; x--) {
            for (let y = 0; y <= x; y++) {
                const underlyingVariable = this.props.underlyingVariable(x, y);
                this.matrix.matrix[y][x].X = underlyingVariable;
            }
        }

        // cash flow
        for (let x = this.props.steps - 1; x >= 0; x--) {
            for (let y = 0; y <= x; y++) {
                const underlyingVariable = this.matrix.matrix[y][x].X;
                const cashFlow = this.props.cashFlow(underlyingVariable, x, y);
                this.matrix.matrix[y][x].Y = cashFlow;
            }
        }

        // market value
        for (let x = this.props.steps - 1; x >= 0; x--) {
            for (let y = 0; y <= x; y++) {
                const xCurrent = this.matrix.matrix[y][x].X;
                const xUp =
                    x !== this.props.steps - 1
                        ? this.matrix.matrix[y][x + 1].X
                        : 0;
                const xDown =
                    x !== this.props.steps - 1
                        ? this.matrix.matrix[y + 1][x + 1].X
                        : 0;

                const yCurrent = this.matrix.matrix[y][x].Y;

                const vUp =
                    x !== this.props.steps - 1
                        ? this.matrix.matrix[y][x + 1].V
                        : 0;
                const vDown =
                    x !== this.props.steps - 1
                        ? this.matrix.matrix[y + 1][x + 1].V
                        : 0;

                const marketValue = this.props.marketValue(
                    xCurrent,
                    xUp,
                    xDown,
                    yCurrent,
                    null,
                    null,
                    vUp,
                    vDown,
                    this.props.riskPremium
                );
                this.matrix.matrix[y][x].V = marketValue;
            }
        }
    }

    printProp(prop: keyof RealOptionCell, id: string | undefined = "") {
        if (id) {
            console.log(id);
        }

        let maxLength = 0;

        const minLength = (str: number) => {
            const num = str === null ? "" : str.toFixed(2);
            const big = `${" ".repeat(maxLength + 10)}${num}`;

            return big.slice(big.length - maxLength - 2, big.length);
        };

        for (let x = this.props.steps - 1; x >= 0; x--) {
            for (let y = 0; y <= x; y++) {
                const val = this.matrix.matrix[y][x][prop].toFixed(2);
                if (val.length > maxLength) maxLength = val.length;
            }
        }

        this.matrix.matrix.forEach((row, i) => {
            const rowStr = row.map(x => minLength(x[prop])).join("");

            console.log(rowStr);
        });
    }
}

export {BinomialModel};
