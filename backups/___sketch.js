let video;
let poseNet;
let poses = [];

// check ml5js is installed and print its version
console.log("ml5 version:", ml5.version);

function setup() {
  createCanvas(640, 480);

  // capture the webcam and store it in 'video'
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  // detect poses with posenet
  poseNet = ml5.poseNet(video, modelReady);
  // every time new poses are detected store them in 'poses'
  poseNet.on("pose", function (results) {
    console.log(results);
    poses = results;
  });
}

function modelReady() {
  console.log("model ready");
}

function draw() {
  background(220);
  image(video, 0, 0, width, height);

  // check we have at least one pose
  // i.e. one person detected
  if (poses.length > 0) {
    let nose = poses[0].pose.nose;
    fill(255, 0, 0);
    circle(nose.x, nose.y, 50);
  }
}
