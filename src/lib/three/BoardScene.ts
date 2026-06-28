import * as THREE from 'three';
import type { GameState, Job, PlayerHumanoid, Sector } from '$lib/game/types.js';
import { CONTINENT_CONFIG } from '$lib/game/constants.js';

interface ContinentDef {
	center: { x: number; z: number };
	outline: Array<{ x: number; z: number }>;
	color: number;
}

const CONTINENTS: Record<string, ContinentDef> = {
	'europe': {
		center: { x: 1.25, z: -3.35 },
		outline: [
			{ x: -0.35, z: -3.10 },
			{ x: -0.20, z: -3.45 },
			{ x: 0.05, z: -3.80 },
			{ x: 0.35, z: -4.05 },
			{ x: 0.50, z: -4.45 },
			{ x: 0.80, z: -4.85 },
			{ x: 1.15, z: -5.10 },
			{ x: 1.55, z: -5.20 },
			{ x: 1.95, z: -5.00 },
			{ x: 2.25, z: -4.75 },
			{ x: 2.55, z: -4.25 },
			{ x: 2.70, z: -3.80 },
			{ x: 2.55, z: -3.35 },
			{ x: 2.30, z: -3.00 },
			{ x: 2.05, z: -2.80 },
			{ x: 2.20, z: -2.45 },
			{ x: 1.85, z: -2.30 },
			{ x: 1.55, z: -2.10 },
			{ x: 1.35, z: -2.40 },
			{ x: 1.10, z: -2.25 },
			{ x: 0.80, z: -2.20 },
			{ x: 0.45, z: -2.30 },
			{ x: 0.10, z: -2.45 },
			{ x: -0.20, z: -2.70 },
		],
		color: 0xEF5350,
	},

	'asia': {
		center: { x: 5.75, z: -2.65 },
		outline: [
			{ x: 2.35, z: -4.10 },
			{ x: 3.10, z: -4.75 },
			{ x: 4.20, z: -5.20 },
			{ x: 5.40, z: -5.35 },
			{ x: 6.55, z: -5.20 },
			{ x: 7.40, z: -4.95 },
			{ x: 8.15, z: -4.55 },
			{ x: 8.65, z: -3.95 },
			{ x: 8.85, z: -3.30 },
			{ x: 8.75, z: -2.75 },
			{ x: 8.30, z: -2.25 },
			{ x: 8.55, z: -1.70 },
			{ x: 8.15, z: -1.10 },
			{ x: 7.60, z: -0.65 },
			{ x: 7.05, z: -0.30 },
			{ x: 7.25, z: 0.20 },
			{ x: 6.90, z: 0.70 },
			{ x: 6.30, z: 0.55 },
			{ x: 5.75, z: 0.20 },
			{ x: 5.20, z: 0.05 },
			{ x: 5.05, z: 0.95 },
			{ x: 4.60, z: 0.40 },
			{ x: 4.35, z: -0.20 },
			{ x: 3.80, z: -0.20 },
			{ x: 3.10, z: -0.60 },
			{ x: 2.70, z: -1.10 },
			{ x: 2.40, z: -1.80 },
			{ x: 2.30, z: -2.55 },
			{ x: 2.15, z: -3.25 },
		],
		color: 0xAB47BC,
	},

	'north-america': {
		center: { x: -5.45, z: -2.65 },
		outline: [
			{ x: -7.90, z: -4.20 },
			{ x: -7.45, z: -4.85 },
			{ x: -6.80, z: -5.20 },
			{ x: -6.00, z: -5.30 },
			{ x: -5.15, z: -5.20 },
			{ x: -4.45, z: -5.00 },
			{ x: -3.85, z: -4.75 },
			{ x: -3.35, z: -4.25 },
			{ x: -3.05, z: -3.70 },
			{ x: -3.20, z: -3.20 },
			{ x: -3.00, z: -2.65 },
			{ x: -3.15, z: -2.05 },
			{ x: -3.35, z: -1.55 },
			{ x: -3.10, z: -1.10 },
			{ x: -3.55, z: -0.95 },
			{ x: -4.05, z: -0.70 },
			{ x: -4.40, z: -0.30 },
			{ x: -4.75, z: 0.10 },
			{ x: -5.15, z: 0.00 },
			{ x: -5.45, z: -0.45 },
			{ x: -5.85, z: -0.85 },
			{ x: -6.20, z: -1.15 },
			{ x: -6.60, z: -1.45 },
			{ x: -6.95, z: -1.90 },
			{ x: -7.30, z: -2.45 },
			{ x: -7.55, z: -3.00 },
			{ x: -7.75, z: -3.60 },
		],
		color: 0x42A5F5,
	},

	'south-america': {
		center: { x: -3.20, z: 2.75 },
		outline: [
			{ x: -4.45, z: 0.20 },
			{ x: -3.95, z: -0.05 },
			{ x: -3.25, z: 0.00 },
			{ x: -2.70, z: 0.35 },
			{ x: -2.20, z: 0.90 },
			{ x: -1.90, z: 1.55 },
			{ x: -1.75, z: 2.20 },
			{ x: -1.85, z: 2.90 },
			{ x: -2.05, z: 3.55 },
			{ x: -2.35, z: 4.15 },
			{ x: -2.65, z: 4.70 },
			{ x: -3.00, z: 5.20 },
			{ x: -3.35, z: 5.55 },
			{ x: -3.70, z: 5.45 },
			{ x: -4.00, z: 4.90 },
			{ x: -4.25, z: 4.20 },
			{ x: -4.45, z: 3.45 },
			{ x: -4.65, z: 2.65 },
			{ x: -4.75, z: 1.85 },
			{ x: -4.75, z: 1.10 },
			{ x: -4.65, z: 0.55 },
		],
		color: 0x66BB6A,
	},

	'africa': {
		center: { x: 1.65, z: 1.35 },
		outline: [
			{ x: 0.20, z: -1.55 },
			{ x: 0.80, z: -1.80 },
			{ x: 1.55, z: -1.90 },
			{ x: 2.20, z: -1.80 },
			{ x: 2.75, z: -1.45 },
			{ x: 3.10, z: -0.90 },
			{ x: 3.45, z: -0.40 },
			{ x: 3.65, z: 0.25 },
			{ x: 3.55, z: 0.95 },
			{ x: 3.30, z: 1.75 },
			{ x: 3.05, z: 2.45 },
			{ x: 2.70, z: 3.10 },
			{ x: 2.30, z: 3.70 },
			{ x: 1.85, z: 4.20 },
			{ x: 1.35, z: 4.55 },
			{ x: 0.90, z: 4.35 },
			{ x: 0.55, z: 3.85 },
			{ x: 0.20, z: 3.20 },
			{ x: -0.10, z: 2.40 },
			{ x: -0.35, z: 1.55 },
			{ x: -0.50, z: 0.70 },
			{ x: -0.45, z: -0.10 },
			{ x: -0.20, z: -0.85 },
		],
		color: 0xFFA726,
	},

	'oceania': {
		center: { x: 7.00, z: 2.95 },
		outline: [
			{ x: 5.65, z: 2.10 },
			{ x: 6.15, z: 1.75 },
			{ x: 6.85, z: 1.60 },
			{ x: 7.55, z: 1.70 },
			{ x: 8.15, z: 1.95 },
			{ x: 8.60, z: 2.35 },
			{ x: 8.85, z: 2.95 },
			{ x: 8.75, z: 3.55 },
			{ x: 8.40, z: 4.05 },
			{ x: 7.85, z: 4.35 },
			{ x: 7.20, z: 4.45 },
			{ x: 6.55, z: 4.30 },
			{ x: 6.00, z: 3.95 },
			{ x: 5.65, z: 3.45 },
			{ x: 5.50, z: 2.80 },
		],
		color: 0x26A69A,
	},
};

