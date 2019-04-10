class TurtleObj {
  constructor(x = 0, y = 0, width = 10, height = 10, color = 'pink', orientation = 0, steps = 10, context) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.orientation = orientation;
    this.context = context;
    this.steps = steps;
  }

  clear() {
    this.context.clearRect(0, 0, 1200, 1200);
  }

  getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';

    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }

    return color;
  }

  forward(steps = this.steps) {
    this.context.beginPath();
    this.context.moveTo(this.x, this.y);

    switch(this.orientation) {
      case 0: this.y -= steps; break;
      case 1: this.x += steps; break;
      case 2: this.y += steps; break;
      case 3: this.x -= steps; break;
    }

    this.x = this.x < 0 ? 0 : this.x;
    this.y = this.y < 0 ? 0 : this.y;

    this.context.strokeStyle = this.color === 'rainbow' ? this.getRandomColor() : this.color;
    this.context.fillStyle = this.color === 'rainbow' ? this.getRandomColor() : this.color;
    this.context.lineTo(this.x, this.y);
    this.context.stroke();
  }

  move(x, y) {
    this.x = x;
    this.y = y;
  }

  right() {
    this.orientation = this.orientation === 3 ? 0 : this.orientation + 1;
  }

  left() {
    this.orientation = this.orientation === 0 ? 3 : this.orientation - 1;
  }
};

class DragonObj extends TurtleObj {
  constructor(x, y, width, height, color, orientation, steps, context, typeX = 'X+YF+', typeY = '-FX-Y') {
    super(x, y, width, height, color, orientation, steps, context);
    this.typeX = typeX;
    this.typeY = typeY;
  }

  X(n) {
    if (n > 0) {
      this.L(this.typeX, n);
    }
  }

  Y(n) {
    if (n > 0) {
      this.L(this.typeY, n);
    }
  }

  L(s, n) {
    const chars = s.split('');
    chars.forEach(ch => {
      switch(ch) {
        case '-': this.left(); break;
        case '+': this.right(); break;
        case 'X': this.X(n - 1); break;
        case 'Y': this.Y(n - 1); break;
        case 'F': this.forward(this.steps); break;
      }
    });
  }
}

class Pattern extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.onclick = this.onclick.bind(this);
  }

  componentDidMount() {
    // Let the parent component know about our existence.
    this.props.onRef(this);
  }

  componentWillUnmount() {
    this.props.onRef(undefined);
  }

  componentDidUpdate(prevProps) {
    this.initialize(this.state.context);
  }

  setContext(context) {
    // Store the context for updates.
    this.setState({ context });
    this.initialize(this.state.context);
  }

  initialize(context) {
    // Initialize the turtle.
  }

  clear() {
    this.turtle.clear();
  }

  onclick(e) {
    // Set the draw position to the click point.
    this.turtle.move(e.nativeEvent.offsetX - ((this.turtle.width * 10) / 2), e.nativeEvent.offsetY - ((this.turtle.height * 10) / 2));
  }

  render() {
    return (
      <div class='turtle' onClick={ this.onclick }></div>
    );
  }
}

class Dragon extends Pattern {
  constructor(props) {
    super(props);
  }

  initialize(context) {
    // Initialize the turtle.
    this.turtle = new DragonObj(this.props.x, this.props.y, this.props.width, this.props.height, this.props.color, this.props.orientation, this.props.steps, context, this.props.typeX, this.props.typeY);
  }

  onclick(e) {
    super.onclick(e);

    // Draw a dragon.
    this.turtle.X(this.props.count || 8);
  }
}

class Square extends Pattern {
  constructor(props) {
    super(props);
  }

  initialize(context) {
    // Initialize the turtle.
    this.turtle = new TurtleObj(this.props.x, this.props.y, this.props.width, this.props.height, this.props.color, this.props.orientation, this.props.steps, context);
  }

  onclick(e) {
    super.onclick(e);

    // Draw a square.
    for (let i=0; i<4; i++) {
      this.turtle.forward(100);
      this.turtle.right();
    }
  }
}

class Canvas extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      formulaX: 'X+YF+',
      formulaY: '-FX-Y'
    };

    this.onX = this.onX.bind(this);
    this.onY = this.onY.bind(this);
    this.onClear = this.onClear.bind(this);

    this.canvas = React.createRef();
    this.children = [];
  }

  componentDidMount() {
    // Initialize the canvas context for child components.
    const context = this.canvas.current.getContext('2d');
    this.children.forEach(child => (child.setContext(context)));
  }

  onX(e) {
    this.setState({ formulaX: e.target.value });
  }

  onY(e) {
    this.setState({ formulaY: e.target.value });
  }

  onClear() {
    this.children.forEach(child => child.clear());
  }

  render() {
    return(
      <div id='canvas-container'>
        <form>
          <div class="form-group">
            <div class='row'>
              <div class='col-auto'>
                <label for="formulaX">Formula X</label>
                <input type="text" class="form-control" id="formulaX" aria-describedby="formulaXHelp" placeholder="Enter a formula" value={this.state.formulaX} onChange={this.onX} />
                <small id="formulaXHelp" class="form-text text-muted">The heuristic for how the pen should move on the x-axis.</small>
              </div>
              <div class='col-auto'>
                <label for="formulaY">Formula Y</label>
                <input type="text" class="form-control" id="formulaY" aria-describedby="formulaYHelp" placeholder="Enter a formula" value={this.state.formulaY} onChange={this.onY} />
                <small id="formulaYHelp" class="form-text text-muted">The heuristic for how the pen should move on the y-axis.</small>
              </div>
              <div class='col-auto btn'>
                <button type="button" id="clear" class="btn btn-secondary mt-4" onClick={this.onClear}>Clear</button>
              </div>
            </div>
          </div>
        </form>
        <div class='canvas'>
          <canvas width={1200} height={1200} ref={ this.canvas }></canvas>
          <Square orientation={1} color='pink' onRef={ ref => (this.children.push(ref)) }/>
          <Dragon color='rainbow' typeX={this.state.formulaX} typeY={this.state.formulaY} count={8} onRef={ ref => (this.children.push(ref)) }/>
        </div>
      </div>
    );
  }
}

ReactDOM.render(
  <Canvas />,
  document.getElementById('root')
);