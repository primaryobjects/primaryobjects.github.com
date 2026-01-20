// Game variables
let scene, camera, renderer, player, coins = [], walls = [], score = 0;
const coinSound = new Audio('assets/coin-sound.wav');
const keys = {};
const textureLoader = new THREE.TextureLoader();
let snowflakes = [];
let controls;
let ground; // Reference to the ground plane
let groundTexture1, groundTexture2; // Global texture references
let playerInitialized = false;
const MAZE_SIZE = 30; // Size of the maze in tiles
const TILE_SIZE = 2;   // Size of each tile
const MAP_BOUNDARY = (MAZE_SIZE / 2) * TILE_SIZE; // Half the map size in units
const ROCK_END_X = -MAP_BOUNDARY / 3;   // end of rock region
const SNOW_END_X =  MAP_BOUNDARY / 3;   // end of snow region
const ICE_START_X = SNOW_END_X;
const ICE_END_X   = MAP_BOUNDARY;
const DRAMATIC_CAMERA_TRIGGER_X = ICE_START_X + (ICE_END_X - ICE_START_X) * 0.3;
let wallTextures = []; // Array to store all wall textures
let torches = [];
let snowParticles = [];
let iceParticles = [];
let heatShader;
const clock = new THREE.Clock();
let cameraMode = "iso"; // "iso" or "dramatic"
const isoCameraOffset = new THREE.Vector3(0, 15, 10);
const dramaticCameraOffset = new THREE.Vector3(0, 6, 3);
let iceSparkleMaterial;
let glitterTrail = [];
let footprints = [];
const footprintTexture = new THREE.TextureLoader().load('assets/footprint.png');
let lastFootprintPos = null;
let footprintSide = 'left';
const FOOTPRINT_SPACING = 1.2; // minimum distance between footprints
let glitterPixels = [];
let mobileControls = false; // Flag to track if mobile controls are active

// Initialize the game
function init() {
    // Set up the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Set up the camera (isometric view)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 20);
    camera.lookAt(0, 0, 0);

    // Set up the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Lighting setup
    const directionalLight = new THREE.DirectionalLight(0xffffff, -1.5);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const ambient = new THREE.AmbientLight(0x222222, 0.1);
    scene.add(ambient);

    scene.fog = new THREE.FogExp2(0x000000, 0.04);
    heatShader = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
            time: { value: 0 }
        },
        vertexShader: `
            uniform float time;
            varying vec2 vUv;
            void main() {
                vUv = uv;
                vec3 pos = position;
                pos.x += sin(time * 5.0 + position.y * 10.0) * 0.01;
                pos.z += cos(time * 4.0 + position.y * 8.0) * 0.01;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            varying vec2 vUv;
            void main() {
                float alpha = 0.25;
                gl_FragColor = vec4(1.0, 0.6, 0.2, alpha);
            }
        `
    });

    iceSparkleMaterial = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
            time: { value: 0 }
        },
        vertexShader: `
            uniform float time;
            varying float vTwinkle;
            void main() {
                // Twinkle factor based on time + random offset
                float base = abs(sin(time * 3.0 + position.x * 0.5 + position.z * 0.5));
                float burst = step(0.98, fract(sin(position.x * 12.9898 + position.z * 78.233) * 43758.5453 + time * 5.0));
                vTwinkle = min(1.0, base + burst * 0.8);

                // Slight vertical shimmer
                vec3 pos = position;
                pos.y += sin(time * 2.0 + position.x * 0.3) * 0.1;

                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = 2.0 + vTwinkle * 3.0; // flicker size
            }
        `,
        fragmentShader: `
            varying float vTwinkle;
            void main() {
                // Gradient color cycle: blue → purple → white
                vec3 blue = vec3(0.4, 0.7, 1.0);
                vec3 purple = vec3(0.8, 0.4, 1.0);
                vec3 white = vec3(1.0, 1.0, 1.0);

                // Blend between colors based on twinkle
                vec3 color;
                if (vTwinkle < 0.33) {
                    color = mix(blue, purple, vTwinkle * 3.0);
                } else if (vTwinkle < 0.66) {
                    color = mix(purple, white, (vTwinkle - 0.33) * 3.0);
                } else {
                    color = mix(white, blue, (vTwinkle - 0.66) * 3.0);
                }

                float alpha = 0.4 + vTwinkle * 0.6; // sparkle brightness

                gl_FragColor = vec4(color, alpha);
            }
        `
    });

    // Add OrbitControls for mouse-based camera panning (disabled for now)
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enabled = false;

    // Detect mobile devices
    detectMobileDevice();

    // Load all textures first
    loadAllTextures();
}

