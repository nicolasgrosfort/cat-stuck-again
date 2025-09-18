const TILE = 100;
const SPEED = 5;
const JUMP = -15;
const LIFE = 100;
const GRAVITY = 30;

const MIN_PLAYER = 1;

const SIZE = {
	width: 640,
	height: 480,
};

const TRESHOLD = {
	jump: SIZE.height * 0.4,
	catch: SIZE.height * 0.5,
	squat: SIZE.height * 0.6,
};

const GIRAFFE = {
	isActive: false,
	id: null,
};

const ROBOT = {
	isActive: false,
	id: null,
};

const MESSAGE = {
	text: "",
	expiration: 0,
};

let player, grounds, obstacles, trees;

let gameOver = false,
	fight = false,
	win = false,
	waitingForPlayers = true;

let squat = false,
	jump = false,
	catched = false;

let shouldFight = false,
	jumpArmed = true;

let bodyPose,
	poses = [];

let giraffeLife = LIFE,
	robotLife = LIFE;

const levelLines = [
	"--------------T-----O---HH-----T-O--T-----O-----TO---HH---T----O----T---O----T-------H-----HH--O------E",
];

// biome-ignore lint/correctness/noUnusedVariables: <>
function preload() {
	bodyPose = ml5.bodyPose();
}

// biome-ignore lint/correctness/noUnusedVariables: <>
function setup() {
	new Canvas(SIZE.width, SIZE.height);
	noSmooth();

	video = createCapture(VIDEO);
	video.size(SIZE.width, SIZE.height);
	video.hide();
	bodyPose.detectStart(video, gotPoses);

	// World
	world.gravity.y = GRAVITY;

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

	visualGrounds = new Group();
	visualGrounds.collider = "none";
	visualGrounds.color = "red";
	visualGrounds.stroke = "lightblue";
	visualGrounds.h = TILE * 0.5;
	visualGrounds.w = TILE;
	visualGrounds.bounciness = 0;

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

	// Clouds
	clouds = new Group();
	clouds.collider = "none";
	clouds.w = TILE;
	clouds.h = TILE * 0.5;
	clouds.color = "white";
	clouds.stroke = "lightblue";
	clouds.offset.y = -TILE * 1.5; // dans le ciel

	textFont("monospace");

	buildLevel();
}

// biome-ignore lint/correctness/noUnusedVariables: <>
function draw() {
	background("lightblue");

	bodyReady();

	if (win) {
		camera.off();
		background("lightgreen");
		noStroke();
		fill(0);
		textAlign(CENTER, CENTER);
		textSize(48);
		text("YOU WIN!", width / 2, height / 2);
		player.vel.x = 0;
		if (mouse.presses() || kb.presses("r")) restart();
		camera.on();
		return;
	}

	if (fight) {
		camera.off();
		background("red");
		noStroke();
		fill(255);
		textAlign(CENTER, CENTER);
		textSize(48);
		text("FIGHT!", width / 2, height / 2);
		player.vel.x = 0;
		if (mouse.presses() || kb.presses("r")) resume();
		camera.on();
		return;
	}

	if (gameOver) {
		camera.off();
		background(10);
		noStroke();
		fill(255);
		textAlign(CENTER, CENTER);
		textSize(28);
		text("Game Over\nClick or press [R] to restart", width / 2, height / 2);
		player.vel.x = 0;
		if (mouse.presses() || kb.presses("r")) restart();
		camera.on();
		return;
	}

	if (waitingForPlayers) {
		camera.off();
		background("lightblue");
		noStroke();
		fill(0);
		textAlign(CENTER, CENTER);
		textSize(24);
		text(`Waiting for ${2 - poses.length} player(s)...`, width / 2, height / 2);
		player.vel.x = 0;
		camera.on();
		return;
	} else {
		player.vel.x = SPEED;
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
		player.vel.y = JUMP;
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
				MESSAGE.text = `Giraffe ${nextEnergy}`;
				MESSAGE.expiration = expiration;
			} else {
				robotLife += nextEnergy;
				MESSAGE.text = `Robot ${nextEnergy}`;
				MESSAGE.expiration = expiration;
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
					MESSAGE.text = `Giraffe ${nextEnergy}`;
					MESSAGE.expiration = expiration;
				} else {
					robotLife += nextEnergy;
					MESSAGE.text = `Robot ${nextEnergy}`;
					MESSAGE.expiration = expiration;
				}
			}
		}
	}

	displayMessage();
	decreaseLife();

	drawLife();
	drawBodyOverlay();

	drawTresholdIndicator();

	spawnClouds();

	if (giraffeLife <= 0 || robotLife <= 0 || player.y > height - player.h / 2) {
		gameOver = true;
	}
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
			// TREE
			const yT = Math.round(yGroundTop - trees.h * 0.5);
			new trees.Sprite(xCenter, yT);
		} else if (c === "E") {
			// END
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

		if (c !== "H") {
			const y = Math.round(height - grounds.h * 0.5);
			new visualGrounds.Sprite(xCenter, y);
		}
	}
}

