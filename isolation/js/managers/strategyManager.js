const StrategyManager = {
  none: function() {
    return null;
  },

  random: function(tree, playerIndex, players, values, width, height) {
    let isValid = false;
    let count = 0;
    let x, y;

    console.log('Using AI strategy random.');

    while (!isValid && count++ < 1000) {
      x = Math.floor(Math.random() * width);
      y = Math.floor(Math.random() * height);
      isValid = IsolationManager.isValidMove(x, y, playerIndex, players, values, width, height);
    }

    if (count >= 1000) {
      console.log('Random strategy failed to find a move.');
    }

    return { x, y };
  },

  minimax: function(tree, playerIndex, players, values, width, height) {
    // https://tonypoer.io/2016/10/28/implementing-minimax-and-alpha-beta-pruning-using-python/
    let bestState = null;
    let bestVal = -9999;
    let beta = 9999;

    console.log('Using AI strategy minimax.');

    const getSuccessors = node => {
      return node ? node.children : [];
    };

    const isTerminal = node => {
      return node ? node.children.length === 0 : true;
    };

    const getUtility = node => {
      return node ? node.score : -9999;
    };

    const maxValue = (node, alpha, beta) => {
      //console.log(`AlphaBeta-->MAX: Visited Node: ${toString(node)}`);

      if (isTerminal(node)) {
        return getUtility(node);
      }
      else {
        let value = -9999;

        const successors = getSuccessors(node);
        successors.forEach(state => {
          value = Math.max(value, minValue(state, alpha, beta));
          if (value >= beta) {
            return value;
          }
          else {
            alpha = Math.max(alpha, value);
          }
        });

        return value;
      }
    };

    const minValue = (node, alpha, beta) => {
      //console.log(`AlphaBeta-->MIN: Visited Node: ${toString(node)}`);

      if (isTerminal(node)) {
        return getUtility(node);
      }
      else {
        let value = 9999;

        const successors = getSuccessors(node);
        successors.forEach(state => {
          value = Math.min(value, maxValue(state, alpha, beta));
          if (value <= alpha) {
            return value;
          }
          else {
            beta = Math.min(beta, value);
          }
        });

        return value;
      }
    };

    const toString = state => {
      return `Depth ${state.depth}, Score ${state.score}, activePlayer ${state.activePlayer}, players: (${state.players[0].x}, ${state.players[0].y}), (${state.players[1].x}, ${state.players[1].y})`;
    };

    const successors = getSuccessors(tree);
    successors.forEach(state => {
      const value = minValue(state, bestVal, beta);
      if (value > bestVal) {
        bestVal = value;
        bestState = state;
      }
    });

    console.log(`MiniMax: Utility value of best node is ${bestVal}.`);
    console.log(`MiniMax: Best state is: ${toString(bestState)}`)

    return bestState ? { x: bestState.players[bestState.activePlayer].x, y: bestState.players[bestState.activePlayer].y } : { x: 1, y: 1 };
  },

  tree: function(playerIndex, players, values, width, height, round, heuristic, maxDepth = 4) {
    //playerIndex = 0; // Always use scores for human player.
    const referencePlayerIndex = !playerIndex ? 1 : 0; // Point-of-view for the player that the tree is calculated for. The root node will be from the opposing player.
    console.log(round);

    let root = { depth: 0, player: playerIndex, activePlayer: playerIndex, baseScore: players[referencePlayerIndex].moves.length, score: heuristic(players[referencePlayerIndex].moves.length, players[!referencePlayerIndex ? 1 : 0].moves.length, width, height, round), moves: players[referencePlayerIndex].moves, players, values, children: [], width, height };
    let fringe = [ root ];
    let node = fringe.shift();

    while (node) {
      if (node.depth <= maxDepth && node.moves.length) {
        const newPlayerIndex = node.depth % 2 === 0 ? referencePlayerIndex : playerIndex;//0 : 1;

        // Evaluate all possible moves from the current state.
        node.moves.forEach(move => {
          // Make a copy of the players.
          let newPlayers = JSON.parse(JSON.stringify(node.players));

          // Move the player to a new position.
          newPlayers[newPlayerIndex].x = move.x;
          newPlayers[newPlayerIndex].y = move.y;

          // Set the new position as used.
          let newValues = JSON.parse(JSON.stringify(node.values));
          newValues[newPlayers[newPlayerIndex].y][newPlayers[newPlayerIndex].x] = !newPlayerIndex ? 'gray' : 'silver';

          // Get available moves at new position in relation to the reference player.
          const movesReferencePlayer = IsolationManager.availableMoves(referencePlayerIndex, newPlayers, newValues, width, height);
          // Get available moves with new game board for next player.
          const moves = IsolationManager.availableMoves(!newPlayerIndex ? 1 : 0, newPlayers, newValues, width, height);

          // Add the new node to our tree.
          const child = { depth: node.depth + 1, player: playerIndex, activePlayer: newPlayerIndex, baseScore: movesReferencePlayer.length, score: heuristic(movesReferencePlayer.length, moves.length, width, height, round), moves, players: newPlayers, values: newValues, children: [] };
          node.children.push(child);
          fringe.push(child);
        });
      }

      // Process next node.
      node = fringe.shift();
    }

    return root;
  },

  renderTree: function(tree, maxNodes = 50) {
    const graph = $('#graph');
    graph.html('');

    const fringe = [{ tree, depth: 0 }];
    let index = 0;
    let count = 0;
    let node = fringe.shift();
    while (node && count++ < maxNodes) {
      const player1 = node.tree.players[0/*node.tree.activePlayer*/];
      const player2 = node.tree.players[1/*node.tree.activePlayer ? 0 : 1*/];
      const id = `node-${index++}-${node.depth}-${player1.x}-${player1.y}`;

      // Append a new div line to the output.
      graph.append(`<div id='xx'></div><div id='header-${id}' class='ml-${node.depth}'>Depth: ${node.depth}, Player 1: (${player1.x}, ${player1.y}), Player 2: (${player2.x}, ${player2.y}), Score: ${node.tree.score}, Active Player: ${ node.tree.activePlayer }, Moves: ${JSON.stringify(node.tree.moves)}<div id='${id}'</div></div>`);

      // Render a mini version of the grid for this state.
      ReactDOM.render(
        <div>
          <Isolation width={ tree.width } height={ tree.height } strategy={ StrategyManager.random } playerIndex = { node.tree.activePlayer } player1x={ player1.x } player1y={ player1.y } player2x={ player2.x } player2y={ player2.y } grid={ node.tree.values } moves={ node.tree.baseScore } cellStyle="small"></Isolation>
        </div>,
        document.getElementById(id)
      );

      // Add each child node from this state to the fringe.
      node.tree.children.forEach(child => {
        fringe.push({ tree: child, depth: node.depth + 1 });
      });

      node = fringe.pop();
    }
  }
};