// Detect if the user is on a mobile device
function detectMobileDevice() {
    const isMobile = true;///Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
        mobileControls = true;
        createMobileControls();
    }
}

// Create mobile control buttons
function createMobileControls() {
    // Create controls container
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'mobile-controls';
    controlsContainer.className = 'mobile-controls';

    // Create arrow pad container
    const arrowPad = document.createElement('div');
    arrowPad.className = 'mobile-arrow-pad';

            // Create up button (top center)
    const upButton = document.createElement('button');
    upButton.innerHTML = '↑';
    upButton.className = 'mobile-control-button';
    upButton.style.gridColumn = '2';
    upButton.style.gridRow = '1';
    upButton.addEventListener('touchstart', function(e) {
        e.preventDefault();
        keys['ArrowUp'] = true;
        this.classList.add('pressed');
    });
    upButton.addEventListener('touchend', function(e) {
        e.preventDefault();
        keys['ArrowUp'] = false;
        this.classList.remove('pressed');
    });
    upButton.addEventListener('mousedown', function(e) {
        e.preventDefault();
        keys['ArrowUp'] = true;
        this.classList.add('pressed');
    });
    upButton.addEventListener('mouseup', function(e) {
        e.preventDefault();
        keys['ArrowUp'] = false;
        this.classList.remove('pressed');
    });
    upButton.addEventListener('mouseleave', function(e) {
        keys['ArrowUp'] = false;
        this.classList.remove('pressed');
    });

            // Create left button (middle left)
    const leftButton = document.createElement('button');
    leftButton.innerHTML = '←';
    leftButton.className = 'mobile-control-button';
    leftButton.style.gridColumn = '1';
    leftButton.style.gridRow = '2';
    leftButton.addEventListener('touchstart', function(e) {
        e.preventDefault();
        keys['ArrowLeft'] = true;
        this.classList.add('pressed');
    });
    leftButton.addEventListener('touchend', function(e) {
        e.preventDefault();
        keys['ArrowLeft'] = false;
        this.classList.remove('pressed');
    });
    leftButton.addEventListener('mousedown', function(e) {
        e.preventDefault();
        keys['ArrowLeft'] = true;
        this.classList.add('pressed');
    });
    leftButton.addEventListener('mouseup', function(e) {
        e.preventDefault();
        keys['ArrowLeft'] = false;
        this.classList.remove('pressed');
    });
    leftButton.addEventListener('mouseleave', function(e) {
        keys['ArrowLeft'] = false;
        this.classList.remove('pressed');
    });

            // Create down button (bottom center)
    const downButton = document.createElement('button');
    downButton.innerHTML = '↓';
    downButton.className = 'mobile-control-button';
    downButton.style.gridColumn = '2';
    downButton.style.gridRow = '3';
    downButton.addEventListener('touchstart', function(e) {
        e.preventDefault();
        keys['ArrowDown'] = true;
        this.classList.add('pressed');
    });
    downButton.addEventListener('touchend', function(e) {
        e.preventDefault();
        keys['ArrowDown'] = false;
        this.classList.remove('pressed');
    });
    downButton.addEventListener('mousedown', function(e) {
        e.preventDefault();
        keys['ArrowDown'] = true;
        this.classList.add('pressed');
    });
    downButton.addEventListener('mouseup', function(e) {
        e.preventDefault();
        keys['ArrowDown'] = false;
        this.classList.remove('pressed');
    });
    downButton.addEventListener('mouseleave', function(e) {
        keys['ArrowDown'] = false;
        this.classList.remove('pressed');
    });

            // Create right button (middle right)
    const rightButton = document.createElement('button');
    rightButton.innerHTML = '→';
    rightButton.className = 'mobile-control-button';
    rightButton.style.gridColumn = '3';
    rightButton.style.gridRow = '2';
    rightButton.addEventListener('touchstart', function(e) {
        e.preventDefault();
        keys['ArrowRight'] = true;
        this.classList.add('pressed');
    });
    rightButton.addEventListener('touchend', function(e) {
        e.preventDefault();
        keys['ArrowRight'] = false;
        this.classList.remove('pressed');
    });
    rightButton.addEventListener('mousedown', function(e) {
        e.preventDefault();
        keys['ArrowRight'] = true;
        this.classList.add('pressed');
    });
    rightButton.addEventListener('mouseup', function(e) {
        e.preventDefault();
        keys['ArrowRight'] = false;
        this.classList.remove('pressed');
    });
    rightButton.addEventListener('mouseleave', function(e) {
        keys['ArrowRight'] = false;
        this.classList.remove('pressed');
    });

    // Add buttons to arrow pad
    arrowPad.appendChild(upButton);
    arrowPad.appendChild(leftButton);
    arrowPad.appendChild(downButton);
    arrowPad.appendChild(rightButton);

    // Add arrow pad to controls container
    controlsContainer.appendChild(arrowPad);

    // Add controls to the game container
    document.getElementById('game-container').appendChild(controlsContainer);
}

