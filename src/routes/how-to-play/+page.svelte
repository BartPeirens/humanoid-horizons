<script lang="ts">
	import { base } from '$app/paths';
</script>

<div class="rules-page">
	<nav class="nav-bar">
		<a href="{base}/" class="back-link">&#x2190; Terug naar start</a>
	</nav>

	<div class="content">
		<h1>Spelregels — Humanoid Horizons</h1>

		<section>
			<h2>Overzicht</h2>
			<p>
				Humanoid Horizons is een strategisch bordspel waarin je een <strong>humanoid-uitzendbureau</strong> runt.
				Je koopt robots en mensen, zet ze in op opdrachten, traint ze, en breidt uit naar nieuwe continenten.
				Het spel duurt <strong>10 rondes</strong>. Aan het einde wint de speler met de hoogste <strong>Impact Score</strong>.
			</p>
		</section>

		<section>
			<h2>Startcondities</h2>
			<ul>
				<li><strong>100 cash</strong> startkapitaal</li>
				<li><strong>25 reputatie</strong></li>
				<li><strong>2 actiepunten</strong> per ronde</li>
				<li>Alleen <strong>Europa</strong> is ontgrendeld</li>
				<li>Geen humanoids — je moet ze kopen</li>
			</ul>
		</section>

		<section>
			<h2>Winnen en verliezen</h2>
			<div class="win-lose-grid">
				<div class="card win-card">
					<h3>Winnen</h3>
					<p>Na 10 rondes wint de speler met de hoogste <strong>Impact Score</strong> (zie onder). Daarnaast kun je persoonlijke doelen behalen — voldoe aan minstens 2 van 3:</p>
					<ul>
						<li>Cash is groter dan 0</li>
						<li>Reputatie is minstens 50</li>
						<li>Minstens 6 succesvolle opdrachten</li>
					</ul>
				</div>
				<div class="card lose-card">
					<h3>Verliezen</h3>
					<p>Je verliest <strong>onmiddellijk</strong> als:</p>
					<ul>
						<li>Je cash onder <strong>-20</strong> zakt</li>
						<li>Je reputatie onder <strong>0</strong> zakt</li>
						<li>Je <strong>3 compliance-fouten</strong> maakt in hetzelfde continent</li>
					</ul>
				</div>
			</div>
		</section>

		<section>
			<h2>Rondestructuur</h2>
			<p>Elke ronde verloopt als volgt:</p>
			<ol>
				<li>Nieuwe opdrachten en humanoids verschijnen in de winkel</li>
				<li>Soms treedt een <strong>markt event</strong> op (40% kans) dat de spelcondities verandert</li>
				<li>Elke speler krijgt <strong>2 actiepunten</strong> om acties uit te voeren</li>
				<li>Je mag maximaal <strong>zoveel opdrachten als het rondenummer</strong> uitvoeren (ronde 1 = max 1, ronde 5 = max 5)</li>
				<li>Als je klaar bent, klik <em>Beurt beëindigen</em> — onderhoudskosten worden afgetrokken</li>
				<li>Na alle spelers begint een nieuwe ronde</li>
			</ol>
		</section>

		<section>
			<h2>Acties (elk kost 1 actiepunt)</h2>
			<div class="actions-grid">
				<div class="action-card card">
					<h3>Koop Humanoid</h3>
					<p>Koop een robot of mens uit de winkel. De prijs verschilt per type.</p>
					<ul class="action-details">
						<li><strong>Robot</strong>: goedkoop, lage skills, lage veiligheid, groeit snel door training</li>
						<li><strong>Mens</strong>: duurder, hogere skills, hoge veiligheid, groeit langzaam</li>
					</ul>
				</div>
				<div class="action-card card">
					<h3>Voer Opdracht Uit</h3>
					<p>Wijs een humanoid toe aan een opdracht. Het systeem berekent een score (zie <em>Scoreberekening</em>).</p>
					<ul class="action-details">
						<li>Humanoid moet beschikbaar zijn (niet in training)</li>
						<li>Continent moet ontgrendeld zijn</li>
					</ul>
				</div>
				<div class="action-card card">
					<h3>Train Humanoid</h3>
					<p>Verbeter een skill in een specifieke sector. De humanoid is <strong>1 beurt niet inzetbaar</strong>.</p>
					<ul class="action-details">
						<li>Robot: kost <strong>25 cash</strong>, levert <strong>+16 skill</strong>, <strong>+15 veiligheid</strong></li>
						<li>Mens: kost <strong>15 cash</strong>, levert <strong>+4 skill</strong></li>
					</ul>
				</div>
				<div class="action-card card">
					<h3>Upgrade Humanoid (20 cash)</h3>
					<p>Herstel conditie en verhoog een skill. Direct effect, geen wachttijd.</p>
					<ul class="action-details">
						<li>Robot: <strong>+20 skill</strong>, <strong>+10 veiligheid</strong>, <strong>+30% conditie</strong></li>
						<li>Mens: <strong>+5 skill</strong>, <strong>+30% conditie</strong></li>
					</ul>
				</div>
				<div class="action-card card">
					<h3>Contracteer Leverancier</h3>
					<p>Geeft permanente skill-bonussen voor opdrachten in specifieke sectoren. Continent moet ontgrendeld zijn.</p>
				</div>
				<div class="action-card card">
					<h3>Uitbreiden (25 cash)</h3>
					<p>Ontgrendel een nieuw continent. Geeft toegang tot opdrachten en leveranciers daar, plus duurzaamheidspunten.</p>
				</div>
				<div class="action-card card">
					<h3>Compliance Check (10 cash)</h3>
					<p>Verhoog je compliance-score in een continent met +15. Hogere compliance verbetert je opdrachtscores daar.</p>
				</div>
			</div>
		</section>

		<section>
			<h2>Scoreberekening bij opdrachten</h2>
			<p>Wanneer je een humanoid op een opdracht zet, wordt de score als volgt berekend:</p>
			<div class="score-table">
				<div class="score-row positive">
					<span class="score-label">Skill match</span>
					<span class="score-desc">De skill van je humanoid in de gevraagde sector (0-100)</span>
				</div>
				<div class="score-row positive">
					<span class="score-label">Betrouwbaarheid</span>
					<span class="score-desc">30% van de betrouwbaarheidsscore van je humanoid</span>
				</div>
				<div class="score-row positive">
					<span class="score-label">Trainingsbonus</span>
					<span class="score-desc">+5 per trainingslevel</span>
				</div>
				<div class="score-row positive">
					<span class="score-label">Compliance</span>
					<span class="score-desc">Verschil tussen jouw compliance en de opdrachteis (x 0.1)</span>
				</div>
				<div class="score-row positive">
					<span class="score-label">Leveranciersbonus</span>
					<span class="score-desc">Extra skill van gecontracteerde leveranciers</span>
				</div>
				<div class="score-row positive">
					<span class="score-label">Type-bonus</span>
					<span class="score-desc">Mens in zorg/retail (+10/+12), robot in logistiek/facilitair/agri (+8/+10/+12)</span>
				</div>
				<div class="score-row negative">
					<span class="score-label">Risico</span>
					<span class="score-desc">Het risicolevel van de opdracht (afgetrokken)</span>
				</div>
				<div class="score-row negative">
					<span class="score-label">Conditie-straf</span>
					<span class="score-desc">Als conditie onder 50%: straf van (50 - conditie) x 0.3</span>
				</div>
				<div class="score-row dice">
					<span class="score-label">Dobbelsteenworp</span>
					<span class="score-desc">2d6 - 7 = een getal van -5 tot +5 (geluk/pech)</span>
				</div>
			</div>

			<h3>Uitkomsten</h3>
			<div class="outcome-grid">
				<div class="outcome success">
					<strong>Score 70+: Succes</strong>
					<p>Volle beloning (cash + reputatie). Conditie -5.</p>
				</div>
				<div class="outcome partial">
					<strong>Score 50-69: Gedeeltelijk</strong>
					<p>Halve cash-beloning, +1 reputatie. Conditie -10.</p>
				</div>
				<div class="outcome failed">
					<strong>Score &lt;50: Mislukt</strong>
					<p>-10 cash, -5 reputatie. Conditie -15. Kans op compliance-fout.</p>
				</div>
			</div>
		</section>

		<section>
			<h2>Einde beurt: onderhoud</h2>
			<p>
				Wanneer je je beurt beëindigt, worden <strong>onderhoudskosten</strong> per humanoid afgetrokken van je cash.
				Elk type humanoid heeft een vaste onderhoudskost die op de kaart staat. Training die bezig was wordt afgerond.
			</p>
		</section>

		<section>
			<h2>Mens vs Robot</h2>
			<table class="comparison-table">
				<thead>
					<tr>
						<th></th>
						<th>Robot</th>
						<th>Mens</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Aankoopprijs</td>
						<td>Goedkoop</td>
						<td>Duurder</td>
					</tr>
					<tr>
						<td>Start-skills</td>
						<td>Laag</td>
						<td>Hoog</td>
					</tr>
					<tr>
						<td>Veiligheid</td>
						<td>Laag (groeit door training)</td>
						<td>Hoog</td>
					</tr>
					<tr>
						<td>Training skill-groei</td>
						<td>+16 per training</td>
						<td>+4 per training</td>
					</tr>
					<tr>
						<td>Trainingskost</td>
						<td>25 cash</td>
						<td>15 cash</td>
					</tr>
					<tr>
						<td>Upgrade skill-groei</td>
						<td>+20 per upgrade</td>
						<td>+5 per upgrade</td>
					</tr>
					<tr>
						<td>Sector-voordeel</td>
						<td>Logistiek, Facilitair, Agri</td>
						<td>Zorg, Retail</td>
					</tr>
				</tbody>
			</table>
			<p>
				<strong>Tip:</strong> Een mix van mensen en robots geeft <em>Vertrouwen</em>-punten in je Impact Score.
				Maar ongetrainde robots naast mensen verlagen je <em>Veiligheid</em>-score.
			</p>
		</section>

		<section>
			<h2>Impact Score (eindscore)</h2>
			<p>
				Je Impact Score bepaalt wie wint. De score bestaat uit 6 categorieën:
			</p>
			<div class="impact-grid">
				<div class="impact-card card">
					<h3>Winst (0-25)</h3>
					<p>Gebaseerd op je cash: <code>cash / 8</code>, afgerond naar beneden. 200+ cash = maximaal 25 punten.</p>
				</div>
				<div class="impact-card card">
					<h3>Innovatie (0-25)</h3>
					<p>Elke training of upgrade levert <strong>3 punten</strong> op. Dus 9 trainingen/upgrades = maximaal.</p>
				</div>
				<div class="impact-card card">
					<h3>Vertrouwen (0-25)</h3>
					<p>Gebaseerd op de balans mens/robot. Gelijke verdeling = 25 punten. Alleen mensen óf alleen robots = 0 punten.</p>
				</div>
				<div class="impact-card card">
					<h3>Veiligheid (-5 tot 25)</h3>
					<p>
						Bij een mix mens/robot: gebaseerd op gemiddelde veiligheid van robots (% van 25).
						Alleen robots: max 15 punten. Robots met veiligheid &lt;30 bij mensen = <strong>strafpunten</strong>.
					</p>
				</div>
				<div class="impact-card card">
					<h3>Duurzaamheid (-10 tot 25)</h3>
					<p>+5 per ontgrendeld continent, maar <strong>-3 per reis</strong> als een humanoid van continent wisselt. Bouw lokaal!</p>
				</div>
				<div class="impact-card card">
					<h3>Complexiteit (tot -25)</h3>
					<p>Strafpunten voor humanoids die meer dan 2 beurten niet worden ingezet: <strong>-3 per extra beurt</strong>. Gebruik of verkoop ze!</p>
				</div>
			</div>
		</section>

		<section>
			<h2>Continenten</h2>
			<p>Je start in Europa. Elk continent heeft eigen regelgeving en een basis compliance-score:</p>
			<div class="continent-grid">
				<div class="continent-card card">
					<h3>Europa</h3>
					<p>Compliance 80. Streng maar hoge reputatiewinst.</p>
				</div>
				<div class="continent-card card">
					<h3>Noord-Amerika</h3>
					<p>Compliance 60. Commercieel snel.</p>
				</div>
				<div class="continent-card card">
					<h3>Azië</h3>
					<p>Compliance 50. Sterke productie.</p>
				</div>
				<div class="continent-card card">
					<h3>Oceanië</h3>
					<p>Compliance 55. Nichemarkt, hoge kosten.</p>
				</div>
				<div class="continent-card card">
					<h3>Zuid-Amerika</h3>
					<p>Compliance 40. Prijsgevoelig.</p>
				</div>
				<div class="continent-card card">
					<h3>Afrika</h3>
					<p>Compliance 30. Groeiende markt.</p>
				</div>
			</div>
		</section>

		<section class="example-section">
			<h2>Voorbeeld: een volledige ronde (1 speler)</h2>
			<div class="example-box">
				<div class="example-step">
					<div class="step-number">Start</div>
					<div class="step-content">
						<p>Het is <strong>ronde 1</strong>. Je hebt 100 cash, 25 reputatie, 2 actiepunten. De winkel toont 3 robots en 3 mensen. Er zijn 4 opdrachten beschikbaar.</p>
					</div>
				</div>

				<div class="example-step">
					<div class="step-number">Actie 1</div>
					<div class="step-content">
						<p><strong>Koop een robot</strong> — bijv. "RX-7 Loader" voor 20 cash.</p>
						<ul>
							<li>Cash: 100 → 80</li>
							<li>Actiepunten: 2 → 1</li>
							<li>Je hebt nu 1 humanoid met skills in logistiek</li>
						</ul>
					</div>
				</div>

				<div class="example-step">
					<div class="step-number">Actie 2</div>
					<div class="step-content">
						<p><strong>Voer opdracht uit</strong> — kies een logistiek-opdracht in Europa en wijs je robot aan.</p>
						<p>Scoreberekening voorbeeld:</p>
						<div class="example-calc">
							<div>Skill logistiek: <strong>45</strong></div>
							<div>Betrouwbaarheid (70 × 0.3): <strong>+21</strong></div>
							<div>Training bonus (0 levels): <strong>+0</strong></div>
							<div>Type-bonus (robot in logistiek): <strong>+12</strong></div>
							<div>Risico: <strong>-8</strong></div>
							<div>Dobbelsteenworp: <strong>+3</strong> (geluk!)</div>
							<div class="calc-total">Totaal: <strong>73</strong> → Succes!</div>
						</div>
						<ul>
							<li>Je krijgt de volledige beloning: bijv. +25 cash, +5 reputatie</li>
							<li>Robot conditie: 100 → 95</li>
							<li>Actiepunten: 1 → 0</li>
						</ul>
					</div>
				</div>

				<div class="example-step">
					<div class="step-number">Einde beurt</div>
					<div class="step-content">
						<p>Je klikt <em>Beurt beëindigen</em>. De popup toont je voortgang:</p>
						<ul>
							<li>Onderhoud robot: -2 cash</li>
							<li>Cash: 80 + 25 - 2 = <strong>103</strong></li>
							<li>Reputatie: 25 + 5 = <strong>30</strong></li>
							<li>Succesvolle opdrachten: <strong>1</strong></li>
						</ul>
						<p>In de Impact Score popup zie je hoe elke categorie is veranderd, inclusief de uitleg waarom.</p>
					</div>
				</div>

				<div class="example-step">
					<div class="step-number">Ronde 2</div>
					<div class="step-content">
						<p>Nieuwe opdrachten en humanoids verschijnen. Je krijgt weer 2 actiepunten. In ronde 2 mag je maximaal 2 opdrachten uitvoeren. Misschien train je je robot eerst?</p>
					</div>
				</div>
			</div>
		</section>

		<section>
			<h2>Tips voor beginners</h2>
			<ul class="tips-list">
				<li>Koop in de eerste rondes een mix van mens en robot voor balans (Vertrouwen-score).</li>
				<li>Train je robots vroeg — ze groeien snel (+16 skill/training) en worden veiliger (+15 veiligheid).</li>
				<li>Breid uit naar 2-3 continenten voor Duurzaamheids-punten, maar laat humanoids niet te veel reizen.</li>
				<li>Hou je cash boven 0 en reputatie boven 50 voor de persoonlijke doelen.</li>
				<li>Laat humanoids niet te lang ongebruikt — na 2 beurten zonder opdracht krijg je Complexiteits-straf.</li>
				<li>Upgrade als je conditie laag is — het herstelt +30% conditie én geeft skill-boost.</li>
			</ul>
		</section>

		<section>
			<h2>Multiplayer</h2>
			<p>
				Speel met 1-4 spelers op hetzelfde scherm. Elke speler speelt zijn beurt,
				dan gaat het door naar de volgende. Na ieders beurt begint een nieuwe ronde.
			</p>
		</section>
	</div>
