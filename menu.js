let gameStarted = false;
let menuDiv;
let startButton;
let originalSetup;
let originalDraw;
let bgImage;
let playButtonImage;
let contextPage;
let rulesPage;
let gameOverOverlay;
let winOverlay;

function createMenu() {
	// Create menu container using DOM manipulation
	menuDiv = document.createElement("div");
	menuDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-image: url('assets/bg-start.png');
    background-size: auto 100vh;
    background-position: center;
    background-repeat: no-repeat;
    z-index: 1000;
    font-family: 'Arial', sans-serif;
  `;
	document.body.appendChild(menuDiv);

	// Create start button
	startButton = document.createElement("button");
	startButton.style.cssText = `
    position: absolute;
    bottom: 150px;
    left: 50%;
    transform: translateX(-50%);
    background-color: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 0;
  `;
	menuDiv.appendChild(startButton);

	// Create image element
	const buttonImage = document.createElement("img");
	buttonImage.src = "assets/play-button.png";
	buttonImage.style.cssText = `
    width: 200px;
    height: auto;
    display: block;
    transition: all 0.3s ease;
  `;
	startButton.appendChild(buttonImage);

	// Add hover effect
	startButton.addEventListener("mouseenter", () => {
		buttonImage.style.cssText = `
      width: 220px;
      height: auto;
      display: block;
      transition: all 0.3s ease;
      transform: scale(1.1);
    `;
	});

	startButton.addEventListener("mouseleave", () => {
		buttonImage.style.cssText = `
      width: 200px;
      height: auto;
      display: block;
      transition: all 0.3s ease;
      transform: scale(1);
    `;
	});

	// Add click handler
	startButton.addEventListener("click", () => {
		startGame();
	});
}

function startGame() {
	// Hide menu and show context page
	menuDiv.style.display = "none";
	createContextPage();
}

function createContextPage() {
	// Create context page container
	contextPage = document.createElement("div");
	contextPage.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-image: url('assets/bg-start-empty.png');
    background-size: auto 100vh;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    font-family: 'Arial', sans-serif;
  `;
	document.body.appendChild(contextPage);

	// Create text container
	const textContainer = document.createElement("div");
	textContainer.style.cssText = `
    background-image: url('assets/bg-bubble-message-1.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    width: 500px;
    height: 400px;
    text-align: center;
    margin-bottom: 30px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  `;
	contextPage.appendChild(textContainer);

	// Create context text
	const contextText = document.createElement("p");
	contextText.innerHTML = `Humans have lost all their empathy... <br><br>Only cats can bring them back!<br><br>Together, a giraffe and a robot must save the cats stuck in trees and restore hope to the world.`;
	contextText.style.cssText = `
    color: black;
    font-size: 1.2rem;
    line-height: 1.6;
    padding: 0px 40px;
    margin: 0;
    font-family: 'minecraft', monospace;
  `;
	textContainer.appendChild(contextText);

	// Create rules button
	const rulesButton = document.createElement("button");
	rulesButton.style.cssText = `
    background-image: url('assets/rules-button.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    background-color: transparent;
    border: none;
    width: 200px;
    height: 100px;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 0;
  `;
	contextPage.appendChild(rulesButton);

	// Add hover effect for rules button
	rulesButton.addEventListener("mouseenter", () => {
		rulesButton.style.transform = "scale(1.1)";
	});

	rulesButton.addEventListener("mouseleave", () => {
		rulesButton.style.transform = "scale(1)";
	});

	// Add click handler for rules button
	rulesButton.addEventListener("click", () => {
		showRulesPage();
	});
}

