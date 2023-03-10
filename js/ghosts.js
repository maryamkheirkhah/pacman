import {
  checkGameOver,
  updateScore
} from './index.js'
import {
  blocks
} from './board.js'
import * as pacman from './pacman.js'
let width = 28;
let height = 28;
//creating our ghost template
function getNeighbors(currentIndex) {
  const neighbors = [];
  const numNodes = blocks.length;
  const numRows = Math.sqrt(numNodes);

  const row = Math.floor(currentIndex / numRows);
  const col = currentIndex % numRows;

  // Check neighbors in Manhattan distance of 1
  const offsets = [-1, 0, 1];
  for (let i = 0; i < offsets.length; i++) {
    for (let j = 0; j < offsets.length; j++) {
      if (Math.abs(offsets[i]) === Math.abs(offsets[j])) {
        continue; // skip diagonals
      }
      const newRow = row + offsets[i];
      const newCol = col + offsets[j];
      if (newRow < 0 || newRow >= numRows || newCol < 0 || newCol >= numRows) {
        continue; // skip out-of-bounds cells
      }
      const index = newRow * numRows + newCol;
      if (!blocks[index].classList.contains('wall') && !blocks[index].classList.contains('ghost')) {
        neighbors.push(index);
      }
    }
  }
  return neighbors;
}
//here with our class we can create our ghosts for the game
export class Ghost {
  constructor(className, startIndex, speed) {
    this.className = className;
    this.startIndex = startIndex;
    this.speed = speed;
    this.currentIndex = startIndex;
    this.isScared = false;
    this.GHOST_HOUSE_ENTRANCE_INDEX = 321;
    this.GHOST_HOUSE_EXIT_INDEX = 322;
    this.mode = 'chase';
  }
  checkMode() {
    if (this.mode === 'chase') {
      this.chase();
    } else if (this.mode === 'scatter') {
      this.scatter();
    } else if (this.mode === 'scared') {
      this.scared();

    } else if (this.mode === 'eaten') {
      this.moveToHouse();
    }
  }
  static getMode() {
    return this.mode;
  }
  // using the ucs algorithm to find the shortest path for the blinky ghost
  getShortestPaths(startIndex, targetIndex) {
    const visited = new Set();
    // check if the targetIndex is wall change it to closest non wall index

    const queue = [{
      index: startIndex,
      cost: 0,
      path: [startIndex]
    }];
    const paths = [];
    while (queue.length > 0) {
      const {
        index,
        cost,
        path
      } = queue.shift();

      if (visited.has(index)) {
        continue;
      }

      visited.add(index);

      if (index === targetIndex) {
        paths.push({
          path,
          cost
        });
        continue;
      }

      const neighbors = getNeighbors(index);

      for (const neighbor of neighbors) {
        // skip the ghost house
        if (index === this.GHOST_HOUSE_ENTRANCE_INDEX && neighbor === this.GHOST_HOUSE_EXIT_INDEX) {
          continue;
        }
        if (index === this.GHOST_HOUSE_EXIT_INDEX && neighbor === this.GHOST_HOUSE_ENTRANCE_INDEX) {
          continue;
        }

        if (!visited.has(neighbor)) {
          const neighborCost = cost + 1;
          const neighborPath = [...path, neighbor];

          queue.push({
            index: neighbor,
            cost: neighborCost,
            path: neighborPath
          });
        }
      }
    }

    if (paths.length === 0) {
      return null;
    }

    paths.sort((a, b) => a.cost - b.cost);

    const shortestPaths = [];

    for (const path of paths) {
      if (path.cost !== paths[0].cost) {
        break;
      }

      shortestPaths.push(path.path);
    }

    return shortestPaths;
  }
  randomMove() {
    const directions = [-1, +1, width, -width];
    let direction = directions[Math.floor(Math.random() * directions.length)];
    //if the next block your ghost is going to go in does NOT contain a wall && a ghost
    //then you can go there
    if (!blocks[this.currentIndex + direction].classList.contains('wall') &&
      !blocks[this.currentIndex + direction].classList.contains('ghost')) {
      //remove all ghost related classes
      blocks[this.currentIndex].classList.remove(this.className, 'ghost', 'scared-ghost','ghost-eyes');
      //change the currentIndex to new safe block
      this.currentIndex += direction;
      //redraw the ghost in the new safe space.
      blocks[this.currentIndex].classList.add(this.className, 'ghost');
      if (this.mode == 'scared') {
        blocks[this.currentIndex].classList.add('scared-ghost');
      }
      //else try to find a new direction
    } else direction = directions[Math.floor(Math.random() * directions.length)];
    checkGameOver();
  }
  chase = this.randomMove;
  scatter() {
    const targetIndex = this.scatterTargetIndex;
    let paths = this.getShortestPaths(this.currentIndex, targetIndex);
    if (paths && paths.length > 0) {
      let path = paths.shift();
      const nextIndex = path[1];
      if (blocks[nextIndex]) {
        blocks[this.currentIndex].classList.remove(this.className, 'ghost', 'scared-ghost','ghost-eyes');
        blocks[nextIndex].classList.add(this.className, 'ghost');
        this.currentIndex = nextIndex;
      }
      //Random move in scatter mode when ghost arrive to target location and still have time for scatter mode 
      while (this.currentIndex === targetIndex &&pacman.scatterTimer.timerId &&pacman.scatterTimer.getRemainingTime() >0) {
        this.randomMove();
      }
    }
  }

