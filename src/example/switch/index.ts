import { BinomialModel } from "../../binomialmodel/BinomialModel";
import { BinomialModelProps } from "../../binomialmodel/BinomialModelProps";
import {
	UnderlyingAsset,
	CashFlow,
	MarketValue,
	RiskPremium,
} from "../../binomialmodel/BinomialModelTypes";
import CAPM from "../../capm/CAPM";

type PricingPlan = {
	monthlyPrice: number
	shareOfAllUsers: number // from 0 to 1
}

type StateOfTheProject = {
	initialNumberOfUsersOfThePhase: UnderlyingAsset
	plans: Array<PricingPlan>
}

// Model params
const steps = 6
const capmBeta = 0.5
const marketRiskPremium = 0.05
const factorUp = 1.1
const factorDown = 1 / factorUp
const riskPremium = 0.05
const probabilities = { up: 0.5, down: 0.5 }

// Project params
const fixedCost = 10000
const pricePerUser = 0.4

const numberOfUnderlyingUsers = (projectState: StateOfTheProject) => (steps: number, downs: number) => {
	if (downs > steps) return null;

	const users = projectState.initialNumberOfUsersOfThePhase;

	return (
		users *
		Math.pow(factorUp, steps - downs) *
		Math.pow(factorDown, downs)
	);
}

const cashFlowOfProject = (projectState: StateOfTheProject) => (x: UnderlyingAsset) => {
	const varCost = x * pricePerUser
	const totalCost = fixedCost + varCost

	return projectState.plans.reduce((revenue, plan) => {
		return revenue + (plan.shareOfAllUsers * x) * plan.monthlyPrice
	}, 0) - totalCost
}

const pricingPhaseFactory = (marketValueByProjectState: (projectState: StateOfTheProject) => BinomialModelProps['marketValue']) =>
	(projectState: StateOfTheProject): BinomialModelProps => ({
	steps,
	riskPremium,
	marketRiskPremium,
	capmBeta,

	underlyingVariable: numberOfUnderlyingUsers(projectState),
	cashFlow: cashFlowOfProject(projectState),
	marketValue: marketValueByProjectState(projectState),
})

// Last phase (18th month)
const Strategy5AndStop = pricingPhaseFactory((projectState => {
	return (
		xCurrent,
		xUp,
		xDown,
		yCurrent,
		yUp,
		yDown,
		vUp,
		vDown,
		r
	) => {
		const { riskNeutralDown, riskNeutralUp } = CAPM.riskNeutralProbabilitiesFromEverything({
			factors: {
				up: factorUp,
				down: factorDown,
			},
			probabilities,
			marketRiskPremium,
			riskPremium,
			capmBeta,
		})

		const isEndNode = !xUp

		/**
		 * end node
		 */
		if (isEndNode) {
			return yCurrent;
		}

		if (Math.abs(riskNeutralDown + riskNeutralUp - 1) < 0.001) {
			return yCurrent +
				(riskNeutralUp * vUp + riskNeutralDown * vDown) / (1 + r);
		}

		return yCurrent;
	}
}))
// Last phase (18th month) -- doesn't have any options, will just return CF
const StrategyFreeAnd5AndStop = Strategy5AndStop
// Last phase (18th month) -- doesn't have any options, will just return CF
const StrategyFreeAnd10AndStop = Strategy5AndStop
// Last phase (18th month) -- doesn't have any options, will just return CF
const Strategy10And25AndStop = Strategy5AndStop

// phase 12th month
const StrategyFreeAnd5 =  pricingPhaseFactory((projectState => {
	return (
		xCurrent,
		xUp,
		xDown,
		yCurrent,
		yUp,
		yDown,
		vUp,
		vDown,
		r
	) => {
		const { riskNeutralDown, riskNeutralUp } = CAPM.riskNeutralProbabilitiesFromEverything({
			factors: {
				up: factorUp,
				down: factorDown,
			},
			probabilities,
			marketRiskPremium,
			riskPremium,
			capmBeta,
		})

		const isEndNode = !xUp

		/**
		 * end node. many users => introduce new paid plan
		 */
		if (isEndNode && xCurrent >= 40000) {
			const opts = Strategy5AndStop({
				initialNumberOfUsersOfThePhase: xCurrent,
				plans: [{
					monthlyPrice: 5,
					shareOfAllUsers: 1,
				}]
			});

			const tree = new BinomialModel(opts);
			tree.valuate();
			return yCurrent + tree.getMarketValue();
		}

		/**
		 * end node. few users => introduce cheaper plan.
		 */
		if (isEndNode && xCurrent <= 25000) {
			const opts = StrategyFreeAnd5AndStop({
				initialNumberOfUsersOfThePhase: xCurrent,
				plans: [{
					monthlyPrice: 5,
					shareOfAllUsers: 0.2,
				}, {
					monthlyPrice: 0,
					shareOfAllUsers: 0.8,
				}]
			});

			const tree = new BinomialModel(opts);
			tree.valuate();
			return yCurrent + tree.getMarketValue();
		}

		if (Math.abs(riskNeutralDown + riskNeutralUp - 1) < 0.001) {
			return yCurrent +
				(riskNeutralUp * vUp + riskNeutralDown * vDown) / (1 + r);
		}

		return yCurrent;
	}
}))

