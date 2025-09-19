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
	aloneCrouch: null,
	catchGiraffe: null,
	catchRobot: null,
	catch: null,
};

const COLOR = {
	giraffeLife: "#FFDC31",
	robotLife: "#1AD866",
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

const INDICATOR = {
	color: "black",
};

const MESSAGE = {
	text: "",
	expiration: 0,
	color: null,
};

let player,
	grounds,
	obstacles,
	trees,
	clouds,
	playerImage,
	bushes,
	cats,
	leaves;

const LIFE_DECREASE = 1;

let gameOver = false,
	fight = false,
	win = false;

let waitingForPlayers = true,
	tooManyPlayers = false;

let squat = false,
	jump = false,
	catched = false;

let hasSquatted = false;

let shouldFight = false,
	jumpArmed = true;

let lastCatcher = null; // "giraffe" | "robot" | null

let bodyPose,
	poses = [];

let giraffeLife = LIFE,
	robotLife = LIFE;

let catImg, bushesImg1, leafImg, cloudsImg, backgroundImg;

let lifeStrokeImg, heartImg, lifeGiraffeImg, lifeRobotImg;

let minecraftFont;

let catFight, leafFight;

const levelLines = [
	"------T----T---T-----O----H--T--T---O--T--H--T--O---T--T-O---HH---T----O--H--T---O----T---T----H---T--HH--O---T---E",
];

let song,
	collisionSound,
	treeCatSound,
	treeLeafSound,
	jumpSound,
	squatSound,
	fightSound,
	winSound,
	endSound;
let houseImg;

let hasFighted = false;

let shakeIntensity = 0;
let shakeDuration = 0;
const shakeDecay = 0.95;

// biome-ignore lint/correctness/noUnusedVariables: <>
function preload() {
	bodyPose = ml5.bodyPose();
	visualGroundsImg = loadImage("./assets/ground.png");
	treesImg = loadImage("./assets/tree.png");
	cloudsImg = loadImage("./assets/cloud.png");
	houseImg = loadImage("./assets/house.png");
	backgroundImg = loadImage("./assets/background.png");
	birdImg = loadImage("./assets/bird.png");
	GIRAFFE.image = loadImage("./assets/players.png");
	GIRAFFE.crouch = loadImage("./assets/players-crouched.png");
	GIRAFFE.alone = loadImage("./assets/giraffe.png");
	ROBOT.alone = loadImage("./assets/robot.png");
	GIRAFFE.catchGiraffe = loadImage("./assets/giraffe-catch.png");
	GIRAFFE.catchRobot = loadImage("./assets/robot-catch.png");
	GIRAFFE.catch = loadImage("./assets/players-catch.png");
	GIRAFFE.aloneCrouch = loadImage("./assets/giraffe-crouched.png");
	minecraftFont = loadFont("./fonts/minecraft.ttf");
	song = loadSound("./audios/song.mp3");
	collisionSound = loadSound("./audios/collision.wav");

	treeCatSound = loadSound("./audios/tree-cat.wav");
	treeLeafSound = loadSound("./audios/tree-leaf.wav");
	jumpSound = loadSound("./audios/jump.wav");
	fightSound = loadSound("./audios/fight.wav");
	squatSound = loadSound("./audios/squat.wav");
	endSound = loadSound("./audios/end.wav");
	winSound = loadSound("./audios/win.wav");
	bushesImg1 = loadImage("./assets/bushes-1.png");
	catImg = loadImage("./assets/cat.png");
	leafImg = loadImage("./assets/leaf.png");
	heartImg = loadImage("./assets/heart.png");
	lifeStrokeImg = loadImage("./assets/life-stroke.png");
	lifeGiraffeImg = loadImage("./assets/life-giraffe.png");
	lifeRobotImg = loadImage("./assets/life-robot.png");
}

// biome-ignore lint/correctness/noUnusedVariables: <>
function mousePressed() {
	if (win || gameOver) restart();

	if (isLooping() || song.isPlaying()) {
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
	trees.layer = -1; // derrière le player

	// Clouds
	clouds = new Group();
	clouds.collider = "none";
	clouds.w = TILE;
	clouds.h = TILE * 0.5;
	clouds.image = cloudsImg;
	clouds.color = CLOUD.color;
	clouds.stroke = SKY.color;
	clouds.offset.y = -TILE * 1.5; // dans le ciel

	// Bushes
	bushes = new Group();
	bushes.collider = "none";
	bushes.image = bushesImg1;

	// Cats in trees
	cats = new Group();
	cats.collider = "none";
	cats.w = TILE * 0.3;
	cats.h = TILE * 0.3;
	cats.image = catImg;
	cats.layer = 1; // devant les arbres

	// Leaves in trees
	leaves = new Group();
	leaves.collider = "none";
	leaves.w = TILE * 0.2;
	leaves.h = TILE * 0.2;
	leaves.image = leafImg;
	leaves.layer = 1; // devant les arbres

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

function triggerCameraShake(intensity = 10, duration = 30) {
	shakeIntensity = intensity;
	shakeDuration = duration;
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
		textSize(48);
		text(`Click to start/pause game`, width / 2, height / 2);
		camera.on();
		return;
	}

	if (win) {
		camera.off();
		background("gold");
		noStroke();
		fill(0);
		textAlign(CENTER, CENTER);
		textSize(48);
		text("YOU WIN!", width / 2, height / 2);
		player.vel.x = 0;
		noLoop();
		winSound.play();
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
		text("CATCH THE CAT/LEAF!", width / 2, height / 2);
		player.vel.x = 0;
		push();
		translate(width, 0);
		scale(-1, 1);

		playerImage.visible = false;
		visualGrounds.visible = false;
		obstacles.visible = false;
		trees.visible = false;
		clouds.visible = false;
		bushes.visible = false;
		cats.visible = false;
		leaves.visible = false;

		// Squezze camera for fight
		if (!hasFighted) {
			if (!fightSound.isPlaying()) fightSound.play();
			triggerCameraShake(10, 30);

			catFight = {
				ratio: 0.25,
				x: random(0, windowWidth),
				y: random(0, windowHeight),
			};

			leafFight = {
				ratio: 0.25,
				x: random(0, windowWidth),
				y: random(0, windowHeight),
			};

			hasFighted = true;
		}

		// Draw a cat at random positions
		image(
			catImg,
			catFight.x - (catImg.width * catFight.ratio) / 2,
			catFight.y - (catImg.height * catFight.ratio) / 2,
			catImg.width * catFight.ratio,
			catImg.height * catFight.ratio,
		);
		// Draw a leaf at random positions
		image(
			leafImg,
			leafFight.x - (leafImg.width * leafFight.ratio) / 2,
			leafFight.y - (leafImg.height * leafFight.ratio) / 2,
			leafImg.width * leafFight.ratio,
			leafImg.height * leafFight.ratio,
		);

		for (const p of poses) {
			const rightHand = p.keypoints[10];

			const isGiraffe = p.id === GIRAFFE.id;

			// Cursors
			const targetImage = isGiraffe ? GIRAFFE.alone : ROBOT.alone;
			const imageFactor = 0.5;

			image(
				targetImage,
				rightHand.x - (targetImage.width * imageFactor) / 2 - 15,
				rightHand.y - (targetImage.height * imageFactor) / 2,
				targetImage.width * imageFactor,
				targetImage.height * imageFactor,
			);

			const handInCatArea =
				rightHand.x > catFight.x &&
				rightHand.x < catFight.x + catImg.width * catFight.ratio &&
				rightHand.y > catFight.y &&
				rightHand.y < catFight.y + catImg.height * catFight.ratio &&
				!isGiraffe;

			const handInLeafArea =
				rightHand.x > leafFight.x &&
				rightHand.x < leafFight.x + leafImg.width * leafFight.ratio &&
				rightHand.y > leafFight.y &&
				rightHand.y < leafFight.y + leafImg.height * leafFight.ratio &&
				isGiraffe;

			if (handInCatArea || handInLeafArea) {
				const nextEnergy = Math.round(random(5, 10));

				const expiration = frameCount + 60 * 3; // durée d’affichage du message

				if (isGiraffe) {
					giraffeLife += nextEnergy;
					MESSAGE.text = `GIRAFFE +${nextEnergy}`;
					MESSAGE.expiration = expiration;
					MESSAGE.color = COLOR.giraffeLife;
					treeLeafSound.play();
				} else {
					robotLife += nextEnergy;
					MESSAGE.text = `ROBOT ${nextEnergy}`;
					MESSAGE.expiration = expiration;
					MESSAGE.color = COLOR.robotLife;
					treeCatSound.play();
				}

				fight = false;
				hasFighted = false;
			}
		}

		pop();
		camera.on();

		return;
	} else {
		playerImage.visible = true;
		visualGrounds.visible = true;
		obstacles.visible = true;
		trees.visible = true;
		clouds.visible = true;
		bushes.visible = true;
		cats.visible = true;
		leaves.visible = true;
	}

	if (gameOver) {
		camera.off();
		background(10);
		noStroke();
		fill(255);
		textAlign(CENTER, CENTER);
		textSize(48);
		text("Game Over\nClick or press [R] to restart", width / 2, height / 2);
		player.vel.x = 0;
		camera.on();
		noLoop();
		if (!endSound.isPlaying()) endSound.play();
		return;
	}

	if (waitingForPlayers) {
		camera.off();
		noStroke();
		fill(0);
		textAlign(CENTER, CENTER);
		textSize(48);
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
		textSize(48);
		text(`Too many players!`, width / 2, height / 2);
		player.vel.x = 0;
		camera.on();
		return;
	}

	// Caméra suit le joueur

	let shakeX = 0;
	let shakeY = 0;

	if (shakeDuration > 0) {
		shakeX = random(-shakeIntensity, shakeIntensity);
		shakeY = random(-shakeIntensity, shakeIntensity);

		// Diminuer l'intensité et la durée
		shakeIntensity *= shakeDecay;
		shakeDuration--;

		// Arrêter le shake quand l'intensité devient très faible
		if (shakeIntensity < 0.5) {
			shakeDuration = 0;
			shakeIntensity = 0;
		}
	}

	camera.x = player.x + width * 0.25 + shakeX;

	console.log(camera.y, windowHeight / 2);
	camera.y = height / 2 + shakeY;

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
		jumpSound.play();
	}

	if (squat) {
		player.scale.y = 0.5;
		playerImage.image = GIRAFFE.crouch;

		if (!hasSquatted && !squatSound.isPlaying()) squatSound.play();
		hasSquatted = true;
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
		hasSquatted = false;
	}

	// Check collision obstacles
	for (const o of obstacles) {
		if (player.overlaps(o)) {
			const nextEnergy = Math.round(random(-10, -3));
			const dir = Math.round(random([-1, 1]));

			const expiration = frameCount + 60 * 3; // durée d’affichage du message

			triggerCameraShake(15, 20);
			collisionSound.play();

			if (dir < 0) {
				giraffeLife += nextEnergy;
				MESSAGE.text = `GIRAFFE ${nextEnergy}`;
				MESSAGE.expiration = expiration;
				MESSAGE.color = COLOR.giraffeLife;
			} else {
				robotLife += nextEnergy;
				MESSAGE.text = `ROBOT ${nextEnergy}`;
				MESSAGE.expiration = expiration;
				MESSAGE.color = COLOR.robotLife;
			}

			o.remove();
		}
	}

	for (const t of trees) {
		if (player.overlaps(t)) {
			// Fight if two player try to catch a ressources
			if (shouldFight && t.ressources.length === 2) fight = true;
			else if (catched) {
				const nextEnergy = Math.round(random(5, 10));
				const expiration = frameCount + 60 * 3;

				if (lastCatcher === "giraffe" && t.ressources.includes("leaf")) {
					giraffeLife += nextEnergy;
					MESSAGE.text = `GIRAFFE +${nextEnergy}`;
					MESSAGE.expiration = expiration;
					MESSAGE.color = COLOR.giraffeLife;

					const targetLeaf = leaves.find(
						(l) => l.idNum === t.ressourcesId.leaf,
					);
					if (targetLeaf) targetLeaf.remove();

					treeLeafSound.play();
				} else if (lastCatcher === "robot" && t.ressources.includes("cat")) {
					robotLife += nextEnergy;
					MESSAGE.text = `ROBOT +${nextEnergy}`;
					MESSAGE.expiration = expiration;
					MESSAGE.color = COLOR.robotLife;

					const targetCat = cats.find((c) => c.idNum === t.ressourcesId.cat);
					if (targetCat) targetCat.remove();

					treeCatSound.play();
				}
			}
		}
	}

	displayMessage();
	decreaseLife();

	drawLife();
	drawBodyOverlay();

	drawTresholdIndicator();

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
	for (let col = -10; col < line.length; col++) {
		const c = line[col];
		const xCenter = Math.round(col * TILE + TILE * 0.5);
		const yGroundTop = Math.round(height - grounds.h);

		if (c === "O") {
			const yO = Math.round(yGroundTop - obstacles.h * 2);
			new obstacles.Sprite(xCenter, yO - 20);
		} else if (c === "T") {
			// TREE
			const yT = Math.round(yGroundTop - trees.h * 0.5);
			const tree = new trees.Sprite(xCenter, yT);

			tree.ressources = [];
			tree.ressourcesId = {
				cat: null,
				leaf: null,
			};

			// Décider indépendamment pour le chat et les feuilles
			const hasCat = Math.random() < 0.8; // 60% de chance d'avoir un chat
			const hasLeaves = Math.random() < 0.8; // 60% de chance d'avoir des feuilles

			if (hasCat) {
				const cat = new cats.Sprite(
					xCenter + random(-TILE * 0.2, TILE * 0.2), // position légèrement aléatoire
					yT - TILE * 0.8, // position dans la couronne de l'arbre
				);
				cat.scale = 0.3; // taille légèrement variable

				// Variation aléatoire de la position du chat
				if (Math.random() < 0.5) {
					cat.x += TILE * 0.15; // parfois à droite
				} else {
					cat.x -= TILE * 0.15; // parfois à gauche
				}

				tree.ressources.push("cat");
				tree.ressourcesId.cat = cat.idNum;
			}

			if (hasLeaves) {
				// Ajouter plusieurs feuilles pour un effet plus naturel
				const leaf = new leaves.Sprite(
					xCenter + random(-TILE * 0.3, TILE * 0.3),
					yT + random(-TILE * 0.9, -TILE * 0.1),
				);
				leaf.scale = random(0.3, 0.6);
				leaf.rotation = random(-45, 45); // rotation aléatoire

				tree.ressources.push("leaf");
				tree.ressourcesId.leaf = leaf.idNum;
			}
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

			// Add random. bushes
			if (Math.random() < 0.2) {
				const yBush = Math.round(yGroundTop);
				const bush = new bushes.Sprite(
					xCenter + random(-TILE * 0.25, TILE * 0.25),
					yBush,
				);
				bush.image = random([bushesImg1]);
			}
		}

		// Add random clouds
		if (Math.random() < 0.1) {
			const yTop = random(height * 0.1, height * 0.4);
			const scale = random(2, 4);
			const cloud = new clouds.Sprite(xCenter + random(-TILE, TILE), yTop);
			cloud.scale = scale;
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
		frameCount % LIFE_DECREASE === 0
			? giraffeLife - Math.round(random([0, 1]))
			: giraffeLife;
	robotLife =
		frameCount % LIFE_DECREASE === 0
			? robotLife - Math.round(random([0, 1]))
			: robotLife;
}

function drawLife() {
	camera.off(); // HUD fixe à l'écran

	// GIRAFFE
	// Normaliser la vie de la girafe (ne peut pas être négative)
	const normalizedGiraffeLife = Math.max(0, giraffeLife);
	const giraffeLifeRatio = normalizedGiraffeLife / LIFE; // ratio entre 0 et 1
	const fullWidth = lifeGiraffeImg.width * 0.3;
	const croppedWidth = fullWidth * giraffeLifeRatio;

	// Ne créer l'image que si la vie > 0
	if (normalizedGiraffeLife > 0) {
		// Créer une version rognée de l'image de vie
		const croppedLifeImage = createGraphics(
			croppedWidth,
			lifeGiraffeImg.height * 0.3,
		);
		croppedLifeImage.image(
			lifeGiraffeImg,
			0,
			0,
			croppedWidth,
			lifeGiraffeImg.height * 0.3, // destination
			0,
			0,
			lifeGiraffeImg.width * giraffeLifeRatio,
			lifeGiraffeImg.height, // source rognée
		);

		// Afficher l'image rognée
		image(croppedLifeImage, 67 - 16, 19 + 8);
	}

	// Afficher le contour par-dessus (toujours visible)
	image(
		lifeStrokeImg,
		65 - 16,
		17 + 8,
		lifeStrokeImg.width * 0.3,
		lifeStrokeImg.height * 0.3,
	);

	image(heartImg, 20, 20, heartImg.width * 0.3, heartImg.height * 0.3);

	image(
		GIRAFFE.aloneCrouch,
		256,
		16,
		GIRAFFE.aloneCrouch.width * 0.2,
		GIRAFFE.aloneCrouch.height * 0.2,
	);

	// ROBOT
	// Normaliser la vie du robot (ne peut pas être négative)
	const normalizedRobotLife = Math.max(0, robotLife);
	const robotLifeRatio = normalizedRobotLife / LIFE; // ratio entre 0 et 1
	const robotFullWidth = lifeRobotImg.width * 0.3;
	const robotCroppedWidth = robotFullWidth * robotLifeRatio;

	// Ne créer l'image que si la vie > 0
	if (normalizedRobotLife > 0) {
		// Créer une version rognée de l'image de vie du robot
		const croppedRobotLifeImage = createGraphics(
			robotCroppedWidth,
			lifeRobotImg.height * 0.3,
		);

		// MODIFICATION ICI : rogner depuis la droite
		const sourceStartX = lifeRobotImg.width * (1 - robotLifeRatio); // commencer depuis la droite
		croppedRobotLifeImage.image(
			lifeRobotImg,
			0,
			0,
			robotCroppedWidth,
			lifeRobotImg.height * 0.3, // destination
			sourceStartX, // commencer depuis la droite de l'image source
			0,
			lifeRobotImg.width * robotLifeRatio, // largeur à prendre
			lifeRobotImg.height, // source rognée
		);

		// Position de la barre de vie (alignée à droite)
		const robotLifeX =
			width - 20 - heartImg.width * 0.3 - robotCroppedWidth - 10 + 32;

		// Afficher l'image rognée
		image(croppedRobotLifeImage, robotLifeX + 2, 17 + 8 + 2);
	}

	// Afficher le contour par-dessus (toujours visible)
	image(
		lifeStrokeImg,
		width - 20 - heartImg.width * 0.3 - robotFullWidth - 10 + 32, // position fixe du contour
		17 + 8,
		lifeStrokeImg.width * 0.3,
		lifeStrokeImg.height * 0.3,
	);

	image(
		heartImg,
		width - 20 - heartImg.width * 0.3,
		20,
		heartImg.width * 0.3,
		heartImg.height * 0.3,
	);

	// Ajouter l'image de robot
	image(
		ROBOT.alone,
		width - 276,
		23,
		ROBOT.alone.width * 0.2,
		ROBOT.alone.height * 0.2,
	);

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
	MESSAGE.color = null;

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
	fill(MESSAGE.color || "rgba(255, 255, 255, 0)");
	noStroke();
	rect(0, height / 2 - 50, width, 100);
	noStroke();
	fill(0);
	textAlign(CENTER, CENTER);
	textSize(48);
	text(MESSAGE.text, width / 2, height / 2);
	camera.on();
}
