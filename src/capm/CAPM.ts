import {MarketRiskPremium, RiskPremium, UnderlyingAsset} from "../binomialmodel/BinomialModelTypes";

export type SpanningAssetZ = number
export type CapmK = number
export type CapmBeta = number

export default class CAPM {
    public static calculateZ(
        X: { up: number, down: number },
        p: { up: number, down: number },
        marketRiskPremium: MarketRiskPremium,
        riskPremium: RiskPremium,
        capmBeta: CapmBeta,
    ): SpanningAssetZ {
        return ((X.up * p.up + X.down + p.down) - marketRiskPremium * capmBeta) / (1 + riskPremium)
    }

    public static calculateK(
        factors: { up: number, down: number },
        p: { up: number, down: number },
        marketRiskPremium: MarketRiskPremium,
        riskPremium: RiskPremium,
        capmBeta: CapmBeta,
    ): CapmK {
        const expectedRx = (factors.up * p.up + factors.down * p.down)
        return expectedRx - capmBeta * marketRiskPremium
    }

    public static riskNeutralProbabilitiesFromK(K: CapmK, factors: { up: number, down: number }):
        { riskNeutralUp: number, riskNeutralDown: number } {
        const riskNeutralUp = (K - factors.down) / (factors.up - factors.down)
        const riskNeutralDown = (factors.up - K) / (factors.up - factors.down)

        return {
            riskNeutralUp,
            riskNeutralDown,
        }
    }

    public static riskNeutralProbabilitiesFromEverything({
        factors, probabilities, marketRiskPremium, riskPremium, capmBeta
    }: {
        factors: { up: number, down: number },
        probabilities: { up: number, down: number },
        marketRiskPremium: MarketRiskPremium,
        riskPremium: RiskPremium,
        capmBeta: CapmBeta,
    }): { riskNeutralUp: number, riskNeutralDown: number } {
        const K = CAPM.calculateK(factors, probabilities,
            marketRiskPremium,
            riskPremium,
            capmBeta
        )

        return CAPM.riskNeutralProbabilitiesFromK(K, factors)
    }
}
