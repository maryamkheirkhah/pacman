import {
    Ghost,
    Blinky,
    Pinky,
    Inky,
    Clyde
} from "./ghosts.js";
import {
    createBoard,
    blocks
} from "./board.js";
import * as pacman from './pacman.js';
//game state variables
export let gameState = {
    pause: false,
    start: true,
    scatter: true,
    endGame: false,
    playing: false,
};

let aniID = 0
let delay = 0
let scatterDelay = 0

let pacmanStartIndex = 490;

//variable to store the score
export let score = 0;

export let scoreDisplay = document.getElementById('score');

export function updateScore(add) {
    score += add;
    scoreDisplay.innerHTML = score;
}

//variable to store the lives
let lives = 3;
const livesDisplay = document.getElementById('lives')

//variable to store display message to the player
let displayMessage = document.getElementById('displayMessage')

//setting up clock function
let displaySecs = document.getElementById('secs')
let displayMins = document.getElementById('mins')

//variables for the audio files
let startSound = new Audio('../assets/sounds/start.wav');
export let eatFood = new Audio('../assets/sounds/food.wav')
export let eatGhost = new Audio('../assets/sounds/eatghost.wav')
export let powerFood = new Audio('../assets/sounds/powerFood.wav')
let deathOfPacMan = new Audio('../assets/sounds/death.wav')
let win = new Audio('../assets/sounds/extrapac.wav')
export let scaredGhost = new Audio('../assets/sounds/intermission.wav')


export let ghosts = [
    new Blinky('blinky', 348, 1000), // we specified 1st name, 2nd startIndex, third speed
    new Pinky('pinky', 376, 200),
    new Inky('inky', 351, 300),
    new Clyde('clyde', 379, 500)
]

export let Clock = {
    totalSeconds: 120,
    start: function () {
        if (!this.interval) {
            let self = this;

            function pad(val) {
                return val > 9 ? val : "0" + val;
            }
            this.interval = setInterval(function () {
                self.totalSeconds -= 1;
                displayMins.innerHTML = pad(Math.floor(self.totalSeconds / 60 % 60));
                displaySecs.innerHTML = pad(parseInt(self.totalSeconds % 60));
            }, 1000);
        }
    },

    restart: function () {
        Clock.totalSeconds = 120;
        clearInterval(this.interval);
        displayMins.innerHTML = "02";
        displaySecs.innerHTML = "00";
        delete this.interval;
        this.restart();
    },
    pause: function () {
        clearInterval(this.interval);
        delete this.interval;
    },

    continue: function () {
        this.start();
    },
};

//check for gameOver
export const checkGameOver = () => {
    //game-over when time is 2 mins up 
    if (Clock.totalSeconds === 0) {
        deathOfPacMan.play();
        // ghosts.forEach(ghost => clearInterval(ghost.timerId))
        cancelAnimationFrame(aniID);
        document.removeEventListener('keydown', pacman.movePacMan);
        displayMessage.innerHTML = "GAME OVER";
        Clock.pause();
        gameState.endGame = true;
        gameState.playing = false;
    }

    if (lives === 3 || lives === 2 || lives === 1) {
        //if pacman is in the same block as the ghost that are not scared then pacman will die.
        if (blocks[pacman.currentIndex].classList.contains('ghost') &&
            !blocks[pacman.currentIndex].classList.contains('ghost-eyes') && !blocks[pacman.currentIndex].classList.contains('scared-ghost') && !blocks[pacman.currentIndex].classList.contains('power-pellet')) {
            lives--;
            livesDisplay.innerHTML = lives;
            gameState.scatter = true;
            scatterDelay = 0;
            ghosts.forEach(ghost => {
                ghost.reset()
            });
            blocks[pacman.currentIndex].classList.remove('pac-man', 'pac-man-left', 'pac-man-up', 'pac-man-down');
            deathOfPacMan.play();
            pacman.updateIndex(pacmanStartIndex);
            blocks[pacman.currentIndex].classList.add('pac-man');
        }
    } else if (lives === 0) {
        deathOfPacMan.play();
        // ghosts.forEach(ghost => clearInterval(ghost.timerId))
        //cancelAnimationFrame(aniID)
        document.removeEventListener('keydown', pacman.movePacMan);
        displayMessage.innerHTML = "GAME OVER";
        Clock.pause();
        cancelAnimationFrame(aniID);
        gameState.endGame = true;
        gameState.playing = false;
    }
}

