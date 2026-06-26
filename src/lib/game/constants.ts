import type { HumanoidCard, Supplier, Job, Continent, MarketEvent, PlayerState, Sector, WorkerType } from './types.js';
import humanoidData from './data/humanoids.json';
import supplierData from './data/suppliers.json';
import jobData from './data/jobs.json';

export const STARTING_CASH = 100;
export const STARTING_REPUTATION = 25;
export const STARTING_ACTION_POINTS = 2;
export const MAX_ROUNDS = 10;
export const LOSS_CASH_THRESHOLD = -20;
export const WIN_REPUTATION_THRESHOLD = 50;
export const WIN_JOBS_THRESHOLD = 6;

export const PLAYER_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b'];
export const PLAYER_NAMES = ['Blauw', 'Rood', 'Groen', 'Geel'];

export const ACTION_COSTS = {
	BUY_HUMANOID: { actionPoints: 1 },
	UPGRADE_HUMANOID: { cash: 20, actionPoints: 1 },
	CONTRACT_SUPPLIER: { actionPoints: 1 },
	RUN_COMPLIANCE_CHECK: { cash: 10, actionPoints: 1 },
	TRAIN_HUMANOID: { cash: 15, actionPoints: 1 },
	ASSIGN_JOB: { actionPoints: 1 },
	EXPAND_REGION: { cash: 25, actionPoints: 1 },
	BUY_ACTION_POINT: { actionPoints: 0 },
} as const;

export const CONTINENT_CONFIG: Record<Continent, { name: string; baseCompliance: number; description: string }> = {
	'europe': { name: 'Europa', baseCompliance: 80, description: 'Streng, hoge compliance-kost, hoge reputatiewinst' },
	'north-america': { name: 'Noord-Amerika', baseCompliance: 60, description: 'Commercieel snel, middelmatige compliance' },
	'south-america': { name: 'Zuid-Amerika', baseCompliance: 40, description: 'Prijsgevoelig, logistieke uitdagingen' },
	'asia': { name: 'Azië', baseCompliance: 50, description: 'Sterke productie, snellere beschikbaarheid' },
	'africa': { name: 'Afrika', baseCompliance: 30, description: 'Groeiende markt, beperkte infrastructuur' },
	'oceania': { name: 'Oceanië', baseCompliance: 55, description: 'Nichemarkt, hoge operationele kosten' },
};

export const SECTOR_TYPE_BONUS: Record<Sector, { preferred: WorkerType; bonus: number; label: string }> = {
	healthcare: { preferred: 'human', bonus: 12, label: 'Empathie-bonus (mens)' },
	retail: { preferred: 'human', bonus: 10, label: 'Klantcontact-bonus (mens)' },
	logistics: { preferred: 'robot', bonus: 12, label: 'Precisie-bonus (robot)' },
	facility: { preferred: 'robot', bonus: 10, label: 'Efficiëntie-bonus (robot)' },
	agriculture: { preferred: 'robot', bonus: 8, label: 'Kracht-bonus (robot)' },
};

export const TRAINING_COST: Record<WorkerType, number> = {
	robot: 25,
	human: 15,
};

export const TRAINING_MULTIPLIER: Record<WorkerType, number> = {
	robot: 2.0,
	human: 0.5,
};

export const UPGRADE_MULTIPLIER: Record<WorkerType, number> = {
	robot: 2.0,
	human: 0.5,
};

export const HUMANOID_CARDS: HumanoidCard[] = humanoidData as HumanoidCard[];

export const SUPPLIERS: Supplier[] = supplierData as Supplier[];

export const BUY_ACTION_POINT_COST = 15;

function generateJobs(): Job[] {
	const sectors = jobData as Array<{ sector: Sector; jobs: Array<{ title: string; explanation: string }> }>;
	const continents: Continent[] = ['europe', 'north-america', 'south-america', 'asia', 'africa', 'oceania'];
	const jobs: Job[] = [];
	let id = 1;

	for (const { sector, jobs: sectorJobs } of sectors) {
		const originalCount = 4;
		for (let i = 0; i < sectorJobs.length; i++) {
			const { title, explanation } = sectorJobs[i];
			const continent = continents[id % continents.length];
			const isNewJob = i >= originalCount;
			jobs.push({
				id: `j${id}`,
				title,
				sector,
				continent,
				requiredSkill: isNewJob ? 15 + Math.floor(id * 2.3 % 25) : 30 + Math.floor(id * 3.7 % 40),
				complianceLevel: Math.floor(CONTINENT_CONFIG[continent].baseCompliance * (isNewJob ? 0.5 : 0.8)),
				risk: isNewJob ? 2 + (id % 8) : 5 + (id % 15),
				reward: isNewJob ? 10 + Math.floor(id * 1.7 % 15) : 15 + Math.floor(id * 2.3 % 25),
				reputationReward: isNewJob ? 2 + (id % 5) : 3 + (id % 8),
				explanation,
			});
			id++;
		}
	}
	return jobs;
}

export const ALL_JOBS: Job[] = generateJobs();

export const MARKET_EVENTS: MarketEvent[] = [
	{
		id: 'me1',
		title: 'Stijgende loonkosten',
		description: 'Healthcare sector betaalt hogere rewards deze ronde.',
		apply: (state: PlayerState) => state,
	},
	{
		id: 'me2',
		title: 'Nieuwe regelgeving',
		description: 'Europa verscherpt compliance eisen.',
		apply: (state: PlayerState) => ({
			...state,
			continents: {
				...state.continents,
				'europe': { ...state.continents['europe'], complianceScore: Math.max(0, state.continents['europe'].complianceScore - 10) }
			}
		}),
	},
	{
		id: 'me3',
		title: 'Leveringsproblemen',
		description: 'Humanoids zijn tijdelijk duurder.',
		apply: (state: PlayerState) => state,
	},
	{
		id: 'me4',
		title: 'Subsidieprogramma',
		description: 'Compliance checks kosten deze ronde minder.',
		apply: (state: PlayerState) => state,
	},
	{
		id: 'me5',
		title: 'Personeelstekort piekt',
		description: 'Meer opdrachten beschikbaar in logistiek.',
		apply: (state: PlayerState) => state,
	},
];