function checkCameraZone() {
    const x = player.position.x;

    if (x > DRAMATIC_CAMERA_TRIGGER_X && cameraMode !== "dramatic") {
        cameraMode = "dramatic";
    } else if (x <= DRAMATIC_CAMERA_TRIGGER_X && cameraMode !== "iso") {
        cameraMode = "iso";
    }
}

function updateCameraPosition() {
    const target = new THREE.Vector3().copy(player.position);

    let offset;

    if (cameraMode === "iso") {
        offset = isoCameraOffset;
    } else {
        offset = dramaticCameraOffset;
    }

    const desiredPos = new THREE.Vector3(
        player.position.x + offset.x,
        player.position.y + offset.y,
        player.position.z + offset.z
    );

    camera.position.lerp(desiredPos, 0.05);
    camera.lookAt(player.position);
}

// Load all textures including wall textures
function loadAllTextures() {
    let loaded = 0;
    const totalTextures = 7; // 2 ground + 5 wall textures

    function checkLoaded() {
        loaded++;
        if (loaded === totalTextures) {
            createGround();
        }
    }

    // Load ground textures
    groundTexture1 = textureLoader.load('assets/ground1.png', checkLoaded);
    groundTexture2 = textureLoader.load('assets/ground2.png', checkLoaded);

    // Load wall textures in order: rock1, rock2, rock3, snow, ice
    wallTextures.push(textureLoader.load('assets/rock1.png', checkLoaded));
    wallTextures.push(textureLoader.load('assets/rock2.png', checkLoaded));
    wallTextures.push(textureLoader.load('assets/rock3.png', checkLoaded));
    wallTextures.push(textureLoader.load('assets/snow.png', checkLoaded));
    wallTextures.push(textureLoader.load('assets/ice.png', checkLoaded));
}

function smoothFogTransition() {
    const x = player.position.x;

    // Normalize X into 0 → 1 across the maze width
    const t = (x + (MAZE_SIZE * TILE_SIZE) / 2) / (MAZE_SIZE * TILE_SIZE);

    // Define region boundaries
    const rockEnd = 1/3;
    const snowEnd = 2/3;

    // Fog colors for each region
    const rockFog = new THREE.Color(0x000000);   // darkest
    const snowFog = new THREE.Color(0x222233);   // dim cool
    const iceFog  = new THREE.Color(0x335577);   // dim cold blue

    let targetColor;

    // Smooth transitions using THREE.MathUtils.smoothstep
    if (t < rockEnd) {
        targetColor = rockFog.clone();
    } else if (t < snowEnd) {
        const blend = THREE.MathUtils.smoothstep(t, rockEnd, snowEnd);
        targetColor = rockFog.clone().lerp(snowFog, blend);
    } else {
        const blend = THREE.MathUtils.smoothstep(t, snowEnd, 1.0);
        targetColor = snowFog.clone().lerp(iceFog, blend);
    }

    // Apply the fog color
    scene.fog.color.lerp(targetColor, 0.05); // smooth over time

    let targetDensity;

    if (t < rockEnd) {
        targetDensity = 0.04; // darkest region
    } else if (t < snowEnd) {
        const blend = THREE.MathUtils.smoothstep(t, rockEnd, snowEnd);
        targetDensity = THREE.MathUtils.lerp(0.04, 0.03, blend); // slightly thinner
    } else {
        const blend = THREE.MathUtils.smoothstep(t, snowEnd, 1.0);
        targetDensity = THREE.MathUtils.lerp(0.03, 0.025, blend); // thinnest in ice
    }

    // Smooth density transition
    scene.fog.density += (targetDensity - scene.fog.density) * 0.05;
}