  scared() {
    this.randomMove();
    this.checkCollision();
    checkGameOver();
  }
  moveToHouse() {
    const targetIndex = this.startIndex;
    let paths = this.getShortestPaths(this.currentIndex, targetIndex);
    if (paths && paths.length > 0) {
      let path = paths.shift();
      let nextIndex;
      if (path.length > 1) {
        nextIndex = path[1];
      } else {
        nextIndex = path[0];
      }
      blocks[this.currentIndex].classList.remove(this.className, 'ghost', 'scared-ghost', 'ghost-eyes');
      if (this.currentIndex === targetIndex) {
        blocks[nextIndex].classList.add(this.className, 'ghost', 'scared-ghost');

      }else {
        blocks[nextIndex].classList.add(this.className, 'ghost', 'ghost-eyes');
      }
      this.currentIndex = nextIndex;
      
    }
  }

  greedyChase() {
    const directions = [-1, +1, width, -width];
    const targetIndex = pacman.currentIndex;
    let paths = this.getShortestPaths(this.currentIndex, targetIndex);
    if (paths && paths.length > 0) {
      let path = paths.shift();
      let nextIndex;
      if (path.length > 1) {
        nextIndex = path[1];
      } else {
        nextIndex = path[0];
      }
      blocks[this.currentIndex].classList.remove(this.className, 'ghost', 'scared-ghost', 'ghost-eyes');
      blocks[nextIndex].classList.add(this.className, 'ghost');
      this.currentIndex = nextIndex;
    } else {
      this.scatter()
    }
  }


  checkCollision() {
    console.log("checkCollision for:", this.className,"block:",blocks[this.currentIndex],"block classlist:",blocks[this.currentIndex].classList);

    if (this.mode == 'scared' && blocks[this.currentIndex].classList.contains('pac-man', 'pac-man-left', 'pac-man-up', 'pac-man-down')) {
      updateScore(100);
      
      blocks[this.currentIndex].classList.remove(this.className, 'ghost', 'scared-ghost', 'ghost-eyes');
      this.mode = 'eaten';
      this.moveToHouse();
    }
    checkGameOver();
  }
  // reset the ghost to the start position when pacman dies 
  reset() {
    blocks[this.currentIndex].classList.remove(this.className, 'ghost', 'scared-ghost', 'ghost-eyes');
    this.currentIndex = this.startIndex;
    blocks[this.currentIndex].classList.add(this.className, 'ghost');
  }
  isWall(index) {
    return blocks[index].classList.contains('wall');
  }
  isGhost(index) {
    return blocks[index].classList.contains('ghost');
  }
  distanceToPacman() {
    //Manhattan distance
    const pacmanIndex = pacman.currentIndex;
    const ghostIndex = this.currentIndex;
    const x = Math.abs(Math.floor(pacmanIndex % width) - Math.floor(ghostIndex % width));
    const y = Math.abs(Math.floor(pacmanIndex / width) - Math.floor(ghostIndex / width));
    return x + y;
  }
  isPacmanDirectionPossible(nextMoveLength) {
    let futureIndex = pacman.currentIndex + nextMoveLength;
    let paths = this.getShortestPaths(pacman.currentIndex, futureIndex);
    // check if in paths there is a path that possible to pacman to move with length of pacman.direction * 4
    if (!paths || paths.length === 0) {
      return false;
    }
    for (let i = 0; i < paths.length; i++) {
      if (paths[i].length === nextMoveLength) {
        return true;
      }
    }
    return false;
  }
}

export class Blinky extends Ghost {
  constructor(className, startIndex, speed) {
    super(className, startIndex, speed);
    this.scatterTargetIndex = 53;
  }

