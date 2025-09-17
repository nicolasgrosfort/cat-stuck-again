let player, grounds, obstacles, trees;
let gameOver = false;
let squat = false;
let jump = false;
let win = false;
let catched = false;
let shouldFight = false;
let fight = false;
let bodyPose;
let poses = [];

const TILE = 100;

const message = {
	text: "",
	expiration: 0,
};

let giraffeLife = 100,
	robotLife = 100;

const size = {
	width: 640,
	height: 480,
};

const SPEED = 6;

const tresholdJump = size.height * 0.4;
const tresholdCatch = size.height * 0.5;
const tresholdSquat = size.height * 0.6;

const levelLines = [
	"--------------T-----O---HH-----T-O--T-----O-----TO---HH---T----O----T---O----T-------H-----HH--O------E",
];

// biome-ignore lint/correctness/noUnusedVariables: <>
function preload() {
	bodyPose = ml5.bodyPose();
}

function buildLevel() {
	const line = levelLines[0];

	// --- A) SOLS : segments fusionnés entre 'H' ---
	let start = null;
	for (let col = 0; col <= line.length; col++) {
		const isGround = col < line.length && line[col] !== "H";
		if (isGround && start === null) start = col; // début de segment
		if ((!isGround || col === line.length) && start !== null) {
			// segment [start .. col-1]
			const len = col - start;
			const segW = len * TILE;
			const x = Math.round(start * TILE + (len * TILE) / 2);
			const y = Math.round(height - grounds.h * 0.5);

			const g = new grounds.Sprite(x, y);
			g.w = segW; // largeur du segment d’un coup
			g.h = grounds.h;
			g.rotation = 0;
			g.friction = 0;
			g.bounciness = 0;

			start = null;
		}
	}

	// --- B) OBJETS (O/T/E) : positionnés colonne par colonne ---
	for (let col = 0; col < line.length; col++) {
		const c = line[col];
		const xCenter = Math.round(col * TILE + TILE * 0.5);
		const yGroundTop = Math.round(height - grounds.h);

		if (c === "O") {
			const yO = Math.round(yGroundTop - obstacles.h * 2);
			new obstacles.Sprite(xCenter, yO);
		} else if (c === "T") {
			const yT = Math.round(yGroundTop - trees.h * 0.5);
			new trees.Sprite(xCenter, yT);
		} else if (c === "E") {
			const end = new Sprite(
				xCenter,
				Math.round(yGroundTop - TILE),
				TILE * 0.5,
				TILE * 2,
			);
			end.collider = "none";
			end.color = "blue";
			end.stroke = "lightblue";
			end.rotationLock = true;
			end.friction = 0;
			end.bounciness = 0;
			end.overlaps(player, () => {
				win = true;
			}); // assure-toi d’avoir let win = false;
		}
	}
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
	player = new Sprite(TILE, height - TILE * 2, TILE * 0.5, TILE);
	player.color = "yellow";
	player.stroke = "lightblue";
	player.rotationLock = true;
	player.friction = 0;
	player.bounciness = 0;
	player.vel.x = SPEED;

	// Grounds
	grounds = new Group();
	grounds.collider = "static";
	grounds.color = "brown";
	grounds.stroke = "lightblue";
	grounds.h = TILE * 0.5;
	grounds.w = TILE;
	grounds.bounciness = 0;

	// Obstacles
	obstacles = new Group();
	obstacles.collider = "none";
	obstacles.w = TILE * 0.5;
	obstacles.h = TILE * 0.5;
	obstacles.color = "tomato";
	obstacles.stroke = "lightblue";
	obstacles.offset.y = -obstacles.h / 2; // posé sur le sol

	// Trees
	trees = new Group();
	trees.collider = "none";
	trees.w = TILE * 0.5;
	trees.h = TILE * 2;
	trees.color = "green";
	trees.stroke = "lightblue";
	trees.offset.y = 0; // posé sur le sol

	textFont("monospace");

	buildLevel();
}

// biome-ignore lint/correctness/noUnusedVariables: <>
function draw() {
	background("lightblue");

	if (win) {
		camera.off();
		background("lightgreen");
		fill(0);
		textAlign(CENTER, CENTER);
		textSize(48);
		text("YOU WIN!", width / 2, height / 2);
		if (mouse.presses() || kb.presses("r")) restart();
		camera.on();
		return;
	}

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

	// Saut (seulement si on touche le sol)
	const onGround = player.colliding(grounds);

	if (kb.pressing("c")) catched = true;
	if (kb.pressing("s") || kb.pressing("down")) squat = true;
	if (
		mouse.presses() ||
		kb.presses("space") ||
		kb.presses("w") ||
		kb.presses("up")
	)
		jump = true;

	if (jump && onGround) {
		player.vel.y = -10;
		player.rotation = 0;
		player.vel.x = SPEED;
	}

	if (squat) {
		player.scale.y = 0.5;
	} else {
		player.scale.y = 1;
	}

	if (catched) {
		player.color = "orange";
	} else {
		player.color = "yellow";
	}

	// Check collision obstacles
	for (const o of obstacles) {
		if (player.overlaps(o)) {
			const nextEnergy = Math.round(random(-10, -1));
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
				const nextEnergy = Math.round(random(1, 5));
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

	drawTresholdIndicator();

	if (giraffeLife <= 0 || robotLife <= 0 || player.y > height - player.h / 2) {
		gameOver = true;
	}
}

function gotPoses(results) {
	poses = results;
}

function decreaseLife() {
	giraffeLife =
		frameCount % 10 === 0
			? giraffeLife - Math.round(random([0, 1]))
			: giraffeLife;
	robotLife =
		frameCount % 10 === 0 ? robotLife - Math.round(random([0, 1])) : robotLife;
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
	player.pos.x = TILE;
	player.pos.y = height - TILE * 2;
	player.vel.x = SPEED;
	player.vel.y = 0;
	player.rotation = 0;

	score = 0;
	gameOver = false;
	win = false;
	fight = false;
	giraffeLife = 100;
	robotLife = 100;
}

// Draw treshold indicator
function drawTresholdIndicator() {
	camera.off();
	stroke("red");
	noFill();
	rect(-10, tresholdJump, 20, 1);
	rect(-10, tresholdSquat, 20, 1);
	rect(width - 10, tresholdCatch, 20, 1);
	camera.on();
}

function drawBodyOverlay() {
	camera.off();

	push();
	translate(width, 0);
	scale(-1, 1);

	let shouldJump = true;
	let shouldSquat = true;
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

		// Gestion du squat : toutes les têtes doivent être en-dessous du seuil
		if (head.y <= tresholdSquat && head.y > 0) {
			shouldSquat = false;
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
	squat = shouldSquat && poses.length > 0;

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