// Create the ground plane with alternating textures
function createGround() {
    // Check if all textures are loaded
    if (!groundTexture1 || !groundTexture2 || wallTextures.length < 5) return;

    // Clear any existing ground
    if (ground) {
        scene.remove(ground);
    }

    // Create a group to hold multiple ground planes
    const groundGroup = new THREE.Group();

    // Create 4 ground planes with alternating textures
    const planeSize = 30; // Half of the total ground size
    const positions = [
        {x: -15, z: -15, texture: groundTexture1},
        {x: -15, z: 15, texture: groundTexture2},
        {x: 15, z: -15, texture: groundTexture2},
        {x: 15, z: 15, texture: groundTexture1}
    ];

    for (let i = 0; i < 4; i++) {
        const pos = positions[i];
        const geometry = new THREE.PlaneGeometry(planeSize, planeSize);
        const material = new THREE.MeshStandardMaterial({
            map: pos.texture,
            color: 0x888888,
            roughness: 0.8,
            metalness: 0.2,
            side: THREE.DoubleSide
        });

        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2;
        plane.position.set(pos.x, -0.1, pos.z);
        plane.receiveShadow = true;
        groundGroup.add(plane);
    }

    scene.add(groundGroup);
    ground = groundGroup;

    // Now create the rest of the game elements
    createPlayer();
    createMaze();
    createCoins();
    createSnowRegionParticles();
    createIceShimmerParticles();
    addRegionLighting();
    addRegionBrightness();

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Handle keyboard input
    document.addEventListener('keydown', (event) => {
        keys[event.key] = true;
    });

    document.addEventListener('keyup', (event) => {
        keys[event.key] = false;
    });

    // Start the game loop
    animate();
}

function createTorch(x, z) {
    const torch = new THREE.Group();

    const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x553311 })
    );
    stick.position.y = 0.75;
    torch.add(stick);

    // Region-based flame color
    const t = (x / (MAZE_SIZE * TILE_SIZE)) + 0.5; // normalize roughly -0.5..0.5 → 0..1
    let color;

    if (t < 1 / 3) {
        color = 0xffaa55; // warm rock
    } else if (t < 2 / 3) {
        color = 0xffddaa; // softer snow
    } else {
        color = 0xaaddff; // cold ice
    }

    // Visible flame mesh
    const flameGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const flameMat = new THREE.MeshBasicMaterial({
        color: 0xffaa55,
        transparent: true,
        opacity: 0.9
    });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.position.y = 1.5;
    torch.add(flameMesh);
    torch.flameMesh = flameMesh;

    const heatPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 1.2),
        heatShader.clone()
    );
    heatPlane.position.y = 1.2;
    heatPlane.rotation.y = Math.random() * Math.PI;
    torch.add(heatPlane);
    torch.heatPlane = heatPlane;

    const flame = new THREE.PointLight(color, 1, 10);
    flame.position.y = 1.5;
    torch.add(flame);

    torch.flame = flame;
    torch.position.set(x, 0, z);
    scene.add(torch);

    return torch;
}

function updateTorches() {
    for (const torch of torches) {
        const f = torch.flame;

        // Light flicker
        f.intensity = 1 + Math.random() * 0.3;
        f.position.x += (Math.random() - 0.5) * 0.02;
        f.position.z += (Math.random() - 0.5) * 0.02;

        // Flame mesh flicker (scale + slight color shift)
        const s = 1 + Math.random() * 0.2;
        torch.flameMesh.scale.set(s, s, s);

        const hueShift = 0xffaa55 + Math.floor(Math.random() * 0x002200);
        torch.flameMesh.material.color.setHex(hueShift);
    }
}

function updateHeatDistortion(delta) {
    for (const torch of torches) {
        torch.heatPlane.material.uniforms.time.value += delta;
    }
}

