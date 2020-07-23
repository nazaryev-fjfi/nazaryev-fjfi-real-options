import {BinomialModel} from "../../binomialmodel/BinomialModel";
import {BinomialModelProps} from "../../binomialmodel/BinomialModelProps";
import {
    UnderlyingAsset,
    CashFlow,
    MarketValue,
    RiskPremium,
} from "../../binomialmodel/BinomialModelTypes";
import CAPM, {SpanningAssetZ} from "../../capm/CAPM";

export default () => {
    const steps = 4;
    const riskPremium = 0.05;
    const capmBeta = 0.7;
    const marketRiskPremium = 0.1;
    const factorUp = 1.1;
    const factorDown = 1 / factorUp;

    const props: BinomialModelProps = {
        steps,
        riskPremium,
        capmBeta,
        marketRiskPremium,

        underlyingVariable: (steps, downs) => {
            if (downs > steps) return null;

            return (
                50 *
                Math.pow(factorUp, steps - downs) *
                Math.pow(factorDown, downs)
            );
        },
        cashFlow: (x, step, downs) => {
            const rev = 10000 * x
            const exp = (35 + step) * 10000

            return rev - exp
        },
        marketValue: (
            xCurrent: UnderlyingAsset,
            xUp: UnderlyingAsset,
            xDown: UnderlyingAsset,
            yCurrent: CashFlow,
            yUp: CashFlow,
            yDown: CashFlow,
            vUp: MarketValue,
            vDown: MarketValue,
            r: RiskPremium
        ) => {
            const K = CAPM.calculateK({
                    up: factorUp,
                    down: factorDown,
                }, {
                    down: 0.5,
                    up: 0.5,
                },
                marketRiskPremium,
                riskPremium,
                capmBeta)

            const { riskNeutralDown, riskNeutralUp } = CAPM.riskNeutralProbabilitiesFromK(K, {
                up: factorUp,
                down: factorDown,
            })

            // end nodes
            if (Math.abs(riskNeutralUp + riskNeutralDown - 1) < 0.001) {
                const marketValue =
                    yCurrent +
                    (riskNeutralUp * vUp + riskNeutralDown * vDown) / (1 + r);

                return marketValue;
            }

            return yCurrent;
        },
    };

    const bm1 = new BinomialModel(props);

    bm1.valuate();

    bm1.printProp("X", "Underlying Variable (X):");
    bm1.printProp("Y", "Cash Flow (Y):");
    bm1.printProp("V", "Market Value (V):");
};