// phase 12th month
const StrategyFreeAnd10And25 = pricingPhaseFactory((projectState => {
	return (
		xCurrent,
		xUp,
		xDown,
		yCurrent,
		yUp,
		yDown,
		vUp,
		vDown,
		r
	) => {
		const { riskNeutralDown, riskNeutralUp } = CAPM.riskNeutralProbabilitiesFromEverything({
			factors: {
				up: factorUp,
				down: factorDown,
			},
			probabilities,
			marketRiskPremium,
			riskPremium,
			capmBeta,
		})

		const isEndNode = !xUp

		/**
		 * end node. many users => introduce new paid plan
		 */
		if (isEndNode && xCurrent >= 40000) {
			const opts = Strategy10And25AndStop({
				initialNumberOfUsersOfThePhase: xCurrent / 3,
				plans: [{
					monthlyPrice: 10,
					shareOfAllUsers: 0.6,
				}, {
					monthlyPrice: 25,
					shareOfAllUsers: 0.4,
				}]
			});

			const tree = new BinomialModel(opts);
			tree.valuate();
			return yCurrent + tree.getMarketValue();
		}

		/**
		 * end node. few users => introduce cheaper plan.
		 */
		if (isEndNode && xCurrent <= 25000) {
			const opts = StrategyFreeAnd10AndStop({
				initialNumberOfUsersOfThePhase: xCurrent,
				plans: [{
					monthlyPrice: 10,
					shareOfAllUsers: 0.25,
				}, {
					monthlyPrice: 0,
					shareOfAllUsers: 0.75,
				}]
			});

			const tree = new BinomialModel(opts);
			tree.valuate();
			return yCurrent + tree.getMarketValue();
		}

		if (Math.abs(riskNeutralDown + riskNeutralUp - 1) < 0.001) {
			return yCurrent +
				(riskNeutralUp * vUp + riskNeutralDown * vDown) / (1 + r);
		}

		return yCurrent;
	}
}))

// phase 6th month
const StrategyFreeAnd10 = pricingPhaseFactory((projectState => {
	return (
		xCurrent,
		xUp,
		xDown,
		yCurrent,
		yUp,
		yDown,
		vUp,
		vDown,
		r
	) => {
		const { riskNeutralDown, riskNeutralUp } = CAPM.riskNeutralProbabilitiesFromEverything({
			factors: {
				up: factorUp,
				down: factorDown,
			},
			probabilities,
			marketRiskPremium,
			riskPremium,
			capmBeta,
		})

		const isEndNode = !xUp

		/**
		 * end node. many users => introduce new paid plan
		 */
		if (isEndNode && xCurrent >= 40000) {
			const opts = StrategyFreeAnd10And25({
				initialNumberOfUsersOfThePhase: xCurrent,
				plans: [{
					monthlyPrice: 10,
					shareOfAllUsers: 0.15,
				}, {
					monthlyPrice: 25,
					shareOfAllUsers: 0.1,
				}, {
					monthlyPrice: 0,
					shareOfAllUsers: 0.75,
				}]
			});

			const tree = new BinomialModel(opts);
			tree.valuate();
			return yCurrent + tree.getMarketValue();
		}

		/**
		 * end node. few users => introduce cheaper plan.
		 */
		if (isEndNode && xCurrent <= 25000) {
			const opts = StrategyFreeAnd5({
				initialNumberOfUsersOfThePhase: xCurrent,
				plans: [{
					monthlyPrice: 5,
					shareOfAllUsers: 0.25,
				}, {
					monthlyPrice: 0,
					shareOfAllUsers: 0.75,
				}]
			});

			const tree = new BinomialModel(opts);
			tree.valuate();
			return yCurrent + tree.getMarketValue();
		}

		if (Math.abs(riskNeutralDown + riskNeutralUp - 1) < 0.001) {
			return yCurrent +
				(riskNeutralUp * vUp + riskNeutralDown * vDown) / (1 + r);
		}

		return yCurrent;
	}
}))

const StrategyOnlyFree = pricingPhaseFactory((projectState => {
	return (
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
		const { riskNeutralDown, riskNeutralUp } = CAPM.riskNeutralProbabilitiesFromEverything({
			factors: {
				up: factorUp,
				down: factorDown,
			},
			probabilities,
			marketRiskPremium,
			riskPremium,
			capmBeta,
		})

		const isEndNode = !xUp

		/**
		 * end node. many users => introduce new paid plan
		 */
		if (isEndNode && xCurrent >= 25000) {
			const opts = StrategyFreeAnd10({
				initialNumberOfUsersOfThePhase: xCurrent,
				plans: [{
					monthlyPrice: 10,
					shareOfAllUsers: 0.25,
				}, {
					monthlyPrice: 0,
					shareOfAllUsers: 0.75,
				}]
			});

			const tree = new BinomialModel(opts);
			tree.valuate();
			console.log(xCurrent)
			tree.printProp('Y')
			return yCurrent + tree.getMarketValue();
		}

		/**
		 * end node. few users => abandon.
		 */
		if (isEndNode && xCurrent <= 25000) {
			return yCurrent;
		}

		if (Math.abs(riskNeutralDown + riskNeutralUp - 1) < 0.001) {
			const marketValue =
				yCurrent +
				(riskNeutralUp * vUp + riskNeutralDown * vDown) / (1 + r);

			return marketValue;
		}

		return yCurrent;
	}
}))

export default () => {
	const bm = new BinomialModel(StrategyOnlyFree({
		plans: [
			{
				monthlyPrice: 0,
				shareOfAllUsers: 1,
			}
		],
		initialNumberOfUsersOfThePhase: 25000
	}));

	bm.valuate();
	bm.printProp("X", "Users (X):");
	bm.printProp("Y", "Cash Flow (Y):");
	bm.printProp("V", "Market Value (V):");
};
