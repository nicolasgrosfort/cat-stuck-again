let player, grounds, obstacles, trees;
let gameOver = false;
let jump = false;
let catched = false;
let shouldFight = false;
let fight = false;
let bodyPose;
let poses = [];
let lastSpawnX = 0;

const message = {
	text: "",
	expiration: 0,
};

let giraffeLife = 100,
	robotLife = 100;

const freeMode = false; // mode sans obstacles, pour tester la détection de pose

const size = {
	width: 640,
	height: 480,
};

const tresholdJump = size.height * 0.4;
const tresholdCatch = size.height * 0.4;

console.log("ml5 version:", ml5.version);

// biome-ignore lint/correctness/noUnusedVariables: <>
function preload() {
	bodyPose = ml5.bodyPose();
}

// biome-ignore lint/correctness/noUnusedVariables: <>
function setup() {
	new Canvas(size.width, size.height);
	noSmooth();

	video = createCapture(VIDEO);
	video.size(size.width, size.height);
	video.hide();
	bodyPose.detectStart(video, gotPoses);

	// World
	world.gravity.y = 30;

	// Player
	player = new Sprite(120, height - 160, 40, 60);
	player.color = "gold";
	player.rotationLock = true;
	player.friction = 0;
	player.vel.x = 6;
	player.bounciness = 0;

	// Grounds
	grounds = new Group();
	grounds.collider = "static";
	grounds.color = "green";
	grounds.h = 40;
	grounds.w = 600;
	grounds.bounciness = 0;

	// On crée

	// 3 segments de sol pour boucler
	const groundY = height - grounds.h / 2;
	for (let i = 0; i < 3; i++) {
		new grounds.Sprite(i * grounds.w + grounds.w / 2, groundY);
	}

	// Obstacles
	obstacles = new Group();
	obstacles.collider = "none";
	obstacles.w = 40;
	obstacles.h = 40;
	obstacles.color = "tomato";
	obstacles.offset.y = -obstacles.h / 2; // posé sur le sol

	// Trees
	trees = new Group();
	trees.collider = "none";
	trees.w = 80;
	trees.h = 200;
	trees.color = "lightgreen";
	trees.offset.y = 0; // posé sur le sol

	textFont("monospace");
}

// biome-ignore lint/correctness/noUnusedVariables: <>
function draw() {
	background("#87CEEB");

	if (fight) {
		camera.off();
		background("red");
		fill(255);
		textAlign(CENTER, CENTER);
		textSize(48);
		text("FIGHT!", width / 2, height / 2);
		if (mouse.presses() || kb.presses("r")) restart();
		camera.on();
		return;
	}

	if (gameOver) {
		camera.off();
		background(10);
		fill(255);
		textAlign(CENTER, CENTER);
		textSize(28);
		text("Game Over\nClick or press [R] to restart", width / 2, height / 2);
		if (mouse.presses() || kb.presses("r")) restart();
		camera.on();
		return;
	}

	// Caméra suit le joueur
	camera.x = player.x + width * 0.25;

	// Recyclage des segments de sol (quand ils sortent à gauche, on les remet à droite)
	for (const g of grounds) {
		if (g.x + g.w / 2 < camera.x - width / 2) {
			g.x += grounds.length * g.w;
		}
	}

	// Saut (seulement si on touche le sol)
	const onGround = player.colliding(grounds);

	if (kb.presses("c")) catched = true;

	if (
		(jump ||
			mouse.presses() ||
			kb.presses("space") ||
			kb.presses("w") ||
			kb.presses("up")) &&
		onGround
	) {
		player.vel.y = -12;
	}

	if (catched) {
		player.color = "cyan";
	} else {
		player.color = "gold";
	}

	// Spawn d’obstacles devant la caméra
	spawnObstacle();
	spawnTree();

	// Collision = fin de partie
	if (player.colliding(obstacles)) {
		gameOver = true;
	}

	// Check collision obstacles
	for (const o of obstacles) {
		if (player.overlaps(o)) {
			const nextEnergy = Math.round(random(-3, -1));
			const dir = Math.round(random([-1, 1]));

			const expiration = frameCount + 60 * 3; // durée d’affichage du message

			if (dir < 0) {
				giraffeLife += nextEnergy;
				message.text = `Giraffe ${nextEnergy}`;
				message.expiration = expiration;
			} else {
				robotLife += nextEnergy;
				message.text = `Robot ${nextEnergy}`;
				message.expiration = expiration;
			}
		}
	}

	for (const t of trees) {
		if (player.overlaps(t)) {
			// Exemple : changer la couleur du player
			if (shouldFight) fight = true;
			else if (catched) {
				const nextEnergy = Math.round(random(1, 3));
				const dir = Math.round(random([-1, 1]));

				const expiration = frameCount + 60 * 3; // durée d’affichage du message

				if (dir < 0) {
					giraffeLife += nextEnergy;
					message.text = `Giraffe ${nextEnergy}`;
					message.expiration = expiration;
				} else {
					robotLife += nextEnergy;
					message.text = `Robot ${nextEnergy}`;
					message.expiration = expiration;
				}
			}
		}
	}

	displayMessage();

	decreaseLife();

	drawHUD();
	drawBodyOverlay();
}

