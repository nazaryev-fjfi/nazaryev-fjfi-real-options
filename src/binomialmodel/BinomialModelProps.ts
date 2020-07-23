import {
    GrowthFactor,
    UnderlyingAsset,
    NodeProbability,
    CashFlow,
    MarketValue,
    RiskPremium, MarketRiskPremium,
} from "./BinomialModelTypes";
import {CapmBeta, SpanningAssetZ} from "../capm/CAPM";

export interface BinomialModelProps {
    steps: number;
    riskPremium: RiskPremium;
    marketRiskPremium: MarketRiskPremium;
    capmBeta: CapmBeta

    underlyingVariable(step: number, downs: number): UnderlyingAsset;

    marketValue(
        xCurrent: UnderlyingAsset,
        xUp: UnderlyingAsset,
        xDown: UnderlyingAsset,
        yCurrent: CashFlow,
        yUp: CashFlow,
        yDown: CashFlow,
        vUp: MarketValue,
        vDown: MarketValue,
        r: RiskPremium
    ): MarketValue;

    cashFlow(x: UnderlyingAsset, step: number, downs: number): CashFlow;
}
