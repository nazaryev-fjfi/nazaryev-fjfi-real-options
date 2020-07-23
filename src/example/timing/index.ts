import {BinomialModel} from "../../binomialmodel/BinomialModel";
import {BinomialModelProps} from "../../binomialmodel/BinomialModelProps";
import {
    UnderlyingAsset,
    CashFlow,
    MarketValue,
    RiskPremium,
} from "../../binomialmodel/BinomialModelTypes";
import CAPM from "../../capm/CAPM";


const pricePerPFLOPS = 100000;
const newClusterCost = 200000;
const clusterCostPerPeriod = 50000;

const MAX_YEARS = 4

const nextStep = (
    X: UnderlyingAsset,
    numberOfClusters: number,
    depth: number = 1,
): BinomialModelProps => {
    const marketRiskPremium = 0.1
    const capmBeta = 0.65
    const riskPremium = 0.05
    const factorUp = 1.26;
    const factorDown = 1 / factorUp;

    return {
        steps: 4,
        riskPremium: 0.1,

        marketRiskPremium,
        capmBeta,

        underlyingVariable: (steps, downs) => {
            if (downs > steps) return null;

            const pflops = X;

            return (
                pflops *
                Math.pow(factorUp, steps - downs) *
                Math.pow(factorDown, downs)
            );
        },
        cashFlow: (x, step, downs) => {
            const xPerCluster = 2
            const maxAvailable = numberOfClusters * xPerCluster < x ? numberOfClusters * xPerCluster : x;

            return (
                maxAvailable * pricePerPFLOPS - numberOfClusters * clusterCostPerPeriod
            );
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
                capmBeta
            )

            const {riskNeutralDown, riskNeutralUp} = CAPM.riskNeutralProbabilitiesFromK(K, {
                up: factorUp,
                down: factorDown,
            })

            const isEndNode = Boolean(!xUp && !xDown)

            if (Math.abs(riskNeutralDown + riskNeutralUp - 1) < 0.0001 && !isEndNode) {
                const marketValue =
                    yCurrent +
                    (riskNeutralUp * vUp + riskNeutralDown * vDown) / (1 + r);

                return marketValue;
            }

            if (isEndNode && depth <= MAX_YEARS) {
                const opt_I = nextStep(
                    xCurrent,
                    numberOfClusters + 1,
                    depth + 1,
                );
                const opt_W = nextStep(
                    xCurrent,
                    numberOfClusters,
                    depth + 1
                );

                const tree_I = new BinomialModel(opt_I);
                const tree_W = new BinomialModel(opt_W);

                tree_I.valuate();
                tree_W.valuate();

                const maxV = Math.max(
                    tree_I.getMarketValue() - newClusterCost,
                    tree_W.getMarketValue(),
                    yCurrent,
                );

                return yCurrent + maxV;
            }

            return yCurrent;
        },
    };
};

export default () => {
    const bm1 = new BinomialModel(nextStep(1, 1));
    bm1.valuate();
    console.log(`${pricePerPFLOPS}    ${bm1.getMarketValue()}`);
    bm1.printProp("X", "PFLOPS Demand (X):");
    bm1.printProp("Y", "Cash Flow (Y):");
    bm1.printProp("V", "Market Value (V):");
};