</div>

<style>
	.rules-page {
		min-height: 100vh;
		padding: 1rem 2rem 3rem;
		max-width: 900px;
		margin: 0 auto;
	}

	.nav-bar {
		margin-bottom: 1.5rem;
	}

	.back-link {
		color: var(--color-primary);
		text-decoration: none;
		font-weight: 600;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	h1 {
		font-size: 2rem;
		color: var(--color-primary);
		margin-bottom: 1.5rem;
	}

	section {
		margin-bottom: 2.5rem;
	}

	h2 {
		font-size: 1.3rem;
		margin-bottom: 0.75rem;
		color: var(--color-text);
		border-bottom: 2px solid var(--color-primary);
		padding-bottom: 0.3rem;
	}

	h3 {
		font-size: 0.95rem;
		color: var(--color-primary);
		margin-bottom: 0.25rem;
	}

	p {
		line-height: 1.6;
		color: var(--color-text-light);
		margin-bottom: 0.75rem;
	}

	ul, ol {
		margin-left: 1.5rem;
		color: var(--color-text-light);
		line-height: 1.8;
	}

	ol {
		list-style-type: decimal;
	}

	code {
		background: rgba(255,255,255,0.1);
		padding: 0.1em 0.4em;
		border-radius: 3px;
		font-size: 0.9em;
	}

	.win-lose-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.win-card {
		border-left: 3px solid #22c55e;
	}

	.lose-card {
		border-left: 3px solid #ef4444;
	}

	.win-card ul, .lose-card ul {
		margin-top: 0.5rem;
	}

	.actions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 0.75rem;
		margin-top: 0.75rem;
	}

	.action-card p {
		font-size: 0.85rem;
		margin-bottom: 0.25rem;
	}

	.action-details {
		font-size: 0.8rem;
		margin-left: 1rem;
		margin-top: 0.25rem;
		line-height: 1.5;
	}

	.score-table {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin: 0.75rem 0;
	}

	.score-row {
		display: grid;
		grid-template-columns: 160px 1fr;
		padding: 0.4rem 0.75rem;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.score-label {
		font-weight: 600;
	}

	.score-desc {
		color: var(--color-text-light);
	}

	.score-row.positive {
		background: rgba(34, 197, 94, 0.1);
		border-left: 3px solid #22c55e;
	}

	.score-row.negative {
		background: rgba(239, 68, 68, 0.1);
		border-left: 3px solid #ef4444;
	}

	.score-row.dice {
		background: rgba(245, 158, 11, 0.1);
		border-left: 3px solid #f59e0b;
	}

	.outcome-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
		margin-top: 0.75rem;
	}

	.outcome {
		padding: 0.75rem;
		border-radius: 6px;
		font-size: 0.85rem;
	}

	.outcome p {
		font-size: 0.8rem;
		margin-bottom: 0;
	}

	.outcome.success {
		background: rgba(34, 197, 94, 0.15);
		border: 1px solid rgba(34, 197, 94, 0.3);
	}

	.outcome.partial {
		background: rgba(245, 158, 11, 0.15);
		border: 1px solid rgba(245, 158, 11, 0.3);
	}

	.outcome.failed {
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.3);
	}

	.comparison-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
		margin: 0.75rem 0;
	}

	.comparison-table th, .comparison-table td {
		padding: 0.5rem 0.75rem;
		text-align: left;
		border-bottom: 1px solid rgba(255,255,255,0.1);
	}

	.comparison-table th {
		color: var(--color-primary);
		font-weight: 600;
	}

	.comparison-table td:first-child {
		font-weight: 600;
		color: var(--color-text);
	}

	.comparison-table td {
		color: var(--color-text-light);
	}

	.impact-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 0.75rem;
		margin-top: 0.75rem;
	}

	.impact-card p {
		font-size: 0.85rem;
		margin-bottom: 0;
	}

	.continent-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 0.75rem;
		margin-top: 0.75rem;
	}

	.continent-card p {
		font-size: 0.85rem;
		margin-bottom: 0;
	}

	.example-section {
		margin-bottom: 2.5rem;
	}

	.example-box {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.example-step {
		display: grid;
		grid-template-columns: 90px 1fr;
		gap: 1rem;
		padding: 0.75rem;
		background: rgba(255,255,255,0.03);
		border-radius: 8px;
		border-left: 3px solid var(--color-primary);
	}

	.step-number {
		font-weight: 700;
		color: var(--color-primary);
		font-size: 0.9rem;
		padding-top: 0.2rem;
	}

	.step-content p {
		margin-bottom: 0.4rem;
		font-size: 0.9rem;
	}

	.step-content ul {
		font-size: 0.85rem;
		line-height: 1.6;
		margin-top: 0.25rem;
	}

	.example-calc {
		background: rgba(0,0,0,0.2);
		border-radius: 6px;
		padding: 0.5rem 0.75rem;
		font-size: 0.85rem;
		line-height: 1.7;
		margin: 0.5rem 0;
		font-family: monospace;
	}

	.calc-total {
		border-top: 1px solid rgba(255,255,255,0.2);
		margin-top: 0.25rem;
		padding-top: 0.25rem;
		color: #22c55e;
	}

	.tips-list {
		line-height: 2;
	}

	.tips-list li {
		padding-left: 0.25rem;
	}
</style>