export class BoardScene {
	private scene: THREE.Scene;
	private camera: THREE.OrthographicCamera;
	private renderer: THREE.WebGLRenderer;
	private raycaster: THREE.Raycaster;
	private mouse: THREE.Vector2;
	private continentGroups: Map<string, THREE.Group> = new Map();
	private continentMaterials: Map<string, THREE.MeshStandardMaterial> = new Map();
	private humanoidMeshes: Map<string, THREE.Mesh> = new Map();
	private jobMeshes: Map<string, THREE.Mesh> = new Map();
	private assignmentLines: THREE.Line[] = [];
	private highlightRing: THREE.Mesh | null = null;
	private hoveredObject: THREE.Object3D | null = null;
	private animationId: number = 0;
	private time: number = 0;
	private labelSprites: Map<string, THREE.Sprite> = new Map();
	private selectedJobCard: THREE.Sprite | null = null;
	private dragCylinder: THREE.Group | null = null;
	private dragCylinderLabel: THREE.Sprite | null = null;
	private assignedCylinders: THREE.Group[] = [];
	private placedCylinders: Map<string, THREE.Group> = new Map();
	private _jobCardHighlighted = false;

	private isPanning = false;
	private panStart = { x: 0, y: 0 };
	private cameraTarget = { x: 0, z: 0 };
	private frustumSize = 14;
	private minFrustum = 6;
	private maxFrustum = 22;
	private _zoomLevel = 5;

	private readonly HEX_SIZE = 0.4;
	private readonly HEX_GAP = 0.94;
	private readonly LAND_DEPTH = 0.18;
	private readonly SEA_DEPTH = 0.09;

	onContinentClick?: (continent: string) => void;
	onJobClick?: (jobId: string) => void;
	onHumanoidClick?: (humanoidId: string) => void;
	onDrop?: (continent: string) => void;
	onJobPlace?: (jobId: string, humanoidId: string) => void;
	onZoomChange?: (level: number) => void;

	constructor(private container: HTMLElement) {
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x071520);

		const aspect = container.clientWidth / container.clientHeight;
		this.camera = new THREE.OrthographicCamera(
			-this.frustumSize * aspect / 2, this.frustumSize * aspect / 2,
			this.frustumSize / 2, -this.frustumSize / 2,
			0.1, 100
		);
		this.camera.position.set(0, 20, 8);
		this.camera.lookAt(0, 0, 0);

		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setSize(container.clientWidth, container.clientHeight);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		container.appendChild(this.renderer.domElement);

		this.raycaster = new THREE.Raycaster();
		this.mouse = new THREE.Vector2();

		this.setupLighting();
		this.buildHexGrid();
		this.buildTradeRoutes();
		this.createHighlightRing();

		this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
		this.renderer.domElement.addEventListener('click', this.onClick.bind(this));
		this.renderer.domElement.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
		this.renderer.domElement.addEventListener('mousedown', this.onPanStart.bind(this));
		this.renderer.domElement.addEventListener('mouseup', this.onPanEnd.bind(this));
		this.renderer.domElement.addEventListener('mouseleave', this.onPanEnd.bind(this));

