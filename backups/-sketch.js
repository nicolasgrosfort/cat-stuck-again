let player, grounds, obstacles;
let score = 0;
let gameOver = false;
let started = false;

let handPose;
let video;
let hands = [];


console.log("ml5 version:", ml5.version);


function preload() {
  handPose = ml5.handPose();
}


function setup() {
  new Canvas(windowWidth, windowHeight, "pixelated");
  world.gravity.y = 22;

  // Create the webcam video and hide it
  video = createCapture(VIDEO);
  video.size(windowWidth, windowHeight);
  video.hide();

  // start detecting hands from the webcam video
  handPose.detectStart(video, gotHands);

  // Joueur
  player = new Sprite(120, height - 160, 40, 60);
  player.color = "gold";
  player.rotationLock = true;
  player.friction = 0;
  player.vel.x = 6; // vitesse constante (runner)

  // Sols recyclés (tapis roulant infini)
  grounds = new Group();
  grounds.collider = "static";
  grounds.color = "darkgreen";
  grounds.h = 40;
  grounds.w = 600;

  // 3 segments de sol pour boucler
  const groundY = height - 40 / 2;
  for (let i = 0; i < 3; i++) {
    new grounds.Sprite(i * grounds.w + grounds.w / 2, groundY);
  }

  // Obstacles
  obstacles = new Group();
  obstacles.collider = "static";
  obstacles.w = 34;
  obstacles.h = 48;
  obstacles.color = "tomato";
  obstacles.offset.y = -obstacles.h / 2; // posé sur le sol

  textFont("monospace");

}

function draw() {

  // image(video, 0, 0, width, height);


    // Draw all the tracked hand points
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    for (let j = 0; j < hand.keypoints.length; j++) {
      let keypoint = hand.keypoints[j];
      fill(0, 255, 0);
      noStroke();
      circle(keypoint.x, keypoint.y, 10);
      console.log(keypoint);
    }
  }



  if (gameOver) {
    background(10);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(28);
    text("Game Over\nClick or press [R] to restart", camera.x, camera.y);
    if (mouse.presses() || kb.presses("r")) restart();
    return;
  }

  background("#87CEEB");


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
  if ((mouse.presses() || kb.presses("space") || kb.presses("w") || kb.presses("up")) && onGround) {
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
}





function drawHUD() {
  camera.off(); // HUD fixe à l’écran
  fill(0, 0, 0, 100);
  rect(12, 12, 150, 46, 8);
  fill(255);
  textSize(16);
  textAlign(LEFT, CENTER);
  text("SCORE: " + score, 24, 35);
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

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
} 

function gotHands(results) {
  hands = results;
}