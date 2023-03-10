import {
    blocks
} from "./board.js";
import {
    ghosts,
    updateScore,
    checkGameOver,
    checkForWin,
    gameState,
    eatFood,
    powerFood,
    eatGhost
} from "./index.js";
import { Timer } from "./timer.js";
export let currentIndex = 490;
const width = 28 //28 X 28 = 784 squares
export let direction = 1 ;
//function that moves pac-man
export const movePacMan = (e) => {
    // // blocks[currentIndex].classList.add('pac-man');
    blocks[currentIndex].classList.remove("pac-man", 'pac-man-left', 'pac-man-up', 'pac-man-down');
    //this switch case is used to help move pacman within the walls of the grid 
    //and when key is pressed
    switch (e.keyCode) {
        case 65: //left key
            if (
                currentIndex % width !== 0 &&
                !blocks[currentIndex - 1].classList.contains("wall")
            )
                currentIndex -= 1;
            //check if pacman is in the left exit.
            if ((currentIndex - 1) === 363) {
                currentIndex = 391;
            }
            blocks[currentIndex].classList.add('pac-man-left');
            direction = -1;
            break;
        case 87: // up key 
            if (
                currentIndex - width >= 0 &&
                !blocks[currentIndex - width].classList.contains("wall")
            )
                currentIndex -= width;
            blocks[currentIndex].classList.add('pac-man-up');
            direction = -width;
            break;
        case 68: // right key
            if (
                currentIndex % width < width - 1 &&
                !blocks[currentIndex + 1].classList.contains("wall")
            )
                currentIndex += 1;

            //check if pacman is in the left exit.
            if ((currentIndex + 1) === 392) {
                currentIndex = 364
            }
            direction = 1;
            break;
        case 83: // down key 
            if (
                currentIndex + width < width * width &&
                !blocks[currentIndex + width].classList.contains("wall")
            )
                currentIndex += width;
            blocks[currentIndex].classList.add('pac-man-down');
            direction = width;
            break;
    }
    blocks[currentIndex].classList.add('pac-man');
    pacDotEaten();
    powerPelletEaten();
}

export let pacDots = 234;

const pacDotEaten = () => {
    //Here we say if the index where pac-man is contains a pac-dot then it will removed.
    //the each dot remove will increment score by 1.
    if (blocks[currentIndex].classList.contains('pac-dot')) {
        eatFood.play();
        updateScore(1);
        pacDots--;
        blocks[currentIndex].classList.remove('pac-dot');
    }
}


//this function will decide what happens when the power-pellets are eaten by pacman.
export const powerPelletEaten = () => {
    if (blocks[currentIndex].classList.contains('power-pellet')) {
        powerFood.play();
        updateScore(10);
        blocks[currentIndex].classList.remove('power-pellet');
         //set 10 secs of scaredstate for the ghosts, enables them eatable by pacman
         eatGhost.play();
        startScaredTimer();
   
    }
}

export const updateIndex = (index) => {
    currentIndex = index;
}



/*********************************************************************timer part**************************************************************** */ 


const setChaseMode = () => {
    ghosts.forEach(ghost => ghost.mode = 'chase');
}
export let scatterTimer = new Timer(setChaseMode, 5000);
export let scaredTimer = new Timer(setChaseMode, 10000);

export const setGhostsScatter = () => {
    if (ghosts[0].mode !== 'scared'&& scaredTimer.timerId) {
        scaredTimer.stop(); 
    }
    ghosts.forEach(ghost => ghost.mode = 'scatter');
    scatterTimer.start();
    while (gameState.pause) {
        scatterTimer.pause();
    }
    scatterTimer.resume();
    
}

export const pauseGhostsScatter = () => {
    if (scatterTimer.timerId && scatterTimer.getRemainingTime > 0) {
        scatterTimer.pause();
    }
}

export const resumeGhostsScatter = () => {
    if (scatterTimer.remainingTime > 0) {
        scatterTimer.resume();
    }
}

const startScaredTimer = () => {
    if (ghosts[0].mode === 'scatter') {
        scatterTimer.stop();
    }
    scaredTimer.start();
    ghosts.forEach(ghost => {
        ghost.mode = 'scared';
        ghost.checkCollision();
        ghost.checkMode();
    });
    while (gameState.pause) {
        scaredTimer.pause();
    }
    scaredTimer.resume();
}

export const pauseScaredGhosts = () => {
    if (scaredTimer.timerId) {
        scaredTimer.pause();
    }
}
export const resumeScaredGhosts = () => {
    if (scaredTimer.remainingTime > 0) {
        scaredTimer.resume();
    }
}
