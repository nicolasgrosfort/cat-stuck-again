const TILE = 100;
const SPEED = 5;
const JUMP = -15;
const LIFE = 100;
const GRAVITY = 30;

const TRESHOLD = {
	jump: null,
	catch: null,
	squat: null,
};

const PLAYER = {
	color: "black",
};

const GIRAFFE = {
	id: null,
	isActive: false,
	color: "orange",
	alone: null,
	image: null,
	crouch: null,
	catchGiraffe: null,
	catchRobot: null,
	catch: null,
};

const ROBOT = {
	id: null,
	isActive: false,
	color: "purple",
	alone: null,
};

const SKY = {
	color: "lightblue",
};

const CLOUD = {
	color: "white",
};

const GROUND = {
	color: "brown",
};

const TREE = {
	color: "green",
};

const END = {
	color: "grey",
};

const INDICATOR = {
	color: "black",
};

const MESSAGE = {
	text: "",
	expiration: 0,
};

let player, grounds, obstacles, trees, clouds, playerImage;

let gameOver = false,
	fight = false,
	win = false;

let waitingForPlayers = true,
	tooManyPlayers = false;

let squat = false,
	jump = false,
	catched = false;

let shouldFight = false,
	jumpArmed = true;

let lastCatcher = null; // "giraffe" | "robot" | null

let bodyPose,
	poses = [];

let giraffeLife = LIFE,
	robotLife = LIFE;

let minecraftFont;

const levelLines = [
	"-------T-------T-----O----H--T--T---O--T--H--T--O---T--T-O---HH---T----O--H--T---O----T---T----H-----HH--O---T---E",
];

let song;
let houseImg;

// biome-ignore lint/correctness/noUnusedVariables: <>
function preload() {
	bodyPose = ml5.bodyPose();
	visualGroundsImg = loadImage("assets/ground.png");
	treesImg = loadImage("assets/tree.png");
	cloudsImg = loadImage("assets/cloud.png");
	houseImg = loadImage("assets/house.png");
	backgroundImg = loadImage("assets/background.png");
	birdImg = loadImage("assets/bird.png");
	GIRAFFE.image = loadImage("assets/players.png");
	GIRAFFE.crouch = loadImage("assets/players-crouched.png");
	GIRAFFE.alone = loadImage("assets/giraffe.png");
	ROBOT.alone = loadImage("assets/robot.png");
	GIRAFFE.catchGiraffe = loadImage("assets/giraffe-catch.png");
	GIRAFFE.catchRobot = loadImage("assets/robot-catch.png");
	GIRAFFE.catch = loadImage("assets/players-catch.png");
	minecraftFont = loadFont("fonts/minecraft.ttf");
	song = loadSound("/audios/song.mp3");
}

// biome-ignore lint/correctness/noUnusedVariables: <>
function mousePressed() {
	if (isLooping()) {
		song.pause();
		noLoop();
	} else {
		song.play();
		loop();
	}
}

