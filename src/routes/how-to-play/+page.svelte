<script lang="ts">
	import { base } from '$app/paths';

	import { CONTINENT_CONFIG } from '$lib/game/constants';
	let activeTab = $state<'rules' | 'scoring' | 'regulations'>('rules');
</script>

<div class="rules-page">
	<nav class="nav-bar">
		<a href="{base}/" class="back-link">&#x2190; Terug naar start</a>
	</nav>

	<div class="content">
		<h1>Spelregels — Humanoid Horizons</h1>

		<div class="tabs">
			<button class="tab" class:active={activeTab === 'rules'} onclick={() => activeTab = 'rules'}>Spelregels</button>
			<button class="tab" class:active={activeTab === 'scoring'} onclick={() => activeTab = 'scoring'}>Scoresysteem</button>
			<button class="tab" class:active={activeTab === 'regulations'} onclick={() => activeTab = 'regulations'}>Wetgeving</button>
		</div>

		{#if activeTab === 'rules'}

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

		{:else if activeTab === 'scoring'}

		<!-- SCORESYSTEEM TAB -->
		<section>
			<h2>Twee soorten scores</h2>
			<p>
				In Humanoid Horizons zijn er <strong>twee scoresystemen</strong>: de <strong>Opdrachtscore</strong> (bepaalt of een opdracht slaagt)
				en de <strong>Impact Score</strong> (bepaalt wie wint aan het einde van het spel). Hieronder leggen we beide volledig uit met voorbeelden.
			</p>
		</section>

		<section>
			<h2>Deel 1: Opdrachtscore</h2>
			<p>Elke keer dat je een humanoid op een opdracht zet, wordt een score berekend die bepaalt of de opdracht slaagt.</p>

			<h3>Alle factoren</h3>
			<div class="score-table">
				<div class="score-row positive">
					<span class="score-label">Skill match</span>
					<span class="score-desc">De skill van je humanoid in de gevraagde sector (0–100)</span>
				</div>
				<div class="score-row positive">
					<span class="score-label">Betrouwbaarheid</span>
					<span class="score-desc">30% van de betrouwbaarheidsscore: <code>betrouwbaarheid × 0.3</code></span>
				</div>
				<div class="score-row positive">
					<span class="score-label">Trainingsbonus</span>
					<span class="score-desc">+5 per trainingslevel: <code>trainingLevel × 5</code></span>
				</div>
				<div class="score-row positive">
					<span class="score-label">Compliance</span>
					<span class="score-desc">Verschil jouw compliance vs. opdrachteis × 0.1: <code>(jouwCompliance − opdrachtCompliance) × 0.1</code></span>
				</div>
				<div class="score-row positive">
					<span class="score-label">Leverancierbonus</span>
					<span class="score-desc">Som van skill-boosts van gecontracteerde leveranciers in die sector</span>
				</div>
				<div class="score-row positive">
					<span class="score-label">Type-bonus</span>
					<span class="score-desc">Bonus als het juiste type wordt ingezet (zie tabel hieronder)</span>
				</div>
				<div class="score-row negative">
					<span class="score-label">Risico</span>
					<span class="score-desc">Het risicolevel van de opdracht wordt afgetrokken</span>
				</div>
				<div class="score-row negative">
					<span class="score-label">Conditie-straf</span>
					<span class="score-desc">Als conditie &lt; 50%: <code>(50 − conditie) × 0.3</code></span>
				</div>
			</div>

			<h3>Formule</h3>
			<div class="formula-box">
				<code>Score = Skill + Betrouwbaarheid + Training + Compliance + Leverancier + Type-bonus − Risico − Conditie-straf</code>
			</div>

			<h3>Type-bonussen per sector</h3>
			<table class="comparison-table">
				<thead>
					<tr>
						<th>Sector</th>
						<th>Voorkeur</th>
						<th>Bonus</th>
						<th>Naam</th>
					</tr>
				</thead>
				<tbody>
					<tr><td>Zorg</td><td>Mens</td><td>+12</td><td>Empathie-bonus</td></tr>
					<tr><td>Retail</td><td>Mens</td><td>+10</td><td>Klantcontact-bonus</td></tr>
					<tr><td>Logistiek</td><td>Robot</td><td>+12</td><td>Precisie-bonus</td></tr>
					<tr><td>Facilitair</td><td>Robot</td><td>+10</td><td>Efficiëntie-bonus</td></tr>
					<tr><td>Agri</td><td>Robot</td><td>+8</td><td>Kracht-bonus</td></tr>
				</tbody>
			</table>

			<h3>Uitkomsten</h3>
			<div class="outcome-grid">
				<div class="outcome success">
					<strong>Score ≥ 70: Succes</strong>
					<p>Volle beloning (cash + reputatie). Conditie −5.</p>
				</div>
				<div class="outcome partial">
					<strong>Score 50–69: Gedeeltelijk</strong>
					<p>Halve cash, +1 reputatie. Conditie −10.</p>
				</div>
				<div class="outcome failed">
					<strong>Score &lt; 50: Mislukt</strong>
					<p>−10 cash, −5 reputatie. Conditie −15. Compliance-fout mogelijk.</p>
				</div>
			</div>
		</section>

		<section class="example-section">
			<h2>Voorbeeld 1: Succesvolle opdracht</h2>
			<div class="example-box">
				<div class="example-step">
					<div class="step-number">Situatie</div>
					<div class="step-content">
						<p><strong>Robot "RX-7 Loader"</strong> wordt ingezet op een <strong>logistiek</strong>-opdracht in <strong>Europa</strong>.</p>
						<ul>
							<li>Logistiek skill: <strong>45</strong></li>
							<li>Betrouwbaarheid: <strong>70</strong></li>
							<li>Trainingslevel: <strong>1</strong></li>
							<li>Conditie: <strong>95%</strong> (geen straf)</li>
							<li>Jouw compliance Europa: <strong>80</strong>, opdracht vereist: <strong>60</strong></li>
							<li>Leverancier met logistiek +5</li>
							<li>Opdracht risico: <strong>8</strong></li>
						</ul>
					</div>
				</div>
				<div class="example-step">
					<div class="step-number">Berekening</div>
					<div class="step-content">
						<div class="example-calc">
							<div>Skill match (logistiek): <strong>45</strong></div>
							<div>Betrouwbaarheid (70 × 0.3): <strong>+21</strong></div>
							<div>Trainingsbonus (1 × 5): <strong>+5</strong></div>
							<div>Compliance ((80 − 60) × 0.1): <strong>+2</strong></div>
							<div>Leverancierbonus: <strong>+5</strong></div>
							<div>Type-bonus (robot in logistiek): <strong>+12</strong></div>
							<div>Risico: <strong>−8</strong></div>
							<div>Conditie-straf: <strong>0</strong></div>
							<div class="calc-total">Totaal: 45 + 21 + 5 + 2 + 5 + 12 − 8 − 0 = <strong>82</strong> → Succes!</div>
						</div>
						<p>Score ≥ 70 → volledige cash- en reputatiebeloning. Robot conditie daalt met 5.</p>
					</div>
				</div>
			</div>
		</section>

		<section class="example-section">
			<h2>Voorbeeld 2: Mislukte opdracht</h2>
			<div class="example-box">
				<div class="example-step">
					<div class="step-number">Situatie</div>
					<div class="step-content">
						<p><strong>Robot "AUTO-3"</strong> wordt ingezet op een <strong>zorg</strong>-opdracht in <strong>Azië</strong>.</p>
						<ul>
							<li>Zorg skill: <strong>15</strong></li>
							<li>Betrouwbaarheid: <strong>55</strong></li>
							<li>Trainingslevel: <strong>0</strong></li>
							<li>Conditie: <strong>35%</strong> (straf!)</li>
							<li>Jouw compliance Azië: <strong>50</strong>, opdracht vereist: <strong>65</strong></li>
							<li>Geen leverancier</li>
							<li>Opdracht risico: <strong>12</strong></li>
						</ul>
					</div>
				</div>
				<div class="example-step">
					<div class="step-number">Berekening</div>
					<div class="step-content">
						<div class="example-calc">
							<div>Skill match (zorg): <strong>15</strong></div>
							<div>Betrouwbaarheid (55 × 0.3): <strong>+17</strong></div>
							<div>Trainingsbonus (0 × 5): <strong>+0</strong></div>
							<div>Compliance ((50 − 65) × 0.1): <strong>−2</strong></div>
							<div>Leverancierbonus: <strong>+0</strong></div>
							<div>Type-bonus (robot in zorg = geen): <strong>+0</strong></div>
							<div>Risico: <strong>−12</strong></div>
							<div>Conditie-straf ((50 − 35) × 0.3): <strong>−5</strong></div>
							<div class="calc-total calc-fail">Totaal: 15 + 17 + 0 − 2 + 0 + 0 − 12 − 5 = <strong>13</strong> → Mislukt!</div>
						</div>
						<p>Score &lt; 50 → −10 cash, −5 reputatie, conditie daalt met 15, mogelijke compliance-fout.</p>
						<p><strong>Wat ging er mis?</strong> Lage skill in de verkeerde sector, geen type-bonus (robot in zorg), lage conditie, en negatieve compliance.</p>
					</div>
				</div>
			</div>
		</section>

		<section class="example-section">
			<h2>Voorbeeld 3: Gedeeltelijk succes</h2>
			<div class="example-box">
				<div class="example-step">
					<div class="step-number">Situatie</div>
					<div class="step-content">
						<p><strong>Mens "Eva Janssen"</strong> wordt ingezet op een <strong>retail</strong>-opdracht in <strong>Europa</strong>.</p>
						<ul>
							<li>Retail skill: <strong>35</strong></li>
							<li>Betrouwbaarheid: <strong>80</strong></li>
							<li>Trainingslevel: <strong>0</strong></li>
							<li>Conditie: <strong>70%</strong> (geen straf)</li>
							<li>Jouw compliance Europa: <strong>80</strong>, opdracht vereist: <strong>75</strong></li>
							<li>Geen leverancier</li>
							<li>Opdracht risico: <strong>10</strong></li>
						</ul>
					</div>
				</div>
				<div class="example-step">
					<div class="step-number">Berekening</div>
					<div class="step-content">
						<div class="example-calc">
							<div>Skill match (retail): <strong>35</strong></div>
							<div>Betrouwbaarheid (80 × 0.3): <strong>+24</strong></div>
							<div>Trainingsbonus (0 × 5): <strong>+0</strong></div>
							<div>Compliance ((80 − 75) × 0.1): <strong>+1</strong></div>
							<div>Leverancierbonus: <strong>+0</strong></div>
							<div>Type-bonus (mens in retail): <strong>+10</strong></div>
							<div>Risico: <strong>−10</strong></div>
							<div>Conditie-straf: <strong>0</strong></div>
							<div class="calc-total calc-partial">Totaal: 35 + 24 + 0 + 1 + 0 + 10 − 10 − 0 = <strong>60</strong> → Gedeeltelijk!</div>
						</div>
						<p>Score 50–69 → halve cash-beloning, +1 reputatie, conditie daalt met 10.</p>
						<p><strong>Tip:</strong> Eén training zou +5 trainingsbonus geven → score 65. Twee trainingen → 70 = succes!</p>
					</div>
				</div>
			</div>
		</section>

		<section>
			<h2>Deel 2: Impact Score (eindscore)</h2>
			<p>
				Na 10 rondes wint de speler met de hoogste <strong>Impact Score</strong>.
				De score bestaat uit 6 categorieën met elk een maximum (en soms strafpunten).
			</p>

			<h3>Overzicht categorieën</h3>
			<div class="impact-detail-grid">
				<div class="impact-detail card">
					<h3>Winst (0–25 punten)</h3>
					<div class="formula-box"><code>punten = cash ÷ 8 (afgerond naar beneden)</code></div>
					<p>Maximum 25 punten bij 200+ cash.</p>
					<div class="impact-examples">
						<div class="impact-example"><span>50 cash</span> <span>→ 6 punten</span></div>
						<div class="impact-example"><span>120 cash</span> <span>→ 15 punten</span></div>
						<div class="impact-example"><span>200 cash</span> <span>→ 25 punten (max)</span></div>
					</div>
				</div>

				<div class="impact-detail card">
					<h3>Innovatie (0–25 punten)</h3>
					<div class="formula-box"><code>punten = (trainingen + upgrades) × 3</code></div>
					<p>Elke training of upgrade telt. Maximum bij 9 acties.</p>
					<div class="impact-examples">
						<div class="impact-example"><span>2 trainingen, 1 upgrade</span> <span>→ 9 punten</span></div>
						<div class="impact-example"><span>4 trainingen, 2 upgrades</span> <span>→ 18 punten</span></div>
						<div class="impact-example"><span>5 trainingen, 4 upgrades</span> <span>→ 25 punten (max)</span></div>
					</div>
				</div>

				<div class="impact-detail card">
					<h3>Vertrouwen (0–25 punten)</h3>
					<div class="formula-box"><code>punten = 25 × (min(mensen, robots) ÷ max(mensen, robots))</code></div>
					<p>Beloont een <strong>gelijke mix</strong> van mensen en robots. Alleen mensen óf alleen robots = 0.</p>
					<div class="impact-examples">
						<div class="impact-example"><span>3 mensen, 3 robots</span> <span>→ 25 punten (max)</span></div>
						<div class="impact-example"><span>2 mensen, 4 robots</span> <span>→ 13 punten</span></div>
						<div class="impact-example"><span>1 mens, 5 robots</span> <span>→ 5 punten</span></div>
						<div class="impact-example"><span>0 mensen, 4 robots</span> <span>→ 0 punten</span></div>
					</div>
				</div>

				<div class="impact-detail card">
					<h3>Veiligheid (−5 tot 25 punten)</h3>
					<p>Hangt af van je team-samenstelling:</p>
					<ul>
						<li><strong>Mix mens + robot:</strong> gebaseerd op gemiddelde veiligheid van robots: <code>25 × (gem. robotveiligheid ÷ 100)</code></li>
						<li><strong>Alleen robots:</strong> max 15 punten: <code>15 × (gem. veiligheid ÷ 100)</code></li>
						<li><strong>Strafpunten:</strong> bij een mix, als gem. robotveiligheid &lt; 30 → score wordt max −5</li>
					</ul>
					<div class="impact-examples">
						<div class="impact-example"><span>Mix, robots gem. 80 veiligheid</span> <span>→ 20 punten</span></div>
						<div class="impact-example"><span>Mix, robots gem. 25 veiligheid</span> <span>→ −5 punten (straf!)</span></div>
						<div class="impact-example"><span>Alleen robots, gem. 60</span> <span>→ 9 punten</span></div>
					</div>
				</div>

				<div class="impact-detail card">
					<h3>Duurzaamheid (−10 tot 25 punten)</h3>
					<div class="formula-box"><code>punten = (ontgrendelde continenten × 5) − (reizen × 3)</code></div>
					<p>Uitbreiden levert punten op, maar humanoids laten reizen kost punten.</p>
					<div class="impact-examples">
						<div class="impact-example"><span>3 continenten, 0 reizen</span> <span>→ 15 punten</span></div>
						<div class="impact-example"><span>3 continenten, 2 reizen</span> <span>→ 9 punten</span></div>
						<div class="impact-example"><span>2 continenten, 5 reizen</span> <span>→ −5 punten</span></div>
						<div class="impact-example highlight-negative"><span>1 continent, 4 reizen</span> <span>→ −7 punten</span></div>
					</div>
				</div>

				<div class="impact-detail card">
					<h3>Complexiteit (tot −25 punten)</h3>
					<div class="formula-box"><code>straf per humanoid = (beurten ongebruikt − 2) × 3</code></div>
					<p>Na 2 beurten zonder opdracht krijg je <strong>strafpunten</strong>. Alleen straf, geen bonus.</p>
					<div class="impact-examples">
						<div class="impact-example"><span>Alle humanoids actief</span> <span>→ 0 punten</span></div>
						<div class="impact-example"><span>1 humanoid 4 beurten idle</span> <span>→ −6 punten</span></div>
						<div class="impact-example"><span>2 humanoids 5 beurten idle</span> <span>→ −18 punten</span></div>
					</div>
				</div>
			</div>
		</section>

		<section class="example-section">
			<h2>Volledig Impact Score voorbeeld</h2>
			<p>Na 10 rondes heeft een speler het volgende profiel:</p>

			<div class="example-box">
				<div class="example-step">
					<div class="step-number">Profiel</div>
					<div class="step-content">
						<ul>
							<li>Cash: <strong>140</strong></li>
							<li>Humanoids: <strong>2 mensen, 3 robots</strong></li>
							<li>Gem. robotveiligheid: <strong>72</strong></li>
							<li>Trainingen: <strong>4</strong>, Upgrades: <strong>2</strong></li>
							<li>Ontgrendelde continenten: <strong>3</strong></li>
							<li>Reizen: <strong>1</strong></li>
							<li>Idle humanoids: <strong>1 robot, 3 beurten niet gebruikt</strong></li>
						</ul>
					</div>
				</div>

				<div class="example-step">
					<div class="step-number">Berekening</div>
					<div class="step-content">
						<div class="example-calc">
							<div>Winst: 140 ÷ 8 = <strong>17</strong></div>
							<div>Innovatie: (4 + 2) × 3 = <strong>18</strong></div>
							<div>Vertrouwen: 25 × (2 ÷ 3) = <strong>17</strong></div>
							<div>Veiligheid: 25 × (72 ÷ 100) = <strong>18</strong></div>
							<div>Duurzaamheid: (3 × 5) − (1 × 3) = <strong>12</strong></div>
							<div>Complexiteit: −(3 − 2) × 3 = <strong>−3</strong></div>
							<div class="calc-total">Totale Impact Score: 17 + 18 + 17 + 18 + 12 − 3 = <strong>79</strong></div>
						</div>
					</div>
				</div>

				<div class="example-step">
					<div class="step-number">Analyse</div>
					<div class="step-content">
						<p>Goede score! Verbeterpunten:</p>
						<ul>
							<li><strong>Vertrouwen (+8):</strong> Nog 1 mens kopen → 3:3 ratio → 25 punten</li>
							<li><strong>Innovatie (+7):</strong> 3 extra trainingen → maximum 25</li>
							<li><strong>Complexiteit (+3):</strong> Die idle robot inzetten of verkopen</li>
						</ul>
						<p>Maximaal haalbaar met deze verbeteringen: <strong>97 punten</strong></p>
					</div>
				</div>
			</div>
		</section>

		<section>
			<h2>Strategietips voor maximale score</h2>
			<div class="tips-grid">
				<div class="tip-card card">
					<h3>Opdrachtscore maximaliseren</h3>
					<ul>
						<li>Zet het <strong>juiste type</strong> in per sector (robot → logistiek/facilitair/agri, mens → zorg/retail)</li>
						<li><strong>Train</strong> je humanoids — elke training geeft +5 score</li>
						<li>Houd <strong>conditie boven 50%</strong> om strafpunten te vermijden</li>
						<li>Doe <strong>compliance checks</strong> in continenten waar je veel opdrachten doet</li>
						<li>Contracteer <strong>leveranciers</strong> voor extra skill-boost</li>
					</ul>
				</div>
				<div class="tip-card card">
					<h3>Impact Score maximaliseren</h3>
					<ul>
						<li>Houd een <strong>gelijke mix</strong> mens/robot (Vertrouwen)</li>
						<li><strong>Train robots</strong> voor veiligheid — ongetrainde robots geven strafpunten</li>
						<li>Breid uit maar <strong>beperk reizen</strong> — bouw lokale teams (Duurzaamheid)</li>
						<li>Doe minstens <strong>9 trainingen/upgrades</strong> (Innovatie max)</li>
						<li>Zet <strong>alle humanoids regelmatig in</strong> — idle straf begint na 2 beurten (Complexiteit)</li>
						<li>Spaar cash — <strong>200+ cash</strong> geeft maximale Winstpunten</li>
					</ul>
				</div>
			</div>
		</section>

		{:else}

		<!-- WETGEVING TAB -->
		<section>
			<div class="disclaimer-box">
				<strong>Let op:</strong> Alle wetgeving in dit spel is volledig fictief en dient enkel als spelcontext. De genoemde wetten, instanties en afkortingen bestaan niet in de echte wereld.
			</div>
		</section>

		<section>
			<h2>Compliance in het spel</h2>
			<p>
				Elk continent heeft eigen regelgeving voor de inzet van humanoids. Als uitzendbureau moet je voldoen aan de lokale compliance-eisen.
				Hoe strenger het continent, hoe hoger de basis compliance-score — en hoe meer impact het heeft op je opdrachten.
			</p>
			<div class="regulation-how-it-works">
				<h3>Hoe werkt compliance?</h3>
				<ul>
					<li>Elke opdracht heeft een <strong>compliance-eis</strong> (gebaseerd op het continent)</li>
					<li>Jouw <strong>compliance-score</strong> per continent wordt vergeleken met die eis</li>
					<li>Het verschil × 0.1 wordt als <strong>bonus of straf</strong> bij je opdrachtscore opgeteld</li>
					<li>Bij een <strong>mislukte opdracht</strong> in een streng continent is er 30% kans op een <strong>compliance-fout</strong></li>
					<li>Bij <strong>3 compliance-fouten</strong> in één continent verlies je het spel!</li>
				</ul>
			</div>
		</section>

		<section>
			<h2>Compliance verhogen</h2>
			<p>Er is één manier om je compliance te verhogen:</p>
			<div class="regulation-action-card card">
				<h3>Compliance Check</h3>
				<div class="regulation-action-details">
					<span class="regulation-cost">Kost: 1 actiepunt + 10 cash</span>
					<span class="regulation-effect">Effect: +15 compliance in het gekozen continent (max 100)</span>
				</div>
				<p>Kies het continent waar je je compliance wilt verbeteren. Dit is vooral belangrijk in continenten met strenge regelgeving (Europa, Oceanië) of waar je veel opdrachten uitvoert.</p>
			</div>
			<div class="regulation-warning card">
				<h3>Compliance kan ook dalen!</h3>
				<ul>
					<li><strong>Markt-events</strong> zoals "Nieuwe regelgeving" kunnen je compliance verlagen</li>
					<li>Houd je score in de gaten via de kaart-legenda en de job cards</li>
				</ul>
			</div>
		</section>

		<section>
			<h2>Wetgeving per continent</h2>
			<div class="regulation-grid">
				{#each Object.entries(CONTINENT_CONFIG) as [id, config]}
					<div class="regulation-card card">
						<h3 style="color: var(--color-primary)">{config.name}</h3>
						<div class="regulation-meta">
							<span class="regulation-badge">Basis compliance: {config.baseCompliance}</span>
							<span class="regulation-strictness">
								{#if config.baseCompliance >= 70}
									Streng
								{:else if config.baseCompliance >= 50}
									Gemiddeld
								{:else}
									Soepel
								{/if}
							</span>
						</div>
						<p class="regulation-description">{config.description}</p>
						<div class="regulation-law">
							<p>{config.regulation}</p>
						</div>
					</div>
				{/each}
			</div>
		</section>

		<section>
			<h2>Voorbeeld: compliance-impact op score</h2>
			<div class="regulation-example card">
				<div class="example-scenario">
					<h3>Situatie 1: Goede compliance</h3>
					<p>Je voert een opdracht uit in <strong>Europa</strong> (compliance-eis: 64). Jouw compliance in Europa is <strong>80</strong>.</p>
					<div class="example-calc">
						<div>Verschil: 80 − 64 = <strong>+16</strong></div>
						<div>Score-impact: 16 × 0.1 = <strong>+1.6 → afgerond +2 bonus</strong></div>
					</div>
				</div>
				<div class="example-scenario">
					<h3>Situatie 2: Lage compliance</h3>
					<p>Je voert een opdracht uit in <strong>Europa</strong> (compliance-eis: 64). Jouw compliance is gedaald naar <strong>40</strong> door een markt-event.</p>
					<div class="example-calc">
						<div>Verschil: 40 − 64 = <strong>-24</strong></div>
						<div>Score-impact: -24 × 0.1 = <strong>-2.4 → afgerond -2 straf</strong></div>
						<div class="calc-total calc-fail">Oplossing: doe een Compliance Check (+15) → compliance wordt 55, verschil daalt naar -9 → straf -1</div>
					</div>
				</div>
			</div>
		</section>

		{/if}
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
		font-family: var(--font-display);
		font-size: 1.8rem;
		color: var(--color-primary);
		margin-bottom: 1.5rem;
		letter-spacing: 0.04em;
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
		border-left: 3px solid var(--color-success);
	}

	.lose-card {
		border-left: 3px solid var(--color-danger);
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
		background: var(--color-success-subtle);
		border-left: 3px solid var(--color-success);
	}

	.score-row.negative {
		background: var(--color-danger-subtle);
		border-left: 3px solid var(--color-danger);
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
		color: var(--color-success);
	}

	.tips-list {
		line-height: 2;
	}

	.tips-list li {
		padding-left: 0.25rem;
	}

	/* Tabs */
	.tabs {
		display: flex;
		gap: 0.25rem;
		margin-bottom: 2rem;
		border-bottom: 2px solid var(--color-border);
		padding-bottom: 0;
	}

	.tab {
		padding: 0.6rem 1.5rem;
		background: transparent;
		border: none;
		color: var(--color-text-muted);
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		border-bottom: 3px solid transparent;
		margin-bottom: -2px;
		transition: color 0.2s, border-color 0.2s;
	}

	.tab:hover {
		color: var(--color-text-light);
	}

	.tab.active {
		color: var(--color-primary);
		border-bottom-color: var(--color-primary);
	}

	/* Scoring tab styles */
	.formula-box {
		background: rgba(0, 0, 0, 0.25);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 0.6rem 1rem;
		margin: 0.75rem 0;
		text-align: center;
	}

	.formula-box code {
		font-size: 0.9rem;
		color: var(--color-primary);
	}

	.impact-detail-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.25rem;
		margin-top: 0.75rem;
	}

	.impact-detail h3 {
		margin-bottom: 0.5rem;
	}

	.impact-detail ul {
		font-size: 0.85rem;
		margin-top: 0.5rem;
	}

	.impact-examples {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin-top: 0.5rem;
	}

	.impact-example {
		display: flex;
		justify-content: space-between;
		padding: 0.3rem 0.75rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 4px;
		font-size: 0.85rem;
		color: var(--color-text-light);
	}

	.impact-example span:last-child {
		font-weight: 600;
		color: var(--color-success);
	}

	.impact-example.highlight-negative span:last-child {
		color: var(--color-danger);
	}

	.calc-total.calc-fail {
		color: var(--color-danger);
	}

	.calc-total.calc-partial {
		color: var(--color-warning);
	}

	.tips-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-top: 0.75rem;
	}

	.tip-card ul {
		font-size: 0.85rem;
		line-height: 1.8;
	}

	.disclaimer-box {
		background: rgba(251, 191, 36, 0.12);
		border: 1px solid rgba(251, 191, 36, 0.3);
		border-left: 4px solid var(--color-warning);
		border-radius: 6px;
		padding: 0.75rem 1rem;
		font-size: 0.9rem;
		color: var(--color-text-light);
		line-height: 1.6;
	}

	.regulation-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1rem;
		margin-top: 0.75rem;
	}

	.regulation-card {
		padding: 1rem;
	}

	.regulation-meta {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.regulation-badge {
		font-size: 0.78rem;
		font-weight: 600;
		background: rgba(99, 102, 241, 0.15);
		color: var(--color-primary);
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
	}

	.regulation-strictness {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.05);
		color: var(--color-text-muted);
	}

	.regulation-description {
		font-size: 0.85rem;
		margin-bottom: 0.5rem;
	}

	.regulation-law {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 4px;
		padding: 0.5rem 0.75rem;
		font-style: italic;
		border-left: 2px solid var(--color-primary);
	}

	.regulation-law p {
		font-size: 0.8rem;
		margin-bottom: 0;
		line-height: 1.5;
	}

	.regulation-how-it-works {
		background: rgba(99, 102, 241, 0.08);
		border: 1px solid rgba(99, 102, 241, 0.2);
		border-radius: 8px;
		padding: 1rem;
		margin-top: 0.75rem;
	}

	.regulation-how-it-works h3 {
		margin-bottom: 0.5rem;
	}

	.regulation-how-it-works ul {
		font-size: 0.88rem;
	}

	.regulation-action-card {
		padding: 1rem;
		border-left: 3px solid var(--color-success);
	}

	.regulation-action-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin: 0.5rem 0;
		font-size: 0.85rem;
	}

	.regulation-cost {
		color: var(--color-warning);
		font-weight: 600;
	}

	.regulation-effect {
		color: var(--color-success);
		font-weight: 600;
	}

	.regulation-warning {
		margin-top: 0.75rem;
		padding: 1rem;
		border-left: 3px solid var(--color-warning);
	}

	.regulation-warning ul {
		font-size: 0.85rem;
		margin-top: 0.5rem;
	}

	.regulation-example {
		padding: 1rem;
	}

	.example-scenario {
		margin-bottom: 1rem;
	}

	.example-scenario:last-child {
		margin-bottom: 0;
	}

	@media (max-width: 600px) {
		.tips-grid,
		.win-lose-grid,
		.outcome-grid,
		.regulation-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