// Detect if users are connected to the cameras (2 users)
function bodyReady() {
	GIRAFFE.isActive = false;
	ROBOT.isActive = false;
	GIRAFFE.id = null;
	ROBOT.id = null;

	poses.forEach((p) => {
		const isGiraffe = p.nose.x < SIZE.width / 2;
		if (isGiraffe) {
			GIRAFFE.isActive = true;
			if (!GIRAFFE.id) GIRAFFE.id = p.id;
		} else {
			ROBOT.isActive = true;
			if (!ROBOT.id) ROBOT.id = p.id;
		}
	});

	if (GIRAFFE.isActive && ROBOT.isActive) waitingForPlayers = false;
	else waitingForPlayers = true;
}

function gotPoses(results) {
	poses = results;
}

function decreaseLife() {
	giraffeLife =
		frameCount % 20 === 0
			? giraffeLife - Math.round(random([0, 1]))
			: giraffeLife;
	robotLife =
		frameCount % 20 === 0 ? robotLife - Math.round(random([0, 1])) : robotLife;
}

function drawLife() {
	camera.off(); // HUD fixe à l’écran

	// Girafe life, top left
	fill(0, 0, 0, 100);
	rect(12, 12, 150, 46, 8);
	fill(255);
	noStroke();
	textSize(16);
	textAlign(LEFT, CENTER);
	text(`GIRAFFE: ${giraffeLife}`, 24, 35);

	// Robot life, top right
	fill(0, 0, 0, 100);
	rect(width - 162, 12, 150, 46, 8);
	fill(255);
	noStroke();
	textSize(16);
	textAlign(LEFT, CENTER);
	text(`ROBOT: ${robotLife}`, width - 150, 35);

	camera.on();
}

function resume() {
	fight = false;
	player.vel.x = SPEED;
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
	giraffeLife = LIFE;
	robotLife = LIFE;
}

// Draw treshold indicator
function drawTresholdIndicator() {
	camera.off();
	stroke("red");
	noFill();
	rect(-10, TRESHOLD.jump, 20, 1);
	rect(-10, TRESHOLD.squat, 20, 1);
	rect(width - 10, TRESHOLD.catch, 20, 1);
	camera.on();
}

function drawBodyOverlay() {
	if (poses.length <= 0) return;

	camera.off();

	push();
	translate(width, 0);
	scale(-1, 1);

	// Flags instantanés pour l'analyse
	let allHeadsAboveJump = true; // toutes les têtes < seuil (donc "au-dessus" physiquement)
	let allHeadsBelowOrEqualJump = true; // toutes les têtes >= seuil (redescendues)
	let shouldSquat = true;
	let catchs = [];

	for (let i = 0; i < poses.length; i++) {
		const pose = poses[i];

		const head = pose.keypoints[0];
		const rightHand = pose.keypoints[10];

		// JUMP
		if (!(head.y > 0)) {
			allHeadsAboveJump = false;
			allHeadsBelowOrEqualJump = false;
		} else {
			if (!(head.y < TRESHOLD.jump)) allHeadsAboveJump = false; // au moins une tête n'est pas au-dessus
			if (!(head.y >= TRESHOLD.jump)) allHeadsBelowOrEqualJump = false; // au moins une tête n'est pas redescendue
		}

		// SQUAT
		if (head.y <= TRESHOLD.squat && head.y > 0) {
			shouldSquat = false;
		}

		// CATCH
		const shouldCatch = rightHand.y > 0 && rightHand.y <= TRESHOLD.catch;

		console.log(
			shouldCatch && (pose.id === GIRAFFE.id ? "GIRAFFE Catch" : "ROBOT Catch"),
		);

		catchs.push(shouldCatch);

		// INDICATORS
		noStroke();
		fill(255, 0, 0);
		circle(width, head.y, 20);
		circle(0, rightHand.y, 20);
	}

	pop();
	camera.on();

	// --- Déclenchement "edge" du jump ---
	// On saute UNE FOIS quand toutes les têtes passent au-dessus du seuil ET que c'est armé.
	if (jumpArmed && allHeadsAboveJump && poses.length > 0) {
		jump = true; // évènement instantané : true seulement ce frame
		jumpArmed = false; // se désarme : il faudra redescendre pour réarmer
	} else {
		jump = false; // pas d'évènement ce frame
	}

	// Réarmement : toutes les têtes doivent être repassées sous (>=) le seuil
	if (allHeadsBelowOrEqualJump && poses.length > 0) {
		jumpArmed = true;
	}

	// Le reste de tes états
	squat = shouldSquat && poses.length > 0;
	const shouldCatchAll = catchs.every(Boolean);
	catched = shouldCatchAll && poses.length > 0;

	// Exemple de logique "fight" que tu avais
	shouldFight = shouldCatchAll && poses.length > 1;

	// nettoyage local
	catchs = [];
}

function displayMessage() {
	if (MESSAGE.text === "" || frameCount > MESSAGE.expiration) return;
	camera.off();
	fill(0, 0, 0, 200);
	rect(0, height / 2 - 40, width, 80);
	noStroke();
	fill(255);
	textAlign(CENTER, CENTER);
	textSize(24);
	text(MESSAGE.text, width / 2, height / 2);
	camera.on();
}

function spawnClouds() {
	// Spawn de nuages
	if (frameCount === 10 || frameCount % 180 === 0) {
		const xSpawn = camera.x + width + random(80, 240);
		const yTop = random(height * 0.1, height * 0.4);

		new clouds.Sprite(xSpawn, yTop);
	}

	// Nettoyage des nuages passés derrière la caméra (perf)
	for (const c of clouds) {
		if (c.x + c.w < camera.x - width) c.remove();
	}
}