// biome-ignore lint/correctness/noUnusedVariables: <>
function setup() {
	new Canvas(windowWidth, windowHeight);
	noSmooth();
	noLoop();
	textFont(minecraftFont);

	TRESHOLD.jump = windowHeight * 0.4;
	TRESHOLD.catch = windowHeight * 0.5;
	TRESHOLD.squat = windowHeight * 0.6;

	video = createCapture(VIDEO);
	video.size(windowWidth, windowHeight);
	video.hide();
	bodyPose.detectStart(video, gotPoses);

	// World
	world.gravity.y = GRAVITY;

	// Player
	player = new Sprite(TILE, height - TILE * 2, TILE * 0.5, TILE);
	player.color = PLAYER.color;
	player.stroke = SKY.color;
	player.rotationLock = true;
	player.friction = 0;
	player.bounciness = 0;
	player.vel.x = SPEED;
	player.visible = false; // on ne voit pas le player d’origine, seulement playerImage

	// Player Image
	playerImage = new Sprite(TILE, height - TILE * 2, TILE * 0.5, TILE);
	playerImage.image = GIRAFFE.image;
	playerImage.rotationLock = true;
	playerImage.friction = 0;
	playerImage.bounciness = 0;
	playerImage.collider = "none";
	playerImage.layer = 10;

	// Grounds
	grounds = new Group();
	grounds.collider = "static";
	grounds.color = GROUND.color;
	grounds.stroke = SKY.color;
	grounds.h = TILE * 0.5;
	grounds.w = TILE;
	grounds.bounciness = 0;
	grounds.layer = -1; // derrière le player
	grounds.visible = false; // on ne voit pas les sols d’origine, seulement visualGrounds

	visualGrounds = new Group();
	visualGrounds.collider = "none";
	visualGrounds.h = TILE * 0.5;
	visualGrounds.w = TILE;
	visualGroundsImg.resize(visualGrounds.w * 2, visualGrounds.h * 2); // resize to group size
	visualGrounds.image = visualGroundsImg;
	visualGrounds.bounciness = 0;
	visualGrounds.layer = -1; // derrière le player

	// Obstacles
	obstacles = new Group();
	obstacles.collider = "none";
	obstacles.w = TILE * 0.5;
	obstacles.h = TILE * 0.5;
	birdImg.resize(obstacles.w * 2, obstacles.h * 2);
	obstacles.image = birdImg;
	obstacles.offset.y = -obstacles.h / 2;

	// Trees
	trees = new Group();
	trees.collider = "none";
	trees.w = TILE * 0.5;
	trees.h = TILE * 2;
	trees.image = treesImg;
	trees.color = TREE.color;
	trees.stroke = SKY.color;
	trees.offset.y = 0; // posé sur le sol

	// Clouds
	clouds = new Group();
	clouds.collider = "none";
	clouds.w = TILE;
	clouds.h = TILE * 0.5;
	clouds.image = cloudsImg;
	clouds.color = CLOUD.color;
	clouds.stroke = SKY.color;
	clouds.offset.y = -TILE * 1.5; // dans le ciel

	buildLevel();
}

function handleRestart() {
	if (kb.presses("r")) restart();
}

// biome-ignore lint/correctness/noUnusedVariables: <>
function keyPressed() {
	if (key === "r") {
		loop();
		restart();
	}
}

