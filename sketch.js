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

const tresholdJump = size.height * 0.4;
const tresholdCatch = size.height * 0.4;

const levelLines = [
	"---------O---H-----T---T-----O------H-------O----T-------T-------H---E",
];

console.log("ml5 version:", ml5.version);

// biome-ignore lint/correctness/noUnusedVariables: <>
function preload() {
	bodyPose = ml5.bodyPose();
}

function buildLevel() {
	for (let row = 0; row < levelLines.length; row++) {
		const line = levelLines[row];
		for (let col = 0; col < line.length; col++) {
			const char = line[col];

			const xSprite = col * TILE + TILE * 0.5;
			const ySprite = height - grounds.h;

			const xGround = col * TILE + TILE / 2;
			const yGround = height - grounds.h / 2;

			if (char !== "H") new grounds.Sprite(xGround, yGround);
			if (char === "O")
				new obstacles.Sprite(xSprite, ySprite - obstacles.h * 2);
			if (char === "T") new trees.Sprite(xSprite, ySprite - trees.h * 0.5);

			if (char === "E") {
				const xEnd = col * TILE + TILE * 0.5;
				const yEnd = height - grounds.h - TILE;
				const end = new Sprite(xEnd, yEnd, TILE * 0.5, TILE * 2);
				end.collider = "none";
				end.color = "blue";
				end.rotationLock = true;
				end.friction = 0;
				end.bounciness = 0;

				end.overlaps(player, () => {
					win = true;
				});
			}
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
	player.color = "gold";
	player.rotationLock = true;
	player.friction = 0;
	player.bounciness = 0;
	player.vel.x = 8;

	// Grounds
	grounds = new Group();
	grounds.collider = "static";
	grounds.color = "green";
	grounds.h = TILE * 0.5;
	grounds.w = TILE;
	grounds.bounciness = 0;

	// Obstacles
	obstacles = new Group();
	obstacles.collider = "none";
	obstacles.w = TILE * 0.5;
	obstacles.h = TILE * 0.5;
	obstacles.color = "tomato";
	obstacles.offset.y = -obstacles.h / 2; // posé sur le sol

	// Trees
	trees = new Group();
	trees.collider = "none";
	trees.w = TILE * 0.5;
	trees.h = TILE * 2;
	trees.color = "lightgreen";
	trees.offset.y = 0; // posé sur le sol

	textFont("monospace");

	buildLevel();
}

// biome-ignore lint/correctness/noUnusedVariables: <>
function draw() {
	background("#87CEEB");

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
	else squat = false;

	if (
		(jump ||
			mouse.presses() ||
			kb.presses("space") ||
			kb.presses("w") ||
			kb.presses("up")) &&
		onGround
	) {
		player.vel.y = -10;
	}

	if (squat) {
		player.scale.y = 0.5;
	} else {
		player.scale.y = 1;
	}

	if (catched) {
		player.color = "cyan";
	} else {
		player.color = "gold";
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

	if (giraffeLife <= 0 || robotLife <= 0 || player.y > height - player.h / 2) {
		gameOver = true;
	}
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

	score = 0;
	gameOver = false;
	win = false;
	fight = false;
	giraffeLife = 100;
	robotLife = 100;
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