function getBlendedRegionMaterial(x) {
    const t = x / (MAZE_SIZE - 1); // 0 → 1 across maze
    const rockEnd = 1 / 3;
    const snowEnd = 2 / 3;
    const blendWidth = 0.08; // how wide the transition bands are

    let type;

    if (t < rockEnd - blendWidth) {
        type = 'rock';
    } else if (t < rockEnd + blendWidth) {
        // Rock → Snow blend band
        const pNext = THREE.MathUtils.smoothstep(t, rockEnd - blendWidth, rockEnd + blendWidth);
        type = Math.random() < pNext ? 'snow' : 'rock';
    } else if (t < snowEnd - blendWidth) {
        type = 'snow';
    } else if (t < snowEnd + blendWidth) {
        // Snow → Ice blend band
        const pNext = THREE.MathUtils.smoothstep(t, snowEnd - blendWidth, snowEnd + blendWidth);
        type = Math.random() < pNext ? 'ice' : 'snow';
    } else {
        type = 'ice';
    }

    if (type === 'rock') {
        const rockIndex = Math.floor(Math.random() * 3);
        return new THREE.MeshStandardMaterial({
            map: wallTextures[rockIndex],
            color: 0x888888,
            roughness: 0.8
        });
    }

    if (type === 'snow') {
        return new THREE.MeshStandardMaterial({
            map: wallTextures[3],
            color: 0xccccff,
            roughness: 0.8
        });
    }

    // ice
    return new THREE.MeshStandardMaterial({
        map: wallTextures[4],
        color: 0xaaeeff,
        roughness: 0.3,
        metalness: 0.3
    });
}

function addRegionLighting() {
    const regionWidth = MAZE_SIZE * TILE_SIZE / 3;

    // Rock region light (warm)
    const warmLight = new THREE.HemisphereLight(0xffbb88, 0x222222, 0.6);
    warmLight.position.set(-regionWidth, 10, 0);
    scene.add(warmLight);

    // Snow region light (neutral cool)
    const coolLight = new THREE.HemisphereLight(0xddddff, 0x222244, 0.5);
    coolLight.position.set(0, 10, 0);
    scene.add(coolLight);

    // Ice region light (cold blue)
    const coldLight = new THREE.HemisphereLight(0xaaddff, 0x224466, 0.7);
    coldLight.position.set(regionWidth, 10, 0);
    scene.add(coldLight);
}

function addRegionBrightness() {
    const regionWidth = MAZE_SIZE * TILE_SIZE / 3;

    // Snow region brightness
    const snowLight = new THREE.PointLight(0xffffff, 0.4, regionWidth * 2);
    snowLight.position.set(0, 20, 0);
    scene.add(snowLight);

    // Ice region brightness
    const iceLight = new THREE.PointLight(0xaaddff, 0.5, regionWidth * 2);
    iceLight.position.set(regionWidth, 20, 0);
    scene.add(iceLight);

    // Rock region stays dark — no extra light added
}

// Create the maze using 3D mesh tiles
function createMaze() {
    const grid = generateMazeGrid(MAZE_SIZE);

    for (let x = 0; x < MAZE_SIZE; x++) {
        for (let z = 0; z < MAZE_SIZE; z++) {
            if (grid[x][z] === 1) {
                const material = getBlendedRegionMaterial(x);
                const wall = new THREE.Mesh(
                    new THREE.BoxGeometry(TILE_SIZE, 2, TILE_SIZE),
                    material
                );
                wall.position.set(
                    (x - MAZE_SIZE / 2) * TILE_SIZE,
                    1,
                    (z - MAZE_SIZE / 2) * TILE_SIZE
                );
                wall.castShadow = true;
                scene.add(wall);
                walls.push(wall);
            } else {
                // Place torches occasionally
                if (Math.random() < 0.03) {
                    const wx = (x - MAZE_SIZE / 2) * TILE_SIZE;
                    const wz = (z - MAZE_SIZE / 2) * TILE_SIZE;
                    torches.push(createTorch(wx, wz));
                }
            }
        }
    }

    // Set player start on first open tile
    for (let x = 0; x < MAZE_SIZE; x++) {
        for (let z = 0; z < MAZE_SIZE; z++) {
            if (grid[x][z] === 0) {
                player.position.set(
                    (x - MAZE_SIZE / 2) * TILE_SIZE,
                    0.5,
                    (z - MAZE_SIZE / 2) * TILE_SIZE
                );
                return;
            }
        }
    }
}

