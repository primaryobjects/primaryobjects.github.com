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
let wallTextures = []; // Array to store all wall textures

// Initialize the game
function init() {
    // Set up the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background

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
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add OrbitControls for mouse-based camera panning (disabled for now)
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enabled = false;

    // Load all textures first
    loadAllTextures();
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

    // Create boundary walls around the edges using maze wall textures
    createBoundaryWalls();

    // Now create the rest of the game elements
    createMaze();
    createPlayer();
    createCoins();
    createSnowflakes();

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

// Create boundary walls around the edges of the map using maze wall textures
function createBoundaryWalls() {
    const wallHeight = 2;
    const wallThickness = 2;
    const boundarySize = (MAZE_SIZE * TILE_SIZE) / 2;

    // Function to determine which texture to use based on position
    function getTextureForPosition(x, z) {
        // Determine which region this position is in
        const normalizedX = ((x + boundarySize) / (MAZE_SIZE * TILE_SIZE)) * MAZE_SIZE;
        const normalizedZ = ((z + boundarySize) / (MAZE_SIZE * TILE_SIZE)) * MAZE_SIZE;

        if (normalizedX < MAZE_SIZE / 3) {
            // Rock region - use random rock texture
            return wallTextures[Math.floor(Math.random() * 3)];
        } else if (normalizedX < 2 * MAZE_SIZE / 3) {
            // Snow region
            return wallTextures[3];
        } else {
            // Ice region
            return wallTextures[4];
        }
    }

    // North wall - use multiple segments with region-appropriate textures
    const northWallSegments = Math.floor(MAZE_SIZE * TILE_SIZE / TILE_SIZE);
    for (let i = 0; i < northWallSegments; i++) {
        const xPos = (-boundarySize + TILE_SIZE/2) + i * TILE_SIZE;
        const zPos = boundarySize + wallThickness/2;

        // Get appropriate texture for this segment's x position
        const texture = getTextureForPosition(xPos, zPos);

        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(TILE_SIZE, wallHeight, wallThickness),
            new THREE.MeshStandardMaterial({
                map: texture,
                color: 0x888888,
                roughness: 0.8
            })
        );
        wall.position.set(xPos, wallHeight/2, zPos);
        wall.castShadow = true;
        scene.add(wall);
        walls.push(wall);
    }

    // South wall
    for (let i = 0; i < northWallSegments; i++) {
        const xPos = (-boundarySize + TILE_SIZE/2) + i * TILE_SIZE;
        const zPos = -boundarySize - wallThickness/2;

        // Get appropriate texture for this segment's x position
        const texture = getTextureForPosition(xPos, zPos);

        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(TILE_SIZE, wallHeight, wallThickness),
            new THREE.MeshStandardMaterial({
                map: texture,
                color: 0x888888,
                roughness: 0.8
            })
        );
        wall.position.set(xPos, wallHeight/2, zPos);
        wall.castShadow = true;
        scene.add(wall);
        walls.push(wall);
    }

    // East wall
    const eastWallSegments = Math.floor(MAZE_SIZE * TILE_SIZE / TILE_SIZE);
    for (let i = 0; i < eastWallSegments; i++) {
        const zPos = (-boundarySize + TILE_SIZE/2) + i * TILE_SIZE;
        const xPos = boundarySize + wallThickness/2;

        // Get appropriate texture for this segment's z position
        const texture = getTextureForPosition(xPos, zPos);

        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, TILE_SIZE),
            new THREE.MeshStandardMaterial({
                map: texture,
                color: 0x888888,
                roughness: 0.8
            })
        );
        wall.position.set(xPos, wallHeight/2, zPos);
        wall.castShadow = true;
        scene.add(wall);
        walls.push(wall);
    }

    // West wall
    for (let i = 0; i < eastWallSegments; i++) {
        const zPos = (-boundarySize + TILE_SIZE/2) + i * TILE_SIZE;
        const xPos = -boundarySize - wallThickness/2;

        // Get appropriate texture for this segment's z position
        const texture = getTextureForPosition(xPos, zPos);

        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, TILE_SIZE),
            new THREE.MeshStandardMaterial({
                map: texture,
                color: 0x888888,
                roughness: 0.8
            })
        );
        wall.position.set(xPos, wallHeight/2, zPos);
        wall.castShadow = true;
        scene.add(wall);
        walls.push(wall);
    }
}

