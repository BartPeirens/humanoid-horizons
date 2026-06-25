<script lang="ts">
</script>

<div class="rules-page">
	<nav class="nav-bar">
		<a href="/" class="back-link">&#x2190; Terug naar start</a>
	</nav>

	<div class="content">
		<h1>Spelregels</h1>

		<section>
			<h2>Doel</h2>
			<p>
				Bouw het meest succesvolle humanoid-uitzendbureau! Beheer je cash, reputatie en humanoids
				gedurende 10 rondes. Je wint als je aan minstens 2 van 3 doelen voldoet:
			</p>
			<ul>
				<li>Cash is groter dan 0</li>
				<li>Reputatie is minstens 50</li>
				<li>Minstens 6 succesvolle opdrachten voltooid</li>
			</ul>
		</section>

		<section>
			<h2>Verliezen</h2>
			<p>Je verliest onmiddellijk als:</p>
			<ul>
				<li>Je cash lager wordt dan -20</li>
				<li>Je reputatie onder 0 zakt</li>
				<li>Je 3 compliance-fouten maakt in hetzelfde continent</li>
			</ul>
		</section>

		<section>
			<h2>Beurten</h2>
			<p>
				Elke ronde heb je <strong>2 actiepunten</strong>. Mogelijke acties:
			</p>
			<div class="actions-grid">
				<div class="action-card card">
					<h3>Koop Humanoid</h3>
					<p>Koop een nieuwe humanoid uit de winkel. Elke humanoid heeft specifieke vaardigheden.</p>
				</div>
				<div class="action-card card">
					<h3>Voer Opdracht Uit</h3>
					<p>Wijs een humanoid toe aan een opdracht. De score bepaalt succes of falen.</p>
				</div>
				<div class="action-card card">
					<h3>Train Humanoid (15 cash)</h3>
					<p>Verhoog het trainingsniveau. Elke level geeft +5 bij opdrachten.</p>
				</div>
				<div class="action-card card">
					<h3>Upgrade Humanoid (20 cash)</h3>
					<p>Herstel conditie (+30%) en verhoog alle vaardigheden (+5).</p>
				</div>
				<div class="action-card card">
					<h3>Contracteer Leverancier</h3>
					<p>Leveranciers geven permanente skill-bonussen voor specifieke sectoren.</p>
				</div>
				<div class="action-card card">
					<h3>Uitbreiden (25 cash)</h3>
					<p>Ontgrendel een nieuw continent om daar opdrachten uit te voeren.</p>
				</div>
			</div>
		</section>

		<section>
			<h2>Opdrachten</h2>
			<p>
				De score wordt bepaald door de match tussen humanoid-vaardigheden en opdrachtvereisten.
				Bij uitvoering wordt een <strong>dobbelsteenworp</strong> (2d6 - 7 = -5 tot +5) toegevoegd — je kunt geluk of pech hebben!
			</p>
			<ul>
				<li><strong>70+</strong>: Succes - volle beloning en reputatie</li>
				<li><strong>50-69</strong>: Gedeeltelijk - halve beloning</li>
				<li><strong>&lt;50</strong>: Mislukt - verlies cash en reputatie</li>
			</ul>
		</section>

		<section>
			<h2>Impact Score</h2>
			<p>
				Je totaalscore wordt bepaald door 6 categorieën. Maximaal 25 punten per categorie (behalve complexiteit die negatief kan zijn):
			</p>
			<div class="actions-grid">
				<div class="action-card card">
					<h3>&#x1F4B0; Winst (0-25)</h3>
					<p>Gebaseerd op je cash. Hoe meer geld je overhoudt, hoe hoger je score. 200+ cash = maximaal.</p>
				</div>
				<div class="action-card card">
					<h3>&#x1F4A1; Innovatie (0-25)</h3>
					<p>Aantal trainingen en upgrades. Elke training of upgrade levert 3 punten op.</p>
				</div>
				<div class="action-card card">
					<h3>&#x1F91D; Vertrouwen (0-25)</h3>
					<p>Goede balans tussen mensen en robots. Maximaal bij gelijke verdeling. Alleen robots of alleen mensen = 0 punten.</p>
				</div>
				<div class="action-card card">
					<h3>&#x1F6E1;&#xFE0F; Veiligheid (-5 tot 25)</h3>
					<p>Robots beginnen met lage veiligheid. Training verhoogt hun veiligheid (+15/training). Als je mensen én robots hebt maar robots niet veilig genoeg zijn, krijg je minpunten.</p>
				</div>
				<div class="action-card card">
					<h3>&#x1F30D; Duurzaamheid (0-25)</h3>
					<p>Opereren in zoveel mogelijk continenten. 5 punten per ontgrendeld continent.</p>
				</div>
				<div class="action-card card">
					<h3>&#x2699;&#xFE0F; Complexiteit (tot -25)</h3>
					<p>Strafpunten voor medewerkers die meer dan 2 beurten niet worden ingezet. -3 per extra beurt zonder gebruik. Gebruik of verkoop je resources!</p>
				</div>
			</div>
		</section>

		<section>
			<h2>Mens vs Robot</h2>
			<p>
				De keuze tussen mens en robot is een strategische afweging:
			</p>
			<ul>
				<li><strong>Mens</strong>: Duur in aanschaf, hoge skills en betrouwbaarheid, hoge veiligheid, maar groeit nauwelijks door training.</li>
				<li><strong>Robot</strong>: Goedkoop, lage skills bij start, lage veiligheid, maar groeit snel door training (+16/keer vs +4 bij mens).</li>
				<li><strong>Balans</strong>: Een mix van beide geeft <em>Vertrouwen</em>-punten. Robots moeten getraind worden voor <em>Veiligheid</em> als je ze naast mensen inzet.</li>
			</ul>
		</section>

		<section>
			<h2>Continenten</h2>
			<p>Elk continent heeft eigen regelgeving:</p>
			<ul>
				<li><strong>Europa</strong>: Streng, hoge compliance, hoge reputatiewinst</li>
				<li><strong>Noord-Amerika</strong>: Snel, middelmatige compliance</li>
				<li><strong>Zuid-Amerika</strong>: Prijsgevoelig, logistiek uitdagend</li>
				<li><strong>Azië</strong>: Sterke productie, snellere beschikbaarheid</li>
				<li><strong>Afrika</strong>: Groeiende markt, beperkte infrastructuur</li>
				<li><strong>Oceanië</strong>: Nichemarkt, hoge operationele kosten</li>
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
		padding: 1rem 2rem;
		max-width: 800px;
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
		margin-bottom: 2rem;
	}

	h2 {
		font-size: 1.3rem;
		margin-bottom: 0.75rem;
		color: var(--color-text);
	}

	p {
		line-height: 1.6;
		color: var(--color-text-light);
		margin-bottom: 0.75rem;
	}

	ul {
		margin-left: 1.5rem;
		color: var(--color-text-light);
		line-height: 1.8;
	}

	.actions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 0.75rem;
		margin-top: 0.75rem;
	}

	.action-card h3 {
		font-size: 0.95rem;
		color: var(--color-primary);
		margin-bottom: 0.25rem;
	}

	.action-card p {
		font-size: 0.85rem;
		margin-bottom: 0;
	}
</style>
