let player, grounds, obstacles;
let score = 0;
let gameOver = false;
let jump = false;
let catched = false;
let bodyPose;
let poses = [];
let lastSpawnX = 0;

const freeMode = true; // mode sans obstacles, pour tester la détection de pose

const size = {
	width: 640,
	height: 480,
};

const tresholdJump = size.height * 0.5;

console.log("ml5 version:", ml5.version);

// biome-ignore lint/correctness/noUnusedVariables: <>
function preload() {
	bodyPose = ml5.bodyPose();
	playerImg = loadImage("assets/giraffe.png");
	groundImg = loadImage("assets/ground.png");
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
	world.gravity.y = 40;

	// Player
	player = new Sprite(120, height - 160, 40, 60);
	player.image = playerImg;
	player.rotationLock = true;
	player.friction = 0;
	player.vel.x = 6;

	// Grounds
	grounds = new Group();
	grounds.image = groundImg;
	grounds.collider = "static";
	grounds.color = "green";
	grounds.w = 200;
	grounds.h = 75;

	// 3 segments de sol pour boucler
	const groundY = height - grounds.h / 2;
	for (let i = 0; i < 3; i++) new grounds.Sprite(i * grounds.w, groundY);

	// Obstacles
	obstacles = new Group();
	obstacles.collider = "static";
	obstacles.w = 20;
	obstacles.h = 40;
	obstacles.color = "tomato";
	obstacles.offset.y = -obstacles.h / 2; // posé sur le sol

	textFont("monospace");
}

// biome-ignore lint/correctness/noUnusedVariables: <>
function draw() {
	background("#87CEEB");

	if (gameOver) {
		camera.off();
		background(10);
		fill(255);
		textAlign(CENTER, CENTER);
		textSize(28);
		text("Game Over\nClick or press [R] to restart", camera.x, camera.y);
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

	// Spawn d’obstacles devant la caméra
	// (tous les ~60–90 frames, positionnés au hasard dans une petite plage)
	if (frameCount % int(random(60, 90)) === 0) {
		const xSpawn = camera.x + width + random(80, 240);
		const yTop = height - grounds.h - obstacles.h / 2;
		new obstacles.Sprite(xSpawn, yTop);
	}

	// Nettoyage des obstacles passés derrière la caméra (perf)
	for (const o of obstacles) {
		if (o.x + o.w < camera.x - width) o.remove();
	}

	// Collision = fin de partie
	if (player.colliding(obstacles)) {
		gameOver = true;
	}

	// Score = distance parcourue
	score = max(score, int((player.x - 120) / 10));
	drawHUD();

	drawHandsOverlay(); // <= ajoute cet appel
}

function gotPoses(results) {
	poses = results;
}

function drawHUD() {
	camera.off(); // HUD fixe à l’écran
	fill(0, 0, 0, 100);
	rect(12, 12, 150, 46, 8);
	fill(255);
	textSize(16);
	textAlign(LEFT, CENTER);
	text(`SCORE: ${score}`, 24, 35);
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

function drawHandsOverlay() {
	camera.off();

	push();
	translate(width, 0);
	scale(-1, 1);

	let shouldJump = true;

	for (let i = 0; i < poses.length; i++) {
		const pose = poses[i];
		const head = pose.keypoints[0];

		if (head.y >= tresholdJump) {
			shouldJump = false;
		}

		noStroke();
		fill(255, 0, 0);
		circle(head.x, head.y, 20);
	}

	pop();
	camera.on();

	jump = shouldJump && poses.length > 0;
}