//check for win
export const checkForWin = () => {
    if (pacman.pacDots == 0) {
        win.play();
        // ghosts.forEach(ghost => clearInterval(ghost.timerId))
        cancelAnimationFrame(aniID);
        document.removeEventListener('keydown', pacman.movePacMan);

        displayMessage.innerHTML = "YOU WON";
        Clock.pause();
        gameState.playing = false;
    }
}

/* const checkCollision = () => {
    // check the collision between pacman and the ghosts
    ghosts.forEach(ghost => {
        if (pacman.currentIndex === ghost.currentIndex) {
        }
    })
} */
createBoard();

const start = () => {
    document.addEventListener('keydown', pacman.movePacMan);
    console.log("start")
    blocks[pacman.currentIndex].classList.add('pac-man');
    ghosts.forEach(ghost => {
        blocks[ghost.currentIndex].classList.add(ghost.className);
        blocks[ghost.currentIndex].classList.add('ghost');
    });
}


//function defining steps for game execution during gameplay, it controls the flow of the game. 
//Each cycle through the gameloop is known as a frame. If a game runs at 60FPS, 
//this means that the program cycles through the gameloop 60 times per second.
const gameLoop = () => {
    //console.log("gameLoop")

    if (delay >= 10) {
        if (!gameState.pause) {
            if (scatterDelay >= 500 && ghosts[0].mode !== "scared") {
                gameState.scatter = true;
                scatterDelay = 0;
            }
            if (gameState.scatter && ghosts[0].mode !== "scared") {
                gameState.scatter = false;
                pacman.setGhostsScatter();
            }

            ghosts.forEach(ghost => ghost.checkMode());

        } else {
            pauseState();
        }
        delay = 0;
    }
    delay++;
    if (ghosts[0].mode !== "scared") {
        scatterDelay++;
    }
    aniID = requestAnimationFrame(gameLoop);
    checkGameOver();
    checkForWin();
}
//requestAnimationFrame(gameLoop)


//stating the boolean conditions for pauseState
const pauseState = () => {
    if (gameState.pause) {
        gameState.playing = false;
        cancelAnimationFrame(aniID);
    }
}

//function controlling the keyevents for start, pause, continue, & restatrt
const control = (e) => {
    if (e.key === "p" || e.key === "P") {
        if (gameState.playing) {
            gameState.pause = true;
            gameState.playing = false;
            pacman.pauseGhostsScatter();
            pacman.pauseScaredGhosts();
            Clock.pause();
            cancelAnimationFrame(aniID);
            // ghosts.forEach(ghost => clearInterval(ghost.timerId))
            document.removeEventListener('keydown', pacman.movePacMan);
            checkGameOver();
            checkForWin();
            displayMessage.innerHTML = "Game Paused";
        }
    } else if (e.key === 'c' || e.key === 'C') {
        if (gameState.pause) {
            gameState.playing = true;
            gameState.pause = false;
            //playing = true;
            gameState.pause = false;
            document.addEventListener('keydown', pacman.movePacMan);
            pacman.resumeGhostsScatter();
            pacman.resumeScaredGhosts();
            Clock.continue();
            gameLoop();
            // requestAnimationFrame(gameLoop)
            displayMessage.innerHTML = " ";
        }
    } else if (e.key === 'r' || e.key === 'R') {
        location.reload();
    } else if (e.key === 'Enter') {
        if (!gameState.playing && !gameState.endGame && !gameState.pause) {
            gameState.playing = true;
            gameLoop();
            // requestAnimationFrame(gameLoop)
            if (gameState.start) {
                Clock.start();
                startSound.play();
                start();
                gameState.start = false;
            }
        } else if (gameState.endGame) {
            location.reload();
        }
    }
}

document.addEventListener("keydown", function (e) {
    control(e);
});



/*
something like this :

const timeStep = 1.0 / 60.0;

let previousTime = 0.0;
let delta = 0.0;

const loop = time => {
  // Compute the delta-time against the previous time
  const dt = time - previousTime;

  // Accumulate delta time
  delta = delta + dt;

  // Update the previous time
  previousTime = time;

  // Update your game
  while (delta > timeStep) {
    update(timeStep);

    delta = delta - timeStep;
  }

  // Render your game
  render();

  // Repeat
  window.requestAnimationFrame(loop);
};

// Launch
window.requestAnimationFrame(time => {
  previousTime = time;

  window.requestAnimationFrame(loop);
});

*/