  chase = function () {

    const directions = [-1, +1, width, -width];
    const targetIndex = pacman.currentIndex;

    let paths = this.getShortestPaths(this.currentIndex, targetIndex);
    if (paths && paths.length > 0) {
      let path = paths.shift();
      const nextIndex = path[1];
      blocks[this.currentIndex].classList.remove(this.className, 'ghost', 'scared-ghost', 'ghost-eyes');
      blocks[nextIndex].classList.add(this.className, 'ghost');
      this.currentIndex = nextIndex;
    } else {
      // Scatter to the bottom-right corner of the game board
      const targetIndex = (height * width) - 1;
      const paths = this.getShortestPaths(this.currentIndex, targetIndex);
      if (paths && paths.length > 0) {
        const path = paths[0];
        const nextIndex = path[1];
        removeClasses(this.currentIndex, this.className, "ghost", "scared-ghost", "ghost-eyes");
        addClasses(nextIndex, this.className, "ghost");
        this.currentIndex = nextIndex;
        // Update the ghost's direction
        this.direction = directions[path[0]];
      } else {
        this.scatter()
      }
    }
  }
}

export class Pinky extends Ghost {
  constructor(className, startIndex, speed) {
    super(className, startIndex, speed);
    this.scatterTargetIndex = 29;
  }

  chase = function () {
    let targetIndex;
    let temp;
    if (this.isPacmanDirectionPossible(pacman.direction * 4)) {
      temp = pacman.currentIndex + pacman.direction * 4;
    } else {
      temp = pacman.currentIndex;
    }
    if (this.distanceToPacman() > 4 && temp > 0 && temp < blocks.length) {
      if (!blocks[temp].classList.contains('wall')) {
        targetIndex = temp;
      } else {
        targetIndex = getNeighbors(temp).find(index => !blocks[index].classList.contains('wall'));
      }
      let paths = this.getShortestPaths(this.currentIndex, targetIndex);
      if (paths && paths.length > 0) {
        let path = paths.shift();
        let nextIndex;
        if (path.length > 1) {
          nextIndex = path[1];
        } else {
          nextIndex = path[0];
        }
        if (this.currentIndex === targetIndex) {
          this.greedyChase();
        } else {
          blocks[this.currentIndex].classList.remove(this.className, 'ghost', 'scared-ghost', 'ghost-eyes');
          blocks[nextIndex].classList.add(this.className, 'ghost');
          this.currentIndex = nextIndex;
        }


      }
    } else if (this.distanceToPacman() <= 4) {
      this.greedyChase();
    } else {
      this.scatter()
    }
  }
}
export class Inky extends Ghost {
  constructor(className, startIndex, speed) {
    super(className, startIndex, speed)
    this.scatterTargetIndex = 665;
  }

  chase = function () {
    let targetIndex;
    let temp;

    const blinkyTargetIndex = pacman.currentIndex;
    const diff = pacman.currentIndex + (pacman.direction + 2) - blinkyTargetIndex;
    temp = blinkyTargetIndex + (2 * diff);
    if (targetIndex > 0 && targetIndex < blocks.length) {
      if (blocks[targetIndex].classList.contains('wall')) {
        temp = getNeighbors(targetIndex).find(index => !blocks[index].classList.contains('wall'));
      } else {
        temp = targetIndex;
      }
      if (this.isPacmanDirectionPossible(temp)) {
        targetIndex = temp;
      } else {
        targetIndex = pacman.currentIndex;
      }
    } else {
      targetIndex = pacman.currentIndex;
    }
    let paths = this.getShortestPaths(this.currentIndex, targetIndex);

    if (paths && paths.length > 0) {
      let path = paths.shift();
      let nextIndex;
      if (path.length > 1) {
        nextIndex = path[1];
      } else {
        nextIndex = path[0];
      }
      if (this.currentIndex === targetIndex) {
        this.greedyChase();
      } else {
        blocks[this.currentIndex].classList.remove(this.className, 'ghost', 'scared-ghost', 'ghost-eyes');
        blocks[nextIndex].classList.add(this.className, 'ghost');
        this.currentIndex = nextIndex;
      }
    } else {
      this.scatter()
    }
  }
}

export class Clyde extends Ghost {
  constructor(className, startIndex, speed) {
    super(className, startIndex, speed);
    this.scatterTargetIndex = 649;
  }
  chase = function () {
    const directions = [-1, +1, width, -width];
    const targetIndex = pacman.currentIndex;

    const distance = this.distanceToPacman(this.currentIndex, targetIndex);
    if (distance <= 8) {
      const paths = this.getShortestPaths(this.currentIndex, targetIndex);
      if (paths && paths.length > 0) {
        const path = paths[0];
        const nextIndex = path[1];
        if (blocks[nextIndex]) {
          blocks[this.currentIndex].classList.remove(this.className, 'ghost', 'scared-ghost', 'ghost-eyes');
          blocks[nextIndex].classList.add(this.className, 'ghost');
          this.currentIndex = nextIndex;
        }
      }
    } else {
      // Not close enough to Pac-Man to chase him yet
      this.randomMove();
    }
  }
}
