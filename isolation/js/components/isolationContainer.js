class IsolationContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      strategy: props.strategy || StrategyManager.minimax,
      heuristic: props.heuristic || HeuristicManager.simple,
      width: props.width || 3,
      height: props.height || 3,
      treeDepth: props.treeDepth || 25,
      miniMaxDepth: props.miniMaxDepth || 6,
    };

    this.onStrategy = this.onStrategy.bind(this);
    this.onHeuristic = this.onHeuristic.bind(this);
    this.onWidth = this.onWidth.bind(this);
    this.onHeight = this.onHeight.bind(this);
    this.onTreeDepth = this.onTreeDepth.bind(this);
    this.onMiniMaxDepth = this.onMiniMaxDepth.bind(this);
  }

  onStrategy(e) {
    this.setState({ strategy: StrategyManager[e.currentTarget.value] });
    console.log(`Strategy set to ${e.currentTarget.value}.`);
  }

  onHeuristic(e) {
    this.setState({ heuristic: HeuristicManager[e.currentTarget.value] });
    console.log(`Heuristic set to ${e.currentTarget.value}.`);
  }

  onWidth(e) {
    this.setState({ width: e.currentTarget.value });
  }

  onHeight(e) {
    this.setState({ height: e.currentTarget.value });
  }

  onTreeDepth(e) {
    this.setState({ treeDepth: e.currentTarget.value });
  }

  onMiniMaxDepth(e) {
    this.setState({ miniMaxDepth: e.currentTarget.value });
  }

  render() {
    return (
      <div>
        <Isolation width={ this.state.width } height={ this.state.height } treeDepth={ this.state.treeDepth } miniMaxDepth={ this.state.miniMaxDepth } strategy={ this.state.strategy } heuristic={ this.state.heuristic }></Isolation>

        <div class="gamePlayOptions mt-3">
            <div class='row'>
              <div class='col text-muted'>
                Game Play
              </div>
            </div>
            <div class='row'>
              <div class='col'>
                <input type="radio" name="strategy" value="minimax" checked={this.state.strategy === StrategyManager.minimax} onChange={ this.onStrategy }/> <span>Minimax</span>
                <input type="radio" name="strategy" value="random" checked={this.state.strategy === StrategyManager.random} onChange={ this.onStrategy }/> <span>Random</span>
                <input type="radio" name="strategy" value="none" checked={!this.state.strategy || this.state.strategy === StrategyManager.none} onChange={ this.onStrategy }/> <span>2 Players</span>
              </div>
            </div>
            <div class='row mt-2'>
              <div class='col text-muted'>
                AI Tactic
              </div>
            </div>
            <div class='row'>
              <div class='col'>
                <input type="radio" name="heuristic" value="simple" checked={this.state.heuristic === HeuristicManager.simple} onChange={ this.onHeuristic }/> <span>Simple</span>
                <input type="radio" name="heuristic" value="offensive" checked={this.state.heuristic === HeuristicManager.offensive} onChange={ this.onHeuristic }/> <span>Offensive</span>
                <input type="radio" name="heuristic" value="defensive" checked={this.state.heuristic === HeuristicManager.defensive} onChange={ this.onHeuristic }/> <span>Defensive</span>
              </div>
            </div>
            <div class='row'>
              <div class='col'>
                <input type="radio" name="heuristic" value="aggressive" checked={this.state.heuristic === HeuristicManager.aggressive} onChange={ this.onHeuristic }/> <span>Aggressive</span>
                <input type="radio" name="heuristic" value="offensiveToDefensive" checked={this.state.heuristic === HeuristicManager.offensiveToDefensive} onChange={ this.onHeuristic }/> <span>Offensive to Defensive</span>
                <input type="radio" name="heuristic" value="defensiveToOffensive" checked={this.state.heuristic === HeuristicManager.defensiveToOffensive} onChange={ this.onHeuristic }/> <span>Defensive to Offensive</span>
              </div>
            </div>
            <div class='row mt-2'>
              <div class='col text-muted'>
                Grid Size
              </div>
            </div>
            <div class='row'>
              <div class='col-auto'>
                <input type="number" id="width" name="width" value={this.state.width} onChange={ this.onWidth }/>
              </div>
              <div class='col-auto'>
                <input type="number" id="height" name="height" value={this.state.height} onChange={ this.onHeight }/>
              </div>
            </div>
          <div class='row mt-2'>
            <div class='col text-muted'>
              Minimax Depth
            </div>
          </div>
          <div class='row'>
            <div class='col'>
              <input type="number" id="miniMaxDepth" name="miniMaxDepth" value={this.state.miniMaxDepth} onChange={ this.onMiniMaxDepth }/>
            </div>
          </div>
          <div class='row mt-2'>
            <div class='col text-muted'>
              Tree Depth
            </div>
          </div>
          <div class='row'>
            <div class='col'>
              <input type="number" id="treeDepth" name="treeDepth" value={this.state.treeDepth} onChange={ this.onTreeDepth }/>
            </div>
          </div>
        </div>
      </div>
    );
  }
}