function generateMazeGrid(size) {
    const grid = [];

    // Initialize all walls
    for (let x = 0; x < size; x++) {
        grid[x] = [];
        for (let z = 0; z < size; z++) {
            grid[x][z] = 1; // 1 = wall, 0 = path
        }
    }

    function carve(x, z) {
        const dirs = [
            [2, 0],
            [-2, 0],
            [0, 2],
            [0, -2]
        ].sort(() => Math.random() - 0.5);

        for (const [dx, dz] of dirs) {
            const nx = x + dx;
            const nz = z + dz;

            if (nx > 0 && nx < size - 1 && nz > 0 && nz < size - 1 && grid[nx][nz] === 1) {
                grid[nx][nz] = 0;
                grid[x + dx / 2][z + dz / 2] = 0;
                carve(nx, nz);
            }
        }
    }

    // Start in the middle
    grid[1][1] = 0;
    carve(1, 1);

    return grid;
}

function determineRegion(x, z, mazeSize) {
    if (x < mazeSize / 3) {
        return 'rock';
    } else if (x < 2 * mazeSize / 3) {
        return 'snow';
    } else {
        return 'ice';
    }
}

// Create the player
function createPlayer() {
    // Clear any existing player
    if (player) {
        scene.remove(player);
    }

    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        roughness: 0.5
    });
    player = new THREE.Mesh(geometry, material);
    player.position.set(0, 0.5, 0);
    player.castShadow = true;

    // Add player light
    const playerLight = new THREE.PointLight(0xffffff, 1, 70);
    playerLight.castShadow = true;
    player.add(playerLight);

    scene.add(player);
    playerInitialized = true;
}

// Update player position based on keyboard input with boundary checking
function updatePlayerPosition() {
    const speed = 0.1;
    const newPosition = player.position.clone();

    if (keys['ArrowUp']) {
        newPosition.z -= speed;
        // Check north boundary
        if (newPosition.z < -MAP_BOUNDARY) {
            newPosition.z = -MAP_BOUNDARY;
        }
    }
    if (keys['ArrowDown']) {
        newPosition.z += speed;
        // Check south boundary
        if (newPosition.z > MAP_BOUNDARY) {
            newPosition.z = MAP_BOUNDARY;
        }
    }
    if (keys['ArrowLeft']) {
        newPosition.x -= speed;
        // Check west boundary
        if (newPosition.x < -MAP_BOUNDARY) {
            newPosition.x = -MAP_BOUNDARY;
        }
    }
    if (keys['ArrowRight']) {
        newPosition.x += speed;
        // Check east boundary
        if (newPosition.x > MAP_BOUNDARY) {
            newPosition.x = MAP_BOUNDARY;
        }
    }

    // Check for collisions with walls
    if (!checkWallCollisions(newPosition)) {
        player.position.copy(newPosition);
    }
}

// Check for collisions between the player and walls
function checkWallCollisions(newPosition) {
    for (const wall of walls) {
        // Calculate distance between player and wall
        const dx = newPosition.x - wall.position.x;
        const dz = newPosition.z - wall.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        // Get wall dimensions
        const wallSize = wall.geometry.parameters;
        const wallHalfWidth = wallSize.width ? wallSize.width/2 : wallSize.x/2;
        const wallHalfDepth = wallSize.depth ? wallSize.depth/2 : wallSize.z/2;

        // Check if player is within collision range of the wall
        if (distance < 1.5 + Math.max(wallHalfWidth, wallHalfDepth)) {
            return true; // Collision detected
        }
    }
    return false; // No collision
}

function determineRegion(x, z, mazeSize) {
    if (x < mazeSize / 3) {
        return 'rock';
    } else if (x < 2 * mazeSize / 3) {
        return 'snow';
    } else {
        return 'ice';
    }
}

// Create coins
function createCoins() {
    const coinCount = 30;
    const mazeSize = 30;
    const tileSize = 2;

    for (let i = 0; i < coinCount; i++) {
        const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            emissive: 0xFFEE88,
            emissiveIntensity: 0.5
        });
        const coin = new THREE.Mesh(geometry, material);
        coin.position.set(
            (Math.random() * mazeSize - mazeSize / 2) * tileSize,
            0.5,
            (Math.random() * mazeSize - mazeSize / 2) * tileSize
        );
        coin.castShadow = true;
        scene.add(coin);
        coins.push(coin);
    }
}

