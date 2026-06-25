export interface TutorialStep {
	id: string;
	title: string;
	message: string;
	highlight?: string;
	action?: string;
	position: 'center' | 'top' | 'bottom-left' | 'bottom-right' | 'bottom';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
	{
		id: 'welcome',
		title: 'Welkom bij Humanoid Horizons!',
		message: 'In dit spel bouw je een humanoid-uitzendbureau. Je koopt humanoids, zet ze in op opdrachten en beheert je cashflow en reputatie. Laten we samen een oefenronde spelen!',
		position: 'center',
	},
	{
		id: 'board',
		title: 'De wereldkaart',
		message: 'Dit is je speelbord. Elk continent heeft eigen regelgeving en opdrachten. Je start in Europa (blauw). De andere continenten kun je later ontgrendelen.',
		position: 'top',
		highlight: 'board',
	},
	{
		id: 'resources',
		title: 'Je resources',
		message: 'Rechtsboven zie je je spelerinfo: cash, reputatie, humanoids en succesvolle opdrachten. Houd je cash boven -20 en je reputatie boven 0!',
		position: 'bottom-right',
		highlight: 'players',
	},
	{
		id: 'buy-humanoid',
		title: 'Stap 1: Koop een humanoid',
		message: 'Je hebt nog geen humanoids. Klik op "Koop Humanoid" in de actiebalk onderaan om je eerste humanoid te kopen. Elke humanoid heeft unieke vaardigheden.',
		position: 'bottom',
		highlight: 'actions',
		action: 'BUY_HUMANOID',
	},
	{
		id: 'humanoid-bought',
		title: 'Goed gedaan!',
		message: 'Je hebt je eerste humanoid gekocht! Rechts zie je nu je humanoid met zijn vaardigheden. Elke sector (zorg, logistiek, etc.) heeft een andere skill-score.',
		position: 'bottom-right',
		highlight: 'humanoids',
	},
	{
		id: 'select-job',
		title: 'Stap 2: Kies een opdracht',
		message: 'Links zie je de beschikbare opdrachten. Klik op een opdracht in Europa om die te selecteren. Let op de sector en het risico!',
		position: 'bottom-left',
		highlight: 'jobs',
		action: 'SELECT_JOB',
	},
	{
		id: 'select-humanoid',
		title: 'Stap 3: Selecteer je humanoid',
		message: 'Klik nu op je humanoid in het rechterpaneel om die te selecteren. Daarna kun je de opdracht uitvoeren.',
		position: 'bottom-right',
		highlight: 'humanoids',
		action: 'SELECT_HUMANOID',
	},
	{
		id: 'assign-job',
		title: 'Stap 4: Voer de opdracht uit',
		message: 'Klik op "Voer Opdracht Uit" in de actiebalk. Het systeem berekent of je humanoid geschikt is op basis van skills, training en compliance.',
		position: 'bottom',
		highlight: 'actions',
		action: 'ASSIGN_JOB',
	},
	{
		id: 'result',
		title: 'Resultaat!',
		message: 'Je ziet het resultaat in de event log onderaan. Scores boven 70 zijn succes, 50-69 gedeeltelijk, onder 50 mislukt. Bekijk hoe je cash en reputatie veranderen.',
		position: 'bottom',
	},
	{
		id: 'end-turn',
		title: 'Stap 5: Beëindig je beurt',
		message: 'Als je klaar bent (of geen actiepunten meer hebt), klik op "Beurt beëindigen". Aan het einde van je beurt worden onderhoudskosten afgetrokken.',
		position: 'bottom',
		highlight: 'actions',
		action: 'END_TURN',
	},
	{
		id: 'done',
		title: 'Tutorial voltooid!',
		message: 'Je kent nu de basis! Koop humanoids, train ze, zet ze in op opdrachten en breid uit naar nieuwe continenten. Win door na 10 rondes aan minstens 2 van 3 doelen te voldoen: cash > 0, reputatie >= 50, of 6+ succesvolle jobs. Veel succes!',
		position: 'center',
	},
];