function gotPoses(results) {
	poses = results;
}

function decreaseLife() {
	giraffeLife =
		frameCount % 30 === 0
			? giraffeLife - Math.round(random([0, 1]))
			: giraffeLife;
	robotLife =
		frameCount % 30 === 0 ? robotLife - Math.round(random([0, 1])) : robotLife;

	if (giraffeLife <= 0 || robotLife <= 0) {
		gameOver = true;
	}
}

function drawHUD() {
	camera.off(); // HUD fixe à l’écran

	// Girafe life, top left
	fill(0, 0, 0, 100);
	rect(12, 12, 150, 46, 8);
	fill(255);
	textSize(16);
	textAlign(LEFT, CENTER);
	text(`GIRAFFE: ${giraffeLife}`, 24, 35);

	// Robot life, top right
	fill(0, 0, 0, 100);
	rect(width - 162, 12, 150, 46, 8);
	fill(255);
	textSize(16);
	textAlign(LEFT, CENTER);
	text(`ROBOT: ${robotLife}`, width - 150, 35);

	camera.on();
}

function restart() {
	// Reset joueur
	player.pos = { x: 120, y: height - 160 };
	player.vel = { x: 6, y: 0 };
	player.rotation = 0;

	// Reset obstacles
	obstacles.removeAll();

	// Replacer les segments de sol
	let i = 0;
	for (const g of grounds) {
		g.x = i * g.w + g.w / 2;
		i++;
	}

	score = 0;
	gameOver = false;
}

function drawBodyOverlay() {
	camera.off();

	push();
	translate(width, 0);
	scale(-1, 1);

	let shouldJump = true;
	let shouldCatch = false;

	let catchs = [];

	for (let i = 0; i < poses.length; i++) {
		const pose = poses[i];

		const head = pose.keypoints[0];
		const rightHand = pose.keypoints[10];

		// Gestion du jump : toutes les têtes doivent être au-dessus du seuil
		if (head.y >= tresholdJump && head.y > 0) {
			shouldJump = false;
		}

		if (rightHand.y <= tresholdCatch && rightHand.y > 0) {
			shouldCatch = true;
		} else {
			shouldCatch = false;
		}

		catchs.push(shouldCatch);

		// Debug visuel
		noStroke();
		fill(255, 0, 0);
		circle(width, head.y, 20);
		circle(0, rightHand.y, 20);
	}

	pop();
	camera.on();

	// Jump si toutes les têtes au-dessus du seuil
	jump = shouldJump && poses.length > 0;
	catched = shouldCatch && poses.length > 0;

	shouldFight = catchs.every((c) => c) && poses.length > 1; // switch to 1 to handle 2 player

	catchs = [];
}

function displayMessage() {
	if (message.text === "" || frameCount > message.expiration) return;
	camera.off();
	fill(0, 0, 0, 200);
	rect(0, height / 2 - 40, width, 80);
	fill(255);
	textAlign(CENTER, CENTER);
	textSize(24);
	text(message.text, width / 2, height / 2);
	camera.on();
}

function spawnObstacle() {
	if (freeMode) return;

	if (frameCount % int(random(60, 90)) === 0) {
		const minDistance = 200; // distance minimale
		const xSpawn = camera.x + width + random(80, 240);
		const yTop = height - grounds.h - obstacles.h / 2;

		// Vérifie que le nouvel obstacle est assez loin du précédent
		if (xSpawn - lastSpawnX >= minDistance) {
			new obstacles.Sprite(xSpawn, yTop);
			lastSpawnX = xSpawn;
		}
	}

	// Nettoyage des obstacles passés derrière la caméra (perf)
	for (const o of obstacles) {
		if (o.x + o.w < camera.x - width) o.remove();
	}
}

function spawnTree() {
	// Spawn d’arbres
	if (frameCount % 120 === 0) {
		const xSpawn = camera.x + width + random(80, 240);
		const yTop = height - grounds.h - trees.h / 2;

		new trees.Sprite(xSpawn, yTop);
	}

	// Nettoyage des arbres passés derrière la caméra (perf)
	for (const t of trees) {
		if (t.x + t.w < camera.x - width) t.remove();
	}
}
