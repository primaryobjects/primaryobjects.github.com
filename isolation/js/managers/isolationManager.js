const IsolationManager = {
  isValidMove: (x, y, playerIndex, players, values, width, height) => {
    const activePlayer = players[playerIndex];
    const opponentPlayer = players[!playerIndex ? 1 : 0];

    let isValid = activePlayer.x === -1; // Initialize the first-move to valid.

    if (x < 0 || x >= width || y < 0 || y >= height) {
      isValid = false;
    }
    // Verify this cell is not already used (i.e., it's value is 0).
    else if (values[y][x]) {
      //console.log(`Cell ${x},${y} is already taken.`);
      isValid = false;
    }
    else if (!isValid) {
      // Verify this move is valid for the player and the path is not blocked.
      let isBlocked;

      // Verify path is valid.
      if (x !== activePlayer.x && y !== activePlayer.y && (Math.abs(activePlayer.x - x) !== Math.abs(activePlayer.y - y))) {
        // This is a diagonal move but not valid one for one.
        isBlocked = true;
        console.log(`Invalid move to ${x},${y}`);
      }
      // Verify path is not blocked.
      else if (y < activePlayer.y && x < activePlayer.x) {
        // Up-left.
        let posy = activePlayer.y - 1
        for (let posx = activePlayer.x - 1; posx > x; posx--) {
          if (values[posy][posx]) {
            isBlocked = true;
            break;
          }
          posy--;
        }
      }
      else if (y < activePlayer.y && x > activePlayer.x) {
        // Up-right.
        let posy = activePlayer.y - 1
        for (let posx = activePlayer.x + 1; posx < x; posx++) {
          if (values[posy][posx]) {
            isBlocked = true;
            break;
          }
          posy--;
        }
      }
      else if (y > activePlayer.y && x < activePlayer.x) {
        // Down-left.
        let posy = activePlayer.y + 1;
        for (let posx = activePlayer.x - 1; posx > x; posx--) {
          if (values[posy][posx]) {
            isBlocked = true;
            break;
          }
          posy++;
        }
      }
      else if (y > activePlayer.y && x > activePlayer.x) {
        // Down-right.
        let posy = activePlayer.y + 1;
        for (let posx = activePlayer.x + 1; posx < x; posx++) {
          if (values[posy][posx]) {
            isBlocked = true;
            break;
          }
          posy++;
        }
      }
      else if (x > activePlayer.x) {
        // Right.
        for (let pos = activePlayer.x + 1; pos < x; pos++) {
          if (values[y][pos]) {
            isBlocked = true;
            break;
          }
        }
      }
      else if (x < activePlayer.x) {
        // Left.
        for (let pos = activePlayer.x - 1; pos > x; pos--) {
          if (values[y][pos]) {
            isBlocked = true;
            break;
          }
        }
      }
      else if (y > activePlayer.y) {
        // Down.
        for (let pos = activePlayer.y + 1; pos < y; pos++) {
          if (values[pos][x]) {
            isBlocked = true;
            break;
          }
        }
      }
      else if (y < activePlayer.y) {
        // Up.
        for (let pos = activePlayer.y - 1; pos > y; pos--) {
          if (values[pos][x]) {
            isBlocked = true;
            break;
          }
        }
      }

      isValid = !isBlocked;
    }

    return isValid;
  },

  availableMoves: (playerIndex, players, values, width, height) => {
    let moves = [];
    const activePlayer = players[playerIndex];

    if (activePlayer.x !== -1) {
      let x, y;

      // Up.
      for (y=activePlayer.y - 1; y>=0; y--) {
        if (IsolationManager.isValidMove(activePlayer.x, y, playerIndex, players, values, width, height)) {
          moves.push({ x: activePlayer.x, y });
        }
        else {
          // Path is blocked from going further.
          break;
        }
      }

      // Down.
      for (y=activePlayer.y + 1; y<height; y++) {
        if (IsolationManager.isValidMove(activePlayer.x, y, playerIndex, players, values, width, height)) {
          moves.push({ x: activePlayer.x, y });
        }
        else {
          // Path is blocked from going further.
          break;
        }
      }

      // Left.
      for (x=activePlayer.x - 1; x>=0; x--) {
        if (IsolationManager.isValidMove(x, activePlayer.y, playerIndex, players, values, width, height)) {
          moves.push({ x, y: activePlayer.y });
        }
        else {
          // Path is blocked from going further.
          break;
        }
      }

      // Right.
      for (x=activePlayer.x + 1; x<width; x++) {
        if (IsolationManager.isValidMove(x, activePlayer.y, playerIndex, players, values, width, height)) {
          moves.push({ x, y: activePlayer.y });
        }
        else {
          // Path is blocked from going further.
          break;
        }
      }

      // Up-left.
      x = activePlayer.x;
      for (y=activePlayer.y - 1; y>=0; y--) {
        x--;
        if (x === -1) {
          break;
        }

        if (IsolationManager.isValidMove(x, y, playerIndex, players, values, width, height)) {
          moves.push({ x, y });
        }
        else {
          // Path is blocked from going further.
          break;
        }
      }

      // Up-right.
      x = activePlayer.x;
      for (y=activePlayer.y - 1; y>=0; y--) {
        x++;
        if (x >= width) {
          break;
        }

        if (IsolationManager.isValidMove(x, y, playerIndex, players, values, width, height)) {
          moves.push({ x, y });
        }
        else {
          // Path is blocked from going further.
          break;
        }
      }

      // Down-left.
      x = activePlayer.x;
      for (y=activePlayer.y + 1; y<height; y++) {
        x--;
        if (x === -1) {
          break;
        }

        if (IsolationManager.isValidMove(x, y, playerIndex, players, values, width, height)) {
          moves.push({ x, y });
        }
        else {
          // Path is blocked from going further.
          break;
        }
      }

      // Down-right.
      x = activePlayer.x;
      for (y=activePlayer.y + 1; y<height; y++) {
        x++;
        if (x >= width) {
          break;
        }

        if (IsolationManager.isValidMove(x, y, playerIndex, players, values, width, height)) {
          moves.push({ x, y });
        }
        else {
          // Path is blocked from going further.
          break;
        }
      }
    }
    else {
      moves = IsolationManager.allMoves(playerIndex, players, width, height, width, height);
    }

    return moves;
  },

  allMoves: (playerIndex, players, width, height) => {
    const moves = [];

    // First move, all spaces are available. Second move, all spaces but 1 are available.
    for (let y=0; y<height; y++) {
      for (let x=0; x<width; x++) {
        if (!playerIndex || x !== players[0].x || y !== players[0].y) {
          moves.push({ x, y });
        }
      }
    }

    return moves;
  }
};
