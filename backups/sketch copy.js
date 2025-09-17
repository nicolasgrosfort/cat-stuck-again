let player, grounds, obstacles;
const score = 0;
const gameOver = false;
const started = false;

let handPose;
let video;
let hands = [];

const size = {
	width: 400,
	height: 300,
};

console.log("ml5 version:", ml5.version);

// biome-ignore lint/correctness/noUnusedVariables: <>
function preload() {
	handPose = ml5.handPose();
}

// biome-ignore lint/correctness/noUnusedVariables: <>
function setup() {
	new Canvas(size.width, size.height);

	// Create the webcam video and hide it
	video = createCapture(VIDEO);

	video.size(size.width, size.height);
	video.hide();

	handPose.detectStart(video, gotHands);
}

// biome-ignore lint/correctness/noUnusedVariables: <>
function draw() {
	background(40);

	push();
	translate(width, 0);
	scale(-1, 1);

	for (let i = 0; i < hands.length; i++) {
		const hand = hands[i];

		const base = hand.keypoints[0];
		const thumb = hand.keypoints[4];
		const index = hand.keypoints[8];

		const points = [base, thumb, index];

		noStroke();
		fill(255);

		for (let j = 0; j < points.length; j++) {
			const p = points[j];
			console.log(p.y < 100);
			circle(p.x, p.y, 8);
		}
	}
	pop();
}

function gotHands(results) {
	hands = results;
}