// biome-ignore lint/correctness/noUnusedVariables: <>
function draw() {
	background(backgroundImg);
	bodyReady();
	checkIfTooManyPlayers();
	handleRestart();

	if (!isLooping()) {
		camera.off();
		noStroke();
		fill(0);
		textAlign(CENTER, CENTER);
		textSize(28);
		text(`Click to start/pause game`, width / 2, height / 2);
		camera.on();
		return;
	}

	if (win) {
		camera.off();
		background("lightgreen");
		noStroke();
		fill(0);
		textAlign(CENTER, CENTER);
		textSize(48);
		text("YOU WIN!", width / 2, height / 2);
		player.vel.x = 0;
		camera.on();
		return;
	}

	if (fight) {
		camera.off();
		background("lightcoral");
		noStroke();
		fill(255);
		textAlign(CENTER, CENTER);
		textSize(48);
		text("HERE!", width / 2, height / 2);
		player.vel.x = 0;
		push();
		translate(width, 0);
		scale(-1, 1);

		for (const p of poses) {
			const leftHand = p.keypoints[9];

			const isGiraffe = p.id === GIRAFFE.id;

			// INDICATORS
			const targetImage = isGiraffe ? GIRAFFE.alone : ROBOT.alone;
			const imageFactor = 0.15;

			image(
				targetImage,
				leftHand.x - (targetImage.width * imageFactor) / 2 - 15,
				leftHand.y - (targetImage.height * imageFactor) / 2,
				targetImage.width * imageFactor,
				targetImage.height * imageFactor,
			);

			// Detect if hand is inside a random area
			const handInArea =
				leftHand.x > width / 2 - 100 &&
				leftHand.x < width / 2 + 100 &&
				leftHand.y > height / 2 - 50 &&
				leftHand.y < height / 2 + 50;

			// draw area
			noFill();
			stroke(255);
			strokeWeight(2);
			rect(width / 2 - 100, height / 2 - 50, 200, 100);

			if (handInArea) {
				const nextEnergy = Math.round(random(3, 10));

				const expiration = frameCount + 60 * 3; // durée d’affichage du message

				if (isGiraffe) {
					giraffeLife += nextEnergy;
					MESSAGE.text = `Giraffe ${nextEnergy}`;
					MESSAGE.expiration = expiration;
				} else {
					robotLife += nextEnergy;
					MESSAGE.text = `Robot ${nextEnergy}`;
					MESSAGE.expiration = expiration;
				}

				fight = false;
			}
		}

		pop();
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

		camera.on();

		noLoop();
		return;
	}

	if (waitingForPlayers) {
		camera.off();
		noStroke();
		fill(0);
		textAlign(CENTER, CENTER);
		textSize(28);
		text(`Waiting for ${2 - poses.length} player(s)...`, width / 2, height / 2);
		player.vel.x = 0;
		camera.on();
		return;
	} else {
		penalityApplied = false;
		player.vel.x = SPEED;
	}

	if (tooManyPlayers) {
		camera.off();
		noStroke();
		fill(0);
		textAlign(CENTER, CENTER);
		textSize(28);
		text(`Too many players!`, width / 2, height / 2);
		player.vel.x = 0;
		camera.on();
		return;
	}

	// Caméra suit le joueur
	camera.x = player.x + width * 0.25;
	gameHasStarted = true;

	// Saut (seulement si on touche le sol)
	const onGround = player.colliding(grounds);

	if (kb.pressing("c")) catched = true;
	if (kb.pressing("s") || kb.pressing("down")) squat = true;
	if (kb.presses("space") || kb.presses("w") || kb.presses("up")) jump = true;

	if (jump && onGround) {
		player.vel.y = JUMP;
		player.rotation = 0;
		player.vel.x = SPEED;
	}

	if (squat) {
		player.scale.y = 0.5;
		playerImage.image = GIRAFFE.crouch;
	}

	if (catched) {
		player.scale.x = 0.5;
		player.scale.y = 1.5;

		if (shouldFight) playerImage.image = GIRAFFE.catch;
		else if (lastCatcher === "giraffe")
			playerImage.image = GIRAFFE.catchGiraffe;
		else if (lastCatcher === "robot") playerImage.image = GIRAFFE.catchRobot;
	} else {
		player.scale.x = 1;
	}

	if (!squat && !catched) {
		player.scale.y = 1;
		playerImage.image = GIRAFFE.image;
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
				const expiration = frameCount + 60 * 3;

				if (lastCatcher === "giraffe") {
					giraffeLife += nextEnergy;
					MESSAGE.text = `Giraffe +${nextEnergy}`;
					MESSAGE.expiration = expiration;
				} else if (lastCatcher === "robot") {
					robotLife += nextEnergy;
					MESSAGE.text = `Robot +${nextEnergy}`;
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

	playerImage.pos.x = player.pos.x;
	playerImage.pos.y = player.pos.y - 20;

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
			new obstacles.Sprite(xCenter, yO - 20);
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
			end.visible = false;
			end.rotationLock = true;
			end.friction = 0;
			end.bounciness = 0;
			end.overlaps(player, () => {
				win = true;
			});

			const endImage = new Sprite();
			endImage.collider = "none";
			endImage.image = houseImg;
			endImage.pos.x = end.pos.x;
			endImage.pos.y = end.pos.y;
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
		const isGiraffe = p.nose.x > windowWidth / 2;
		if (isGiraffe) {
			GIRAFFE.isActive = true;
			if (!GIRAFFE.id) GIRAFFE.id = p.id;
		} else {
			ROBOT.isActive = true;
			if (!ROBOT.id) ROBOT.id = p.id;
		}
	});

	if (GIRAFFE.isActive || ROBOT.isActive) waitingForPlayers = false;
	else waitingForPlayers = true;
}

// Detect if there are more than 2 players
function checkIfTooManyPlayers() {
	if (poses.length > 2) {
		tooManyPlayers = true;
	} else {
		tooManyPlayers = false;
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

function drawLife() {
	camera.off(); // HUD fixe à l’écran

	// GIRAFFE
	noFill();
	stroke(GIRAFFE.color);
	strokeWeight(2);
	rect(12, 12, 150, 46);

	noFill();
	stroke(GIRAFFE.color);
	rect(12, 12, 150, 46);
	fill(GIRAFFE.color);
	noStroke();
	const giraffeLifeWidth = map(giraffeLife, 0, LIFE, 0, 150);
	rect(12, 12, giraffeLifeWidth, 46);

	fill(255);
	noStroke();
	textSize(20);
	textAlign(LEFT, CENTER);
	text(`GIRAFFE`, 24, 35);

	// ROBOT
	noFill();
	stroke(GIRAFFE.color);
	strokeWeight(2);
	rect(width - 162, 12, 150, 46);

	noFill();
	stroke(ROBOT.color);
	rect(width - 162, 12, 150, 46);
	fill(ROBOT.color);
	noStroke();
	const robotLifeWidth = map(robotLife, 0, LIFE, 0, 150);
	rect(width - 162, 12, robotLifeWidth, 46);

	fill(255);
	noStroke();
	textSize(20);
	textAlign(LEFT, CENTER);
	text(`ROBOT`, width - 150, 35);

	camera.on();
}

function restart() {
	// Reset joueur
	player.pos.x = TILE;
	player.pos.y = height - TILE * 2;
	player.vel.x = SPEED;
	player.vel.y = 0;
	player.rotation = 0;

	camera.x = player.x + width * 0.25;

	MESSAGE.text = "";
	MESSAGE.expiration = 0;

	// Reset settings
	score = 0;
	gameOver = false;
	win = false;
	fight = false;
	giraffeLife = LIFE;
	robotLife = LIFE;

	song.stop();
	song.play();
	loop();
}

// Draw treshold indicator
function drawTresholdIndicator() {
	camera.off();
	stroke(INDICATOR.color);
	noFill();
	rect(-10, TRESHOLD.jump, 30, 1);
	rect(-10, TRESHOLD.squat, 30, 1);
	rect(width - 20, TRESHOLD.catch, 30, 1);
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

		catchs.push(shouldCatch);

		const isGiraffe = pose.id === GIRAFFE.id;

		// INDICATORS
		const targetImage = isGiraffe ? GIRAFFE.alone : ROBOT.alone;
		const imageFactor = 0.15;

		image(
			targetImage,
			width - (targetImage.width * imageFactor) / 2 - 15,
			head.y - (targetImage.height * imageFactor) / 2,
			targetImage.width * imageFactor,
			targetImage.height * imageFactor,
		);
		image(
			targetImage,
			(targetImage.width * imageFactor) / 2,
			rightHand.y - (targetImage.height * imageFactor) / 2,
			targetImage.width * imageFactor,
			targetImage.height * imageFactor,
		);
	}

	pop();
	camera.on();

	// --- Déclenchement "edge" du jump ---
	if (jumpArmed && allHeadsAboveJump && poses.length > 0) {
		jump = true;
		jumpArmed = false;
	} else {
		jump = false;
	}

	if (allHeadsBelowOrEqualJump && poses.length > 0) {
		jumpArmed = true;
	}

	// Le reste de tes états
	squat = shouldSquat && poses.length > 0;

	// On détermine quel·le joueur·se a catché
	// On reconstruit giraffeCatch / robotCatch depuis les poses lues
	let giraffeCatch = false;
	let robotCatch = false;

	for (let i = 0; i < poses.length; i++) {
		const pose = poses[i];
		const rightHand = pose.keypoints[10];
		const isCatching = rightHand.y > 0 && rightHand.y <= TRESHOLD.catch;

		// On mappe grâce aux IDs détectés dans bodyReady()
		if (pose.id === GIRAFFE.id) {
			giraffeCatch = giraffeCatch || isCatching;
		} else if (pose.id === ROBOT.id) {
			robotCatch = robotCatch || isCatching;
		} else {
			// Si jamais un ID n'était pas encore fixé, fallback gauche/droite (optionnel)
			const isGiraffeSide = pose.nose?.x < windowWidth / 2;
			if (isGiraffeSide) giraffeCatch = giraffeCatch || isCatching;
			else robotCatch = robotCatch || isCatching;
		}
	}

	// État global : au moins un catch ?
	catched =
		(giraffeCatch || robotCatch) &&
		poses.length > 0 &&
		!squat &&
		!allHeadsAboveJump;

	// Qui a catché ?
	if (giraffeCatch && !robotCatch) lastCatcher = "giraffe";
	else if (robotCatch && !giraffeCatch) lastCatcher = "robot";
	else lastCatcher = null; // les deux ou aucun

	// Fight si les deux catchent en même temps (tu l’avais déjà)
	shouldFight = giraffeCatch && robotCatch && poses.length > 1;

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
