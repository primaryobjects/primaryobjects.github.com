class Isolation extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      round: 1,
      playerIndex: props.playerIndex || 0,
      players: [ { x: props.player1x || -1, y: props.player1y || -1, moves: [{}] }, { x: props.player2x || -1, y: props.player2y || -1, moves: [{}] } ],
      grid: props.grid,
      strategy: props.strategy,
      heuristic: props.heuristic,
      width: props.width,
      height: props.height,
      treeDepth: props.treeDepth,
    };

    this.state.players[0].moves = IsolationManager.allMoves(0, this.state.players, props.width, props.height);
    this.state.players[1].moves = IsolationManager.allMoves(1, this.state.players, props.width, props.height);

    this.grid = React.createRef();
    this.onGrid = this.onGrid.bind(this);
  }

  componentDidUpdate(nextProps) {
    const { strategy, heuristic, width, height, treeDepth } = this.props;

    if (strategy && nextProps.strategy !== strategy) {
      this.setState({ strategy });
    }

    if (heuristic && nextProps.heuristic !== heuristic) {
      this.setState({ heuristic });
    }

    if (width && nextProps.width !== width) {
      this.setState({ width });
    }

    if (height && nextProps.height !== height) {
      this.setState({ height });
    }

    if (treeDepth && nextProps.treeDepth !== treeDepth) {
      this.setState({ treeDepth });
    }
  }

  onGrid(x, y, values) {
    const playerIndex = this.state.playerIndex;
    const players = this.state.players;

    if (IsolationManager.isValidMove(x, y, playerIndex, players, values, this.grid.current.props.width, this.grid.current.props.height)) {
      // Update player position.
      players[playerIndex].x = x;
      players[playerIndex].y = y;

      // Update the grid local variable with the player move (so available moves will be accurate).
      values[y][x] = playerIndex + 1;

      // Update available moves for all players.
      players[0].moves = IsolationManager.availableMoves(0, players, values, this.grid.current.props.width, this.grid.current.props.height);
      players[1].moves = IsolationManager.availableMoves(1, players, values, this.grid.current.props.width, this.grid.current.props.height);

      // Update cell value in the grid.
      this.grid.current.setValue(x, y, !playerIndex ? 'gray' : 'silver');

      // Update state and play opponent's turn.
      this.setState({ round: this.state.round + 1, playerIndex: !playerIndex ? 1 : 0, players }, () => {
        if (this.state.playerIndex && this.state.players[this.state.playerIndex].moves.length > 0) {
          if (this.state.strategy && this.state.strategy !== StrategyManager.none) {
          // AI turn.
          setTimeout(() => {
            const tree = StrategyManager.tree(playerIndex, JSON.parse(JSON.stringify(players)), values, this.grid.current.props.width, this.grid.current.props.height, this.state.round, this.state.heuristic);
            StrategyManager.renderTree(tree, this.state.treeDepth);

            // Get the AI's move.
            ({ x, y } = this.props.strategy(tree, this.state.playerIndex, this.state.players, values, this.grid.current.props.width, this.grid.current.props.height));
            console.log(`AI is moving to ${x},${y}.`)

            // Move the AI player.
            this.onGrid(x, y, values);
          }, 1000);
          }
        }
      });

      return true;
    }
  }

  render() {
    const moves = this.props.moves !== undefined ? this.props.moves : this.state.players[this.state.playerIndex].moves.length;
    const winnerIndex = this.state.playerIndex ? 1 : 2;

    return (
      <div id='app' ref={ this.container }>
        <Grid width={ this.state.width } height={ this.state.height } grid={ this.props.grid } cellStyle={ this.props.cellStyle } players={ this.state.players } onClick={ this.onGrid } ref={ this.grid }>
          <Player width="50" height="50" x={ this.state.players[0].x } y={ this.state.players[0].y } cellStyle={ this.props.cellStyle } color="blue"></Player>
          <Player width="50" height="50" x={ this.state.players[1].x } y={ this.state.players[1].y } cellStyle={ this.props.cellStyle } color="orange"></Player>
        </Grid>
        <div class='row'>
          <div class='col col-auto'>
            <div class={ `badge ${!this.state.playerIndex ? 'badge-primary' : 'badge-warning'}` }>Player { this.state.playerIndex + 1 }'s Turn</div>
          </div>
          <div class='col col-auto'>
            <div class='badge badge-light'>{ moves } Moves Available</div>
          </div>
          <div class='col col-auto'>
            <div class={ `badge badge-success ${!moves ? '' : 'd-none'}` }>Player { winnerIndex } wins!</div>
          </div>
        </div>

        <div class='row'>
          <div class='col'>
            <div class='badge badge-secondary'>
              Move { Math.round(this.state.round / 2) }
            </div>
          </div>
        </div>
      </div>
    );
  }
}