function createSnowRegionParticles() {
    const count = 400;
    const regionStart = MAZE_SIZE / 3;
    const regionEnd = (MAZE_SIZE / 3) * 2;

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const x = (Math.random() * (regionEnd - regionStart) + regionStart - MAZE_SIZE / 2) * TILE_SIZE;
        const y = Math.random() * 20 + 5;
        const z = (Math.random() * MAZE_SIZE - MAZE_SIZE / 2) * TILE_SIZE;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.15,
        transparent: true,
        opacity: 0.9,
        depthWrite: false
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    snowParticles.push(points);
}

function updateSnowRegionParticles() {
    for (const points of snowParticles) {
        const pos = points.geometry.attributes.position;

        for (let i = 0; i < pos.count; i++) {
            pos.array[i * 3 + 1] -= 0.05 + Math.random() * 0.05; // fall speed
            pos.array[i * 3] += (Math.random() - 0.5) * 0.02;    // drift
            pos.array[i * 3 + 2] += (Math.random() - 0.5) * 0.02;

            if (pos.array[i * 3 + 1] < 0) {
                pos.array[i * 3 + 1] = Math.random() * 20 + 5;
            }
        }

        pos.needsUpdate = true;
    }
}

function createIceShimmerParticles() {
    const count = 250;
    const regionStart = (MAZE_SIZE / 3) * 2;
    const regionEnd = MAZE_SIZE;

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const x = (Math.random() * (regionEnd - regionStart) + regionStart - MAZE_SIZE / 2) * TILE_SIZE;
        const y = Math.random() * 10 + 1;
        const z = (Math.random() * MAZE_SIZE - MAZE_SIZE / 2) * TILE_SIZE;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const points = new THREE.Points(geo, iceSparkleMaterial);
    scene.add(points);

    iceParticles.push(points);
}

function updateIceShimmerParticles() {
    for (const points of iceParticles) {
        const pos = points.geometry.attributes.position;

        for (let i = 0; i < pos.count; i++) {
            pos.array[i * 3 + 1] += 0.02 + Math.random() * 0.02; // float upward

            if (pos.array[i * 3 + 1] > 12) {
                pos.array[i * 3 + 1] = 1 + Math.random() * 2;
            }
        }

        pos.needsUpdate = true;
    }
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Check for collisions between the player and walls
function checkWallCollisions(newPosition) {
    for (const wall of walls) {
        const distance = newPosition.distanceTo(wall.position);
        if (distance < 1.5) { // Adjust this value based on the size of the player and walls
            return true; // Collision detected
        }
    }
    return false; // No collision
}

// Check for collisions between the player and coins
function checkCoinCollisions() {
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        const distance = player.position.distanceTo(coin.position);

        if (distance < 1) {
            scene.remove(coin);
            coins.splice(i, 1);
            score++;
            document.getElementById('score').textContent = `Score: ${score}`;
            coinSound.currentTime = 0;
            coinSound.play();
            break;
        }
    }
}

function emitGlitter() {
    const geo = new THREE.SphereGeometry(0.05, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
        color: 0xaaddff,
        transparent: true,
        opacity: 1.0
    });

    const spark = new THREE.Mesh(geo, mat);

    spark.position.set(
        player.position.x + (Math.random() * 0.2 - 0.1),
        player.position.y + 0.2,
        player.position.z + (Math.random() * 0.2 - 0.1)
    );

    spark.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.01,
        0.02,
        (Math.random() - 0.5) * 0.01
    );

    spark.life = 0.6;

    scene.add(spark);
    glitterTrail.push(spark);
}

function updateGlitter(delta) {
    for (let i = glitterTrail.length - 1; i >= 0; i--) {
        const spark = glitterTrail[i];

        spark.position.add(spark.velocity);
        spark.material.opacity -= delta * 1.5;
        spark.scale.multiplyScalar(1 + delta * 2);

        spark.life -= delta;

        if (spark.life <= 0 || spark.material.opacity <= 0) {
            scene.remove(spark);
            glitterTrail.splice(i, 1);
        }
    }
}