function showRulesPage() {
	// Hide context page and show rules page
	contextPage.style.display = "none";

	// Create rules page container
	rulesPage = document.createElement("div");
	rulesPage.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-image: url('assets/bg-start-empty.png');
    background-size: auto 100vh;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    font-family: 'Arial', sans-serif;
  `;
	document.body.appendChild(rulesPage);

	// Create rules container
	const rulesContainer = document.createElement("div");
	rulesContainer.style.cssText = `
    background-image: url('assets/bg-bubble-message-2.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    width: 600px;
    height: 550px;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  `;
	rulesPage.appendChild(rulesContainer);

	// Create rules title
	const rulesTitle = document.createElement("h2");
	rulesTitle.textContent = "HOW TO PLAY";
	rulesTitle.style.cssText = `
    color: black;
    font-size: 2rem;
    margin-bottom: 10px;
    font-family: 'minecraft', monospace;
  `;
	rulesContainer.appendChild(rulesTitle);

	// Create rules text
	const rulesText = document.createElement("div");
	rulesText.style.cssText = `
    color: black;
    font-size: 1.1rem;
    line-height: 1.8;
    text-align: left;
    font-family: 'minecraft', monospace;
  `;

	const rulesList = [
		{ text: "PLAYERS", isTitle: true },
		{ text: "Player on the left: GIRAFFE 🦒", isTitle: false },
		{ text: "Player on the right: ROBOT 🤖", isTitle: false },
		{ text: "OBSTACLES", isTitle: true },
		{ text: "Move your head 👤 UP ↑ to JUMP over obstacles", isTitle: false },
		{ text: "Move your head 👤 DOWN ↓ to SQUAT under dangers", isTitle: false },
		{ text: "ENERGY", isTitle: true },
		{
			text: "Raise your right hand ✋ when passing TREES 🌳 to catch ressources for ENERGY ⚡️",
			isTitle: false,
		},
		{
			text: "Catch the leaves 🍃 to keep the GIRAFFE's energy",
			isTitle: false,
		},
		{ text: "Catch the cats 🐱 to keep the ROBOT's energy", isTitle: false },
	];

	rulesList.forEach((rule) => {
		const ruleItem = document.createElement("p");
		ruleItem.textContent = rule.text;

		if (rule.isTitle) {
			ruleItem.style.cssText = `
        padding: 0px 70px;
        margin: 20px 0 10px 0;
        color: black;
        font-size: 1.4rem;
        font-weight: bold;
        line-height: 1.8;
        font-family: 'minecraft', monospace;
        text-decoration: underline;
      `;
		} else {
			ruleItem.style.cssText = `
        padding: 0px 70px;
        margin: 10px 0;
        color: black;
        font-size: 1.1rem;
        line-height: 1.1;
        font-family: 'minecraft', monospace;
      `;
		}

		rulesText.appendChild(ruleItem);
	});

	rulesContainer.appendChild(rulesText);

	// Create start game button (outside the rules container)
	const startGameButton = document.createElement("button");
	startGameButton.style.cssText = `
    background-image: url('assets/start-game-button.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    background-color: transparent;
    border: none;
    width: 250px;
    height: 100px;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 0;
    margin-top: 30px;
  `;
	rulesPage.appendChild(startGameButton);

	// Add hover effect for start game button
	startGameButton.addEventListener("mouseenter", () => {
		startGameButton.style.transform = "scale(1.1)";
	});

	startGameButton.addEventListener("mouseleave", () => {
		startGameButton.style.transform = "scale(1)";
	});

	// Add click handler for start game button
	startGameButton.addEventListener("click", () => {
		startActualGame();
	});
}

function startActualGame() {
	// Hide rules page
	rulesPage.style.display = "none";

	// Start the game
	gameStarted = true;

	// Call the original setup function to initialize the game
	if (originalSetup) {
		originalSetup();
	}

	// Start the game loop
	loop();
}

function showGameOverOverlay() {
	// Create game over overlay
	gameOverOverlay = document.createElement("div");
	gameOverOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-image: url('assets/background.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    font-family: 'Arial', sans-serif;
  `;
	document.body.appendChild(gameOverOverlay);

	// Create game over container
	const gameOverContainer = document.createElement("div");
	gameOverContainer.style.cssText = `
    background-image: url('assets/bg-bubble-message-3.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    width: 500px;
    height: 300px;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  `;
	gameOverOverlay.appendChild(gameOverContainer);

	// Create game over text
	const gameOverText = document.createElement("p");
	gameOverText.innerHTML = `Game Over :/<br>Click or press [R] to restart`;
	gameOverText.style.cssText = `
    color: black;
    font-size: 2rem;
    line-height: 1.6;
    padding: 0px 10px;
    margin: 0;
    font-family: 'minecraft', monospace;
  `;
	gameOverContainer.appendChild(gameOverText);

	// Add click handler to restart
	gameOverOverlay.addEventListener("click", () => {
		hideGameOverOverlay();
		restartGame();
	});

	// Add keyboard handler for R key
	document.addEventListener("keydown", handleGameOverKeydown);
}

function handleGameOverKeydown(event) {
	if (event.key.toLowerCase() === "r" && gameOverOverlay) {
		hideGameOverOverlay();
		restartGame();
	}
}

function hideGameOverOverlay() {
	if (gameOverOverlay) {
		gameOverOverlay.style.display = "none";
		document.removeEventListener("keydown", handleGameOverKeydown);
	}
}

function restartGame() {
	// Hide game over overlay
	if (gameOverOverlay) {
		gameOverOverlay.remove();
		gameOverOverlay = null;
	}

	// Hide win overlay
	if (winOverlay) {
		winOverlay.remove();
		winOverlay = null;
	}

	// Call the game's restart function
	if (typeof restart === "function") {
		restart();
	}
}

function showWinOverlay() {
	// Create win overlay
	winOverlay = document.createElement("div");
	winOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-image: url('assets/background.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    font-family: 'Arial', sans-serif;
  `;
	document.body.appendChild(winOverlay);

	// Create win container
	const winContainer = document.createElement("div");
	winContainer.style.cssText = `
    background-image: url('assets/bg-bubble-message-2.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    width: 600px;
    height: 550px;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  `;
	winOverlay.appendChild(winContainer);

	// Create win text container
	const winTextContainer = document.createElement("div");
	winTextContainer.style.cssText = `
    text-align: center;
    padding: 0px 10px;
    margin: 0;
  `;
	winContainer.appendChild(winTextContainer);

	// Create YOU WIN text (bigger)
	const youWinText = document.createElement("p");
	youWinText.innerHTML = `YOU WIN!`;
	youWinText.style.cssText = `
    color: black;
    font-size: 3rem;
    line-height: 1.2;
    margin: 0 0 20px 0;
    font-family: 'minecraft', monospace;
    font-weight: bold;
  `;
	winTextContainer.appendChild(youWinText);

	// Create description text (smaller)
	const descriptionText = document.createElement("p");
	descriptionText.innerHTML = `You have presented the cats to humanity and they have started to feel again.`;
	descriptionText.style.cssText = `
    color: black;
    padding: 0px 100px;
    font-size: 2rem;
    line-height: 1.6;
    margin: 0;
    font-family: 'minecraft', monospace;
  `;
	winTextContainer.appendChild(descriptionText);

	// Add click handler to restart
	winOverlay.addEventListener("click", () => {
		hideWinOverlay();
		restartGame();
	});

	// Add keyboard handler for R key
	document.addEventListener("keydown", handleWinKeydown);
}

function handleWinKeydown(event) {
	if (event.key.toLowerCase() === "r" && winOverlay) {
		hideWinOverlay();
		restartGame();
	}
}

function hideWinOverlay() {
	if (winOverlay) {
		winOverlay.style.display = "none";
		document.removeEventListener("keydown", handleWinKeydown);
	}
}

// Store the original functions and override them
originalSetup = window.setup;
originalDraw = window.draw;

// Override the global functions
window.setup = () => {
	createMenu();
	noLoop(); // Don't start the game loop until button is pressed
};

window.draw = () => {
	if (!gameStarted) {
		// Menu is visible, don't draw game
		return;
	}

	// Game is running, call the original draw function from sketch.js
	if (originalDraw) {
		originalDraw();
	}
};