		this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
		this.renderer.domElement.addEventListener('dragenter', (e) => e.preventDefault());
		this.renderer.domElement.addEventListener('dragover', this.onDragOver.bind(this));
		this.renderer.domElement.addEventListener('drop', this.onDropEvent.bind(this));
		this.renderer.domElement.addEventListener('dragleave', this.onDragLeave.bind(this));

		window.addEventListener('resize', this.onResize.bind(this));

		this.animate();
	}

	private setupLighting() {
		const hemi = new THREE.HemisphereLight(0x6699cc, 0x0a1628, 0.8);
		this.scene.add(hemi);

		const dir = new THREE.DirectionalLight(0xf0f4ff, 1.1);
		dir.position.set(5, 18, 5);
		dir.castShadow = true;
		dir.shadow.mapSize.width = 2048;
		dir.shadow.mapSize.height = 2048;
		dir.shadow.camera.near = 0.5;
		dir.shadow.camera.far = 50;
		dir.shadow.camera.left = -15;
		dir.shadow.camera.right = 15;
		dir.shadow.camera.top = 15;
		dir.shadow.camera.bottom = -15;
		this.scene.add(dir);

		const ambient = new THREE.AmbientLight(0x4477aa, 0.4);
		this.scene.add(ambient);

		const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.2);
		rimLight.position.set(-8, 10, -5);
		this.scene.add(rimLight);
	}

	// ═══════════ HEX GRID ═══════════

	private createHexShape(size: number): THREE.Shape {
		const shape = new THREE.Shape();
		for (let i = 0; i < 6; i++) {
			const angle = (Math.PI / 3) * i;
			const x = size * Math.cos(angle);
			const y = size * Math.sin(angle);
			if (i === 0) shape.moveTo(x, y);
			else shape.lineTo(x, y);
		}
		shape.closePath();
		return shape;
	}

	private hexToWorld(col: number, row: number): { x: number; z: number } {
		const size = this.HEX_SIZE;
		const x = col * 1.5 * size;
		const z = row * Math.sqrt(3) * size + (Math.abs(col) % 2 === 1 ? Math.sqrt(3) / 2 * size : 0);
		return { x, z };
	}

	private pointInPolygon(px: number, pz: number, polygon: Array<{ x: number; z: number }>): boolean {
		let inside = false;
		let j = polygon.length - 1;
		for (let i = 0; i < polygon.length; i++) {
			if ((polygon[i].z > pz) !== (polygon[j].z > pz) &&
				px < (polygon[j].x - polygon[i].x) * (pz - polygon[i].z) / (polygon[j].z - polygon[i].z) + polygon[i].x) {
				inside = !inside;
			}
			j = i;
		}
		return inside;
	}

	private getHexContinent(wx: number, wz: number): string | null {
		for (const [id, def] of Object.entries(CONTINENTS)) {
			if (this.pointInPolygon(wx, wz, def.outline)) {
				return id;
			}
		}
		return null;
	}

	private distToNearestLand(wx: number, wz: number): number {
		let minDist = Infinity;
		for (const def of Object.values(CONTINENTS)) {
			for (const pt of def.outline) {
				const dx = wx - pt.x;
				const dz = wz - pt.z;
				const dist = Math.sqrt(dx * dx + dz * dz);
				if (dist < minDist) minDist = dist;
			}
		}
		return minDist;
	}

	private buildHexGrid() {
		const size = this.HEX_SIZE;
		const hexShape = this.createHexShape(size * this.HEX_GAP);

		const landGeo = new THREE.ExtrudeGeometry(hexShape, {
			depth: this.LAND_DEPTH,
			bevelEnabled: true,
			bevelThickness: 0.015,
			bevelSize: 0.015,
			bevelSegments: 1,
		});
		const seaGeo = new THREE.ExtrudeGeometry(hexShape, {
			depth: this.SEA_DEPTH,
			bevelEnabled: true,
			bevelThickness: 0.015,
			bevelSize: 0.015,
			bevelSegments: 1,
		});

		for (const [id, def] of Object.entries(CONTINENTS)) {
			const mat = new THREE.MeshStandardMaterial({
				color: def.color,
				roughness: 0.5,
				metalness: 0.08,
			});
			this.continentMaterials.set(id, mat);

			const group = new THREE.Group();
			group.userData = { type: 'continent', id };
			this.continentGroups.set(id, group);
			this.scene.add(group);
		}

		// Dark background visible through hex gaps
		const bgGeo = new THREE.PlaneGeometry(32, 22);
		const bgMat = new THREE.MeshStandardMaterial({ color: 0x0a1e30, roughness: 0.95 });
		const bgMesh = new THREE.Mesh(bgGeo, bgMat);
		bgMesh.rotation.x = -Math.PI / 2;
		bgMesh.position.y = -0.02;
		bgMesh.receiveShadow = true;
		this.scene.add(bgMesh);

		const seaPositions: Array<{ x: number; z: number }> = [];

		const colMin = -16;
		const colMax = 16;
		const rowMin = -10;
		const rowMax = 10;

		for (let col = colMin; col <= colMax; col++) {
			for (let row = rowMin; row <= rowMax; row++) {
				const world = this.hexToWorld(col, row);

				// Elliptical boundary
				if ((world.x / 11) ** 2 + (world.z / 7.5) ** 2 > 1) continue;

				const continent = this.getHexContinent(world.x, world.z);

				if (continent) {
					const mat = this.continentMaterials.get(continent)!;
					const mesh = new THREE.Mesh(landGeo, mat);
					mesh.rotation.x = -Math.PI / 2;
					mesh.position.set(world.x, 0, world.z);
					mesh.castShadow = true;
					mesh.receiveShadow = true;
					this.continentGroups.get(continent)!.add(mesh);
				} else {
					seaPositions.push(world);
				}
			}
		}

		// Sea hexes (individual meshes, same approach as land tiles for consistent rendering)
		if (seaPositions.length > 0) {
			const seaMat = new THREE.MeshStandardMaterial({
				color: 0x2eb5f6,
				roughness: 0.5,
				metalness: 0.08,
			});

			for (const pos of seaPositions) {
				const mesh = new THREE.Mesh(seaGeo, seaMat);
				mesh.rotation.x = -Math.PI / 2;
				mesh.position.set(pos.x, 0, pos.z);
				mesh.receiveShadow = true;
				this.scene.add(mesh);
			}
		}

		// Labels and city props per continent
		for (const [id, def] of Object.entries(CONTINENTS)) {
			const config = CONTINENT_CONFIG[id as keyof typeof CONTINENT_CONFIG];
			const group = this.continentGroups.get(id)!;

			const labelSprite = this.createLabel(config.name, def.color);
			labelSprite.position.set(def.center.x, 1.0, def.center.z);
			group.add(labelSprite);
			this.labelSprites.set(id, labelSprite);

			this.addCityProps(group, def);
		}
	}

	private addCityProps(group: THREE.Group, def: ContinentDef) {
		const cx = def.center.x;
		const cz = def.center.z;
		const buildingMat = new THREE.MeshStandardMaterial({ color: 0xc0d0e0, roughness: 0.45, metalness: 0.1 });

		for (let i = 0; i < 3; i++) {
			const angle = (i / 3) * Math.PI * 2 + 0.5;
			const r = 0.25 + Math.random() * 0.3;
			const bx = cx + Math.cos(angle) * r;
			const bz = cz + Math.sin(angle) * r;
			const h = 0.15 + Math.random() * 0.35;
			const w = 0.08 + Math.random() * 0.08;

			const geo = new THREE.BoxGeometry(w, h, w);
			const building = new THREE.Mesh(geo, buildingMat);
			building.position.set(bx, this.LAND_DEPTH + h / 2, bz);
			building.castShadow = true;
			group.add(building);
		}
	}

	private createLabel(text: string, color: number): THREE.Sprite {
		const canvas = document.createElement('canvas');
		canvas.width = 320;
		canvas.height = 64;
		const ctx = canvas.getContext('2d')!;

		ctx.clearRect(0, 0, 320, 64);

		const hexColor = `#${color.toString(16).padStart(6, '0')}`;

		ctx.fillStyle = 'rgba(10, 22, 40, 0.85)';
		ctx.beginPath();
		ctx.roundRect(4, 4, 312, 56, 28);
		ctx.fill();

		ctx.strokeStyle = hexColor;
		ctx.lineWidth = 2.5;
		ctx.beginPath();
		ctx.roundRect(4, 4, 312, 56, 28);
		ctx.stroke();

		ctx.shadowColor = hexColor;
		ctx.shadowBlur = 8;
		ctx.font = 'bold 24px "Segoe UI", system-ui, sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#e8edf5';
		ctx.fillText(text, 160, 34);
		ctx.shadowBlur = 0;

		const texture = new THREE.CanvasTexture(canvas);
		texture.needsUpdate = true;
		const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
		const sprite = new THREE.Sprite(mat);
		sprite.scale.set(2.2, 0.44, 1);
		return sprite;
	}

	private buildTradeRoutes() {
		const routes: Array<[string, string]> = [
			['europe', 'north-america'],
			['europe', 'africa'],
			['europe', 'asia'],
			['north-america', 'south-america'],
			['africa', 'asia'],
			['asia', 'oceania'],
			['south-america', 'africa'],
		];

		for (const [a, b] of routes) {
			const ca = CONTINENTS[a].center;
			const cb = CONTINENTS[b].center;

			const mid = {
				x: (ca.x + cb.x) / 2,
				z: (ca.z + cb.z) / 2,
			};

			const curve = new THREE.QuadraticBezierCurve3(
				new THREE.Vector3(ca.x, 0.22, ca.z),
				new THREE.Vector3(mid.x, 0.22, mid.z),
				new THREE.Vector3(cb.x, 0.22, cb.z),
			);

			const points = curve.getPoints(20);
			const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
			const lineMat = new THREE.LineDashedMaterial({
				color: 0x38bdf8,
				transparent: true,
				opacity: 0.12,
				dashSize: 0.25,
				gapSize: 0.12,
			});
			const line = new THREE.Line(lineGeo, lineMat);
			line.computeLineDistances();
			this.scene.add(line);
		}
	}

	private createHighlightRing() {
		const ringGeo = new THREE.RingGeometry(0.9, 1.1, 32);
		const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
		this.highlightRing = new THREE.Mesh(ringGeo, ringMat);
		this.highlightRing.rotation.x = -Math.PI / 2;
		this.highlightRing.visible = false;
		this.scene.add(this.highlightRing);
	}

	updateGameState(state: GameState) {
		this.clearDynamic();

		const player = state.players[state.currentPlayerIndex];

		for (const [id] of this.continentGroups) {
			const cStatus = player.continents[id as keyof typeof player.continents];
			const mat = this.continentMaterials.get(id);

			if (mat) {
				if (!cStatus.unlocked) {
					mat.opacity = 0.25;
					mat.transparent = true;
					mat.color.setHex(0x3a4555);
					mat.roughness = 0.9;
					mat.metalness = 0;
				} else {
					mat.opacity = 1;
					mat.transparent = false;
					mat.color.setHex(CONTINENTS[id].color);
					mat.roughness = 0.5;
					mat.metalness = 0.08;
				}
			}

			const label = this.labelSprites.get(id);
			if (label) {
				label.material.opacity = cStatus.unlocked ? 1.0 : 0.25;
			}
		}

		const jobsByContinent = new Map<string, Job[]>();
		for (const job of state.availableJobs) {
			const list = jobsByContinent.get(job.continent) || [];
			list.push(job);
			jobsByContinent.set(job.continent, list);
		}

		for (const [continent, jobs] of jobsByContinent) {
			const def = CONTINENTS[continent];
			if (!def) continue;

			for (let i = 0; i < jobs.length; i++) {
				const job = jobs[i];
				const angle = ((i + 0.5) / jobs.length) * Math.PI * 2 - Math.PI / 2;
				const r = 0.7;

				const pinGroup = new THREE.Group();
				const px = def.center.x + Math.cos(angle) * r;
				const pz = def.center.z + Math.sin(angle) * r;

				const stickGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6);
				const stickMat = new THREE.MeshStandardMaterial({ color: 0xcc5522, roughness: 0.4, metalness: 0.2 });
				const stick = new THREE.Mesh(stickGeo, stickMat);
				stick.position.y = 0.38;
				pinGroup.add(stick);

				const headGeo = new THREE.SphereGeometry(0.1, 12, 12);
				const headMat = new THREE.MeshStandardMaterial({
					color: 0xFF6B35,
					emissive: 0xFF6B35,
					emissiveIntensity: 0.4,
					roughness: 0.25,
					metalness: 0.1,
				});
				const head = new THREE.Mesh(headGeo, headMat);
				head.position.y = 0.58;
				head.castShadow = true;
				pinGroup.add(head);

				pinGroup.position.set(px, 0, pz);
				pinGroup.userData = { type: 'job', id: job.id };
				this.jobMeshes.set(job.id, head);
				this.scene.add(pinGroup);
			}
		}

		for (const humanoid of player.humanoids) {
			if (humanoid.assignedJobId) {
				const job = state.availableJobs.find(j => j.id === humanoid.assignedJobId);
				if (job) {
					this.createHumanoidOnContinent(humanoid, player.color, job.continent);
				}
			}
		}
	}

	private createHumanoidOnContinent(humanoid: PlayerHumanoid, color: string, continent: string) {
		const def = CONTINENTS[continent];
		if (!def) return;

		const group = new THREE.Group();

		const bodyGeo = new THREE.CapsuleGeometry(0.06, 0.18, 4, 8);
		const bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.4, metalness: 0.1 });
		const body = new THREE.Mesh(bodyGeo, bodyMat);
		body.position.y = 0.45;
		body.castShadow = true;
		group.add(body);

		const headGeo = new THREE.SphereGeometry(0.06, 8, 8);
		const headMat = new THREE.MeshStandardMaterial({ color: 0xffd4a3, roughness: 0.6 });
		const head = new THREE.Mesh(headGeo, headMat);
		head.position.y = 0.65;
		group.add(head);

		const visorGeo = new THREE.BoxGeometry(0.08, 0.025, 0.02);
		const visorMat = new THREE.MeshStandardMaterial({ color: 0x44aaff, emissive: 0x44aaff, emissiveIntensity: 0.5 });
		const visor = new THREE.Mesh(visorGeo, visorMat);
		visor.position.set(0, 0.65, 0.05);
		group.add(visor);

		const offset = (Math.random() - 0.5) * 0.6;
		group.position.set(def.center.x + offset, 0, def.center.z + offset);
		group.userData = { type: 'humanoid', id: humanoid.id };

		this.humanoidMeshes.set(humanoid.id, body);
		this.scene.add(group);
	}

	private readonly SECTOR_LABELS: Record<Sector, string> = {
		healthcare: 'Zorg',
		logistics: 'Logistiek',
		facility: 'Facilitair',
		agriculture: 'Agri',
		retail: 'Retail',
	};

	showSelectedJob(job: Job | null) {
		if (this.selectedJobCard) {
			this.selectedJobCard.parent?.remove(this.selectedJobCard);
			(this.selectedJobCard.material as THREE.SpriteMaterial).map?.dispose();
			(this.selectedJobCard.material as THREE.SpriteMaterial).dispose();
			this.selectedJobCard = null;
		}
		if (!job) return;

		const def = CONTINENTS[job.continent];
		if (!def) return;

		const canvas = document.createElement('canvas');
		canvas.width = 400;
		canvas.height = 160;
		const ctx = canvas.getContext('2d')!;

		ctx.fillStyle = 'rgba(10, 22, 40, 0.92)';
		ctx.beginPath();
		ctx.roundRect(4, 4, 392, 152, 14);
		ctx.fill();

		ctx.strokeStyle = '#FF6B35';
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.roundRect(4, 4, 392, 152, 14);
		ctx.stroke();

		ctx.shadowColor = '#FF6B35';
		ctx.shadowBlur = 6;
		ctx.font = 'bold 24px "Segoe UI", system-ui, sans-serif';
		ctx.fillStyle = '#e8edf5';
		ctx.textAlign = 'center';
		ctx.fillText(job.title, 200, 42, 360);
		ctx.shadowBlur = 0;

		ctx.font = '18px "Segoe UI", system-ui, sans-serif';
		ctx.fillStyle = '#8899b4';
		ctx.fillText(this.SECTOR_LABELS[job.sector] + ' | ' + CONTINENT_CONFIG[job.continent as keyof typeof CONTINENT_CONFIG].name, 200, 72);

		ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
		ctx.fillStyle = '#34d399';
		ctx.fillText(`\u{1F4B0} ${job.reward}  \u{2B50} +${job.reputationReward}  \u{26A0}\u{FE0F} ${job.risk}`, 200, 102);

		ctx.font = '16px "Segoe UI", system-ui, sans-serif';
		ctx.fillStyle = '#38bdf8';
		ctx.fillText('\u{2B07} Sleep een resource hierheen', 200, 136);

		const texture = new THREE.CanvasTexture(canvas);
		const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
		this.selectedJobCard = new THREE.Sprite(mat);
		this.selectedJobCard.scale.set(3.5, 1.4, 1);
		this.selectedJobCard.position.set(def.center.x, 2.0, def.center.z);
		this.selectedJobCard.userData = { type: 'jobcard', jobId: job.id, continent: job.continent };
		this.scene.add(this.selectedJobCard);
	}

	showDragCylinder(humanoidName: string, isRobot: boolean, worldX: number, worldZ: number) {
		this.clearDragCylinder();

		const group = new THREE.Group();
		const color = isRobot ? 0x3b82f6 : 0xf59e0b;
		const cylGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 16);
		const cylMat = new THREE.MeshStandardMaterial({
			color,
			emissive: color,
			emissiveIntensity: 0.3,
			roughness: 0.3,
			transparent: true,
			opacity: 0.85,
		});
		const cylinder = new THREE.Mesh(cylGeo, cylMat);
		cylinder.position.y = 0.5;
		cylinder.castShadow = true;
		group.add(cylinder);

		const label = this.createCylinderLabel(humanoidName, color);
		label.position.set(0, 1.0, 0);
		group.add(label);

		group.position.set(worldX, 0, worldZ);
		this.dragCylinder = group;
		this.scene.add(group);
	}

	private createCylinderLabel(text: string, color: number): THREE.Sprite {
		const canvas = document.createElement('canvas');
		canvas.width = 256;
		canvas.height = 48;
		const ctx = canvas.getContext('2d')!;

		ctx.fillStyle = 'rgba(10, 22, 40, 0.9)';
		ctx.beginPath();
		ctx.roundRect(2, 2, 252, 44, 22);
		ctx.fill();

		const hexColor = `#${color.toString(16).padStart(6, '0')}`;
		ctx.strokeStyle = hexColor;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.roundRect(2, 2, 252, 44, 22);
		ctx.stroke();

		ctx.shadowColor = hexColor;
		ctx.shadowBlur = 6;
		ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#e8edf5';
		ctx.fillText(text, 128, 26, 230);
		ctx.shadowBlur = 0;

		const texture = new THREE.CanvasTexture(canvas);
		const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
		const sprite = new THREE.Sprite(mat);
		sprite.scale.set(1.8, 0.34, 1);
		return sprite;
	}

	clearDragCylinder() {
		if (this.dragCylinder) {
			this.dragCylinder.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					child.geometry.dispose();
					(child.material as THREE.Material).dispose();
				}
				if (child instanceof THREE.Sprite) {
					(child.material as THREE.SpriteMaterial).map?.dispose();
					child.material.dispose();
				}
			});
			this.dragCylinder.parent?.remove(this.dragCylinder);
			this.dragCylinder = null;
		}
	}

	highlightJobCard(highlight: boolean) {
		if (this._jobCardHighlighted === highlight) return;
		this._jobCardHighlighted = highlight;
		if (this.selectedJobCard) {
			const mat = this.selectedJobCard.material as THREE.SpriteMaterial;
			if (highlight) {
				mat.color.setHex(0xaaffaa);
				this.selectedJobCard.scale.set(4.0, 1.6, 1);
			} else {
				mat.color.setHex(0xffffff);
				this.selectedJobCard.scale.set(3.5, 1.4, 1);
			}
		}
	}

	placeCylinderOnJob(jobId: string, continent: string, humanoidName: string, isRobot: boolean) {
		this.removePlacedCylinder(jobId);

		const def = CONTINENTS[continent];
		if (!def) return;

		const group = new THREE.Group();
		const color = isRobot ? 0x3b82f6 : 0xf59e0b;
		const cylGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 16);
		const cylMat = new THREE.MeshStandardMaterial({
			color,
			emissive: color,
			emissiveIntensity: 0.3,
			roughness: 0.3,
		});
		const cylinder = new THREE.Mesh(cylGeo, cylMat);
		cylinder.position.y = 0.5;
		cylinder.castShadow = true;
		group.add(cylinder);

		const label = this.createCylinderLabel(humanoidName, color);
		label.position.set(0, 1.0, 0);
		group.add(label);

		group.position.set(def.center.x, 0, def.center.z);
		this.placedCylinders.set(jobId, group);
		this.scene.add(group);
	}

	removePlacedCylinder(jobId: string) {
		const existing = this.placedCylinders.get(jobId);
		if (existing) {
			existing.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					child.geometry.dispose();
					(child.material as THREE.Material).dispose();
				}
				if (child instanceof THREE.Sprite) {
					(child.material as THREE.SpriteMaterial).map?.dispose();
					child.material.dispose();
				}
			});
			existing.parent?.remove(existing);
			this.placedCylinders.delete(jobId);
		}
	}

	clearAllPlacedCylinders() {
		for (const [jobId] of this.placedCylinders) {
			this.removePlacedCylinder(jobId);
		}
	}

	screenToWorld(clientX: number, clientY: number): { x: number; z: number } | null {
		const rect = this.renderer.domElement.getBoundingClientRect();
		const mouse = new THREE.Vector2(
			((clientX - rect.left) / rect.width) * 2 - 1,
			-((clientY - rect.top) / rect.height) * 2 + 1
		);
		this.raycaster.setFromCamera(mouse, this.camera);
		const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
		const target = new THREE.Vector3();
		const hit = this.raycaster.ray.intersectPlane(plane, target);
		if (!hit) return null;
		return { x: target.x, z: target.z };
	}

	getJobAtPosition(clientX: number, clientY: number): string | null {
		const world = this.screenToWorld(clientX, clientY);
		if (!world) return null;

		let closestJobId: string | null = null;
		let closestDist = Infinity;

		for (const [jobId, mesh] of this.jobMeshes) {
			const group = mesh.parent;
			if (group) {
				const dx = world.x - group.position.x;
				const dz = world.z - group.position.z;
				const dist = dx * dx + dz * dz;
				if (dist < closestDist) {
					closestDist = dist;
					closestJobId = jobId;
				}
			}
		}

		if (closestJobId && closestDist < 2.25) {
			return closestJobId;
		}

		return null;
	}

	highlightContinent(continentId: string | null) {
		for (const [id, mat] of this.continentMaterials) {
			if (id === continentId) {
				mat.emissive.setHex(0xFFFF00);
				mat.emissiveIntensity = 0.3;
			} else {
				mat.emissive.setHex(0x000000);
				mat.emissiveIntensity = 0;
			}
		}
	}

	private clearDynamic() {
		this.showSelectedJob(null);
		this.clearDragCylinder();
		this.clearAllPlacedCylinders();

		for (const group of this.assignedCylinders) {
			group.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					child.geometry.dispose();
					(child.material as THREE.Material).dispose();
				}
				if (child instanceof THREE.Sprite) {
					(child.material as THREE.SpriteMaterial).map?.dispose();
					child.material.dispose();
				}
			});
			group.parent?.remove(group);
		}
		this.assignedCylinders = [];

		for (const [, mesh] of this.jobMeshes) {
			const group = mesh.parent;
			if (group) {
				group.parent?.remove(group);
				group.traverse((child) => {
					if (child instanceof THREE.Mesh) {
						child.geometry.dispose();
						(child.material as THREE.Material).dispose();
					}
				});
			}
		}
		this.jobMeshes.clear();

		for (const [, mesh] of this.humanoidMeshes) {
			const group = mesh.parent;
			if (group) {
				group.parent?.remove(group);
				group.traverse((child) => {
					if (child instanceof THREE.Mesh) {
						child.geometry.dispose();
						(child.material as THREE.Material).dispose();
					}
				});
			}
		}
		this.humanoidMeshes.clear();

		for (const line of this.assignmentLines) {
			line.parent?.remove(line);
			line.geometry.dispose();
			(line.material as THREE.Material).dispose();
		}
		this.assignmentLines = [];
	}

	private onMouseMove(event: MouseEvent) {
		if (this.isPanning) {
			const panSpeed = 0.02 * (this.frustumSize / 14);
			const dx = (event.clientX - this.panStart.x) * panSpeed;
			const dy = (event.clientY - this.panStart.y) * panSpeed;
			this.cameraTarget.x -= dx;
			this.cameraTarget.z -= dy;
			this.cameraTarget.x = Math.max(-8, Math.min(8, this.cameraTarget.x));
			this.cameraTarget.z = Math.max(-5, Math.min(5, this.cameraTarget.z));
			this.camera.position.x = this.cameraTarget.x;
			this.camera.position.z = this.cameraTarget.z + 8;
			this.camera.lookAt(this.cameraTarget.x, 0, this.cameraTarget.z);
			this.panStart.x = event.clientX;
			this.panStart.y = event.clientY;
			return;
		}

		const rect = this.renderer.domElement.getBoundingClientRect();
		this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

		this.raycaster.setFromCamera(this.mouse, this.camera);
		const intersects = this.raycaster.intersectObjects(this.scene.children, true);

		this.renderer.domElement.style.cursor = 'default';
		if (this.highlightRing) this.highlightRing.visible = false;
		this.hoveredObject = null;

		for (const intersect of intersects) {
			let obj: THREE.Object3D | null = intersect.object;
			while (obj && !obj.userData.type) obj = obj.parent;
			if (obj?.userData.type) {
				this.hoveredObject = obj;
				this.renderer.domElement.style.cursor = 'pointer';
				if (this.highlightRing && obj.userData.type === 'continent') {
					const def = CONTINENTS[obj.userData.id];
					if (def) {
						this.highlightRing.position.set(def.center.x, 0.25, def.center.z);
						this.highlightRing.visible = true;
					}
				}
				break;
			}
		}
	}

	private onClick() {
		if (!this.hoveredObject) return;
		const data = this.hoveredObject.userData;
		if (data.type === 'continent') this.onContinentClick?.(data.id);
		if (data.type === 'job') this.onJobClick?.(data.id);
		if (data.type === 'humanoid') this.onHumanoidClick?.(data.id);
	}

	private onWheel(event: WheelEvent) {
		event.preventDefault();
		if (event.deltaY > 0) {
			this.setZoomLevel(this._zoomLevel - 1);
		} else {
			this.setZoomLevel(this._zoomLevel + 1);
		}
	}

	private onPanStart(event: MouseEvent) {
		if (event.button === 1 || event.button === 2 || (event.button === 0 && event.ctrlKey)) {
			this.isPanning = true;
			this.panStart = { x: event.clientX, y: event.clientY };
			event.preventDefault();
		}
	}

	private onPanEnd() {
		this.isPanning = false;
	}

	private zoomLevelToFrustum(level: number): number {
		return this.maxFrustum - ((level - 1) / 9) * (this.maxFrustum - this.minFrustum);
	}

	get zoomLevel(): number {
		return this._zoomLevel;
	}

	setZoomLevel(level: number) {
		this._zoomLevel = Math.max(1, Math.min(10, Math.round(level)));
		this.frustumSize = this.zoomLevelToFrustum(this._zoomLevel);
		this.updateCameraFrustum();
		this.onZoomChange?.(this._zoomLevel);
	}

	resetView() {
		this.cameraTarget = { x: 0, z: 0 };
		this.setZoomLevel(5);
		this.camera.position.set(0, 20, 8);
		this.camera.lookAt(0, 0, 0);
	}

	private onDragOver(event: DragEvent) {
		event.preventDefault();
		if (!event.dataTransfer) return;
		event.dataTransfer.dropEffect = 'move';

		if (this._dragHumanoidName) {
			const nearJob = this.getJobAtPosition(event.clientX, event.clientY);
			this.highlightJobCard(!!nearJob);

			if (nearJob) {
				const jobMesh = this.jobMeshes.get(nearJob);
				const group = jobMesh?.parent;
				if (group) {
					this.showDragCylinder(this._dragHumanoidName, this._dragHumanoidIsRobot, group.position.x, group.position.z);
				}
			} else {
				const world = this.screenToWorld(event.clientX, event.clientY);
				if (world) {
					this.showDragCylinder(this._dragHumanoidName, this._dragHumanoidIsRobot, world.x, world.z);
				}
			}
		}
	}

	private _dragHumanoidName: string = '';
	private _dragHumanoidIsRobot: boolean = false;
	private _dragHumanoidId: string = '';

	setDragHumanoidInfo(id: string, name: string, isRobot: boolean) {
		this._dragHumanoidId = id;
		this._dragHumanoidName = name;
		this._dragHumanoidIsRobot = isRobot;
	}

	clearDragHumanoidInfo() {
		this._dragHumanoidId = '';
		this._dragHumanoidName = '';
		this._dragHumanoidIsRobot = false;
		this.clearDragCylinder();
	}

	private onDropEvent(event: DragEvent) {
		event.preventDefault();
		const humanoidId = event.dataTransfer?.getData('text/plain');

		if (humanoidId) {
			const jobId = this.getJobAtPosition(event.clientX, event.clientY);
			if (jobId) {
				this.onJobPlace?.(jobId, humanoidId);
			}
		}

		this.highlightJobCard(false);
		this.clearDragCylinder();
	}

	private onDragLeave() {
		this.highlightJobCard(false);
		this.clearDragCylinder();
	}

	private updateCameraFrustum() {
		const aspect = this.container.clientWidth / this.container.clientHeight;
		this.camera.left = -this.frustumSize * aspect / 2;
		this.camera.right = this.frustumSize * aspect / 2;
		this.camera.top = this.frustumSize / 2;
		this.camera.bottom = -this.frustumSize / 2;
		this.camera.updateProjectionMatrix();
	}

	private onResize() {
		this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
		this.updateCameraFrustum();
	}

	private animate() {
		this.animationId = requestAnimationFrame(() => this.animate());
		this.time += 0.016;

		for (const [, mesh] of this.jobMeshes) {
			const group = mesh.parent;
			if (group) {
				group.position.y = Math.sin(this.time * 2.5 + group.position.x * 0.5) * 0.06;
			}
			const mat = mesh.material as THREE.MeshStandardMaterial;
			mat.emissiveIntensity = 0.3 + Math.sin(this.time * 3 + mesh.position.x) * 0.15;
		}

		if (this.highlightRing?.visible) {
			const scale = 1 + Math.sin(this.time * 4) * 0.06;
			this.highlightRing.scale.set(scale, scale, 1);
			(this.highlightRing.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(this.time * 3) * 0.2;
		}

		for (const [, sprite] of this.labelSprites) {
			sprite.position.y = 1.0 + Math.sin(this.time * 0.6 + sprite.position.x * 0.3) * 0.04;
		}

		if (this.selectedJobCard) {
			this.selectedJobCard.position.y = 2.0 + Math.sin(this.time * 1.5) * 0.06;
		}

		this.renderer.render(this.scene, this.camera);
	}

	dispose() {
		cancelAnimationFrame(this.animationId);
		this.clearDynamic();
		this.renderer.dispose();
		this.renderer.domElement.remove();
		window.removeEventListener('resize', this.onResize.bind(this));
	}
}