function updateGlitterTrigger(delta) {
    const x = player.position.x;

    const SNOW_END_X = MAP_BOUNDARY / 3;

    const inIceRegion = x > SNOW_END_X;

    if (inIceRegion) {
        if (Math.random() < 0.3) { // frequent sparkles
            emitGlitter();
        }
    }
}

function emitFootprint() {
    const x = player.position.x;

    const ROCK_END_X = -MAP_BOUNDARY / 3;
    const SNOW_END_X = MAP_BOUNDARY / 3;

    const inSnow = x > ROCK_END_X && x < SNOW_END_X;
    if (!inSnow) return;

    const currentPos = new THREE.Vector2(player.position.x, player.position.z);

    if (lastFootprintPos && currentPos.distanceTo(lastFootprintPos) < FOOTPRINT_SPACING) {
        return; // too close to last footprint
    }

    lastFootprintPos = currentPos.clone();

    const geo = new THREE.PlaneGeometry(0.6, 0.9);
    const mat = new THREE.MeshBasicMaterial({
        map: footprintTexture,
        transparent: true,
        opacity: 1.0,
        depthWrite: false
    });

    const fp = new THREE.Mesh(geo, mat);
    fp.rotation.x = -Math.PI / 2;
    fp.position.set(player.position.x, 0.01, player.position.z);
    fp.position.x += (footprintSide === 'left' ? -0.2 : 0.2);
    footprintSide = (footprintSide === 'left') ? 'right' : 'left';

    fp.life = 1.0;

    scene.add(fp);
    footprints.push(fp);
}

function updateFootprints(delta) {
    for (let i = footprints.length - 1; i >= 0; i--) {
        const fp = footprints[i];

        fp.life -= delta * 0.5; // slow fade
        fp.material.opacity = fp.life;

        if (fp.life <= 0) {
            scene.remove(fp);
            footprints.splice(i, 1);
        }
    }
}

function emitGlitterPixel() {
    const x = player.position.x;
    const SNOW_END_X = MAP_BOUNDARY / 3;

    const inIce = x > SNOW_END_X;
    if (!inIce) return;

    const geo = new THREE.PlaneGeometry(0.1, 0.1);
    const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1.0,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const pixel = new THREE.Mesh(geo, mat);
    pixel.position.set(
        player.position.x + (Math.random() - 0.5) * 0.3,
        0.15,
        player.position.z + (Math.random() - 0.5) * 0.3
    );

    pixel.life = 1.0;
    pixel.hue = Math.random(); // start at random color point

    scene.add(pixel);
    glitterPixels.push(pixel);
}

function updateGlitterPixels(delta) {
    for (let i = glitterPixels.length - 1; i >= 0; i--) {
        const p = glitterPixels[i];

        // Color cycle
        p.hue += delta * 0.5;
        if (p.hue > 1) p.hue -= 1;

        const color = new THREE.Color().setHSL(
            0.55 + Math.sin(p.hue * Math.PI * 2) * 0.1, // blue→purple shift
            0.8,
            0.6 + Math.sin(p.hue * Math.PI * 2) * 0.2  // brightness pulse
        );

        p.material.color.copy(color);

        // Fade out
        p.life -= delta * 1.2;
        p.material.opacity = p.life;

        // Slight upward drift
        p.position.y += delta * 0.1;

        if (p.life <= 0) {
            scene.remove(p);
            glitterPixels.splice(i, 1);
        }
    }
}

function playerIsMoving() {
    return keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight'];
}

// Game loop
function animate() {
    const delta = clock.getDelta();

    requestAnimationFrame(animate);

    updatePlayerPosition();
    updateCameraPosition();
    checkCoinCollisions();

    updateSnowRegionParticles();
    updateIceShimmerParticles();
    smoothFogTransition();
    updateHeatDistortion(delta);
    updateTorches();

    //updateGlitterTrigger(delta);
    //updateGlitter(delta);
    if (playerIsMoving()) emitFootprint();
    updateFootprints(delta);
    if (playerIsMoving()) emitGlitterPixel();
    updateGlitterPixels(delta);

    iceSparkleMaterial.uniforms.time.value += delta;

    checkCameraZone();
    updateCameraPosition();

    renderer.render(scene, camera);
}

// Start the game
init();