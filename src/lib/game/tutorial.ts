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
		message: 'Je runt een humanoid-uitzendbureau. Koop robots en mensen, zet ze in op opdrachten, en bouw je bedrijf uit over 10 rondes. Na 10 rondes wint de speler met de hoogste Impact Score. Laten we samen een oefenronde spelen!',
		position: 'center',
	},
	{
		id: 'board',
		title: 'De wereldkaart',
		message: 'Dit is je speelbord met 6 continenten. Je start in Europa. Andere continenten kun je ontgrendelen voor 25 cash — dat geeft toegang tot nieuwe opdrachten én duurzaamheidspunten in je Impact Score.',
		position: 'top',
		highlight: 'board',
	},
	{
		id: 'resources',
		title: 'Je resources',
		message: 'Rechtsboven zie je je spelerinfo. Je start met 100 cash en 25 reputatie. Let op: als je cash onder -20 of reputatie onder 0 zakt, verlies je onmiddellijk! Elke ronde heb je 2 actiepunten.',
		position: 'bottom-right',
		highlight: 'players',
	},
	{
		id: 'buy-humanoid',
		title: 'Stap 1: Koop een humanoid',
		message: 'Klik op "Koop Humanoid" in de actiebalk. Robots zijn goedkoop en groeien snel door training (+16 skill), maar hebben lage startskills. Mensen zijn duurder met hogere startskills maar groeien langzamer (+4 skill per training). Een mix geeft Vertrouwen-punten!',
		position: 'bottom',
		highlight: 'actions',
		action: 'BUY_HUMANOID',
	},
	{
		id: 'humanoid-bought',
		title: 'Goed gedaan!',
		message: 'Je hebt je eerste humanoid! Rechts zie je de kaart met skills per sector (zorg, logistiek, etc.). Bij opdrachten telt de skill-match mee, plus betrouwbaarheid, training, compliance en een dobbelsteen (-5 tot +5).',
		position: 'bottom-right',
		highlight: 'humanoids',
	},
	{
		id: 'select-job',
		title: 'Stap 2: Kies een opdracht',
		message: 'Links zie je beschikbare opdrachten. Elke opdracht heeft een sector, risico en beloning. Let op: in ronde 1 mag je maximaal 1 opdracht uitvoeren. Kies een opdracht in Europa!',
		position: 'bottom-left',
		highlight: 'jobs',
		action: 'SELECT_JOB',
	},
	{
		id: 'select-humanoid',
		title: 'Stap 3: Selecteer je humanoid',
		message: 'Klik nu op je humanoid rechts. Tip: kies een humanoid waarvan de sector-skill past bij de opdracht. Mens is sterker in zorg en retail, robot in logistiek, facilitair en agri.',
		position: 'bottom-right',
		highlight: 'humanoids',
		action: 'SELECT_HUMANOID',
	},
	{
		id: 'assign-job',
		title: 'Stap 4: Voer de opdracht uit',
		message: 'Klik op "Voer Opdracht Uit". De score bepaalt het resultaat: 70+ = succes (volle beloning), 50-69 = gedeeltelijk (halve beloning), onder 50 = mislukt (-10 cash, -5 reputatie). Een dobbelsteen voegt -5 tot +5 toe — soms heb je geluk!',
		position: 'bottom',
		highlight: 'actions',
		action: 'ASSIGN_JOB',
	},
	{
		id: 'result',
		title: 'Resultaat!',
		message: 'Bekijk het resultaat in de event log. Succesvolle opdrachten leveren cash en reputatie op. Mislukte opdrachten kosten -10 cash en -5 reputatie, en kunnen een compliance-fout veroorzaken. Na 3 compliance-fouten in één continent verlies je!',
		position: 'bottom',
	},
	{
		id: 'end-turn',
		title: 'Stap 5: Beëindig je beurt',
		message: 'Klik op "Beurt beëindigen". Er verschijnt een overzicht met je voortgang: cash, reputatie, opdrachten en je Impact Score. Let op: aan het einde worden onderhoudskosten per humanoid afgetrokken. Elke humanoid heeft een vaste onderhoudskost.',
		position: 'bottom',
		highlight: 'actions',
		action: 'END_TURN',
	},
	{
		id: 'done',
		title: 'Tutorial voltooid!',
		message: 'Je kent nu de basis! Strategie-tips: train robots vroeg (ze groeien snel), houd een mix mens/robot aan voor Vertrouwen, breid uit naar 2-3 continenten voor Duurzaamheid, en laat humanoids niet ongebruikt (na 2 beurten krijg je Complexiteit-straf). Na 10 rondes wint wie de hoogste Impact Score heeft. Veel succes!',
		position: 'center',
	},
];