// Create the maze using 3D mesh tiles
function createMaze() {
    const mazeSize = 30;
    const tileSize = 2;

    // Create a grid of tiles for the maze
    for (let x = 0; x < mazeSize; x++) {
        for (let z = 0; z < mazeSize; z++) {
            const region = determineRegion(x, z, mazeSize);
            const isWall = Math.random() > 0.7;

            if (isWall) {
                const geometry = new THREE.BoxGeometry(tileSize, 2, tileSize);
                let material;

                if (region === 'rock') {
                    const rockChoice = Math.floor(Math.random() * 3);
                    material = new THREE.MeshStandardMaterial({
                        map: wallTextures[rockChoice],
                        color: 0x888888,
                        roughness: 0.8
                    });
                } else if (region === 'snow') {
                    material = new THREE.MeshStandardMaterial({
                        map: wallTextures[3],
                        color: 0xccccff,
                        roughness: 0.8
                    });
                } else if (region === 'ice') {
                    material = new THREE.MeshStandardMaterial({
                        map: wallTextures[4],
                        color: 0xaaeeff,
                        roughness: 0.3,
                        metalness: 0.3
                    });
                }

                const wall = new THREE.Mesh(geometry, material);
                wall.position.set((x - mazeSize / 2) * tileSize, 1, (z - mazeSize / 2) * tileSize);
                wall.castShadow = true;
                scene.add(wall);
                walls.push(wall);
            }
        }
    }
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

// Create the maze using 3D mesh tiles
function createMaze() {
    const mazeSize = 30;
    const tileSize = 2;

    // Load textures
    const rockTexture1 = textureLoader.load('assets/rock1.png');
    const rockTexture2 = textureLoader.load('assets/rock2.png');
    const rockTexture3 = textureLoader.load('assets/rock3.png');
    const snowTexture = textureLoader.load('assets/snow.png');
    const iceTexture = textureLoader.load('assets/ice.png');

    // Create a grid of tiles for the maze
    for (let x = 0; x < mazeSize; x++) {
        for (let z = 0; z < mazeSize; z++) {
            const region = determineRegion(x, z, mazeSize);
            const isWall = Math.random() > 0.7;

            if (isWall) {
                const geometry = new THREE.BoxGeometry(tileSize, 2, tileSize);
                let material;

                if (region === 'rock') {
                    const rockChoice = Math.floor(Math.random() * 3);
                    if (rockChoice === 0) {
                        material = new THREE.MeshStandardMaterial({ map: rockTexture1 });
                    } else if (rockChoice === 1) {
                        material = new THREE.MeshStandardMaterial({ map: rockTexture2 });
                    } else {
                        material = new THREE.MeshStandardMaterial({ map: rockTexture3 });
                    }
                } else if (region === 'snow') {
                    material = new THREE.MeshStandardMaterial({ map: snowTexture });
                } else if (region === 'ice') {
                    material = new THREE.MeshStandardMaterial({ map: iceTexture });
                }

                const wall = new THREE.Mesh(geometry, material);
                wall.position.set((x - mazeSize / 2) * tileSize, 1, (z - mazeSize / 2) * tileSize);
                wall.castShadow = true;
                scene.add(wall);
                walls.push(wall);
            }
        }
    }
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

// Create snowflakes
function createSnowflakes() {
    const snowflakeCount = 200;
    const snowflakeGeometry = new THREE.PlaneGeometry(0.5, 0.5);
    const snowflakeMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.8
    });

    for (let i = 0; i < snowflakeCount; i++) {
        const snowflake = new THREE.Mesh(snowflakeGeometry, snowflakeMaterial);
        snowflake.position.set(
            Math.random() * 100 - 50,
            Math.random() * 50,
            Math.random() * 100 - 50
        );
        scene.add(snowflake);
        snowflakes.push(snowflake);
    }
}

// Update snowflakes
function updateSnowflakes() {
    for (const snowflake of snowflakes) {
        snowflake.position.y -= 0.1;
        if (snowflake.position.y < -10) {
            snowflake.position.y = 50;
        }
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

// Update camera position to follow the player
function updateCameraPosition() {
    const targetPosition = new THREE.Vector3();
    targetPosition.copy(player.position);
    targetPosition.y = 15;
    targetPosition.z += 10;

    camera.position.lerp(targetPosition, 0.1);
    camera.lookAt(player.position);
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

// Game loop
function animate() {
    requestAnimationFrame(animate);

    updatePlayerPosition();
    updateCameraPosition();
    checkCoinCollisions();
    updateSnowflakes();

    renderer.render(scene, camera);
}

// Start the game
init();