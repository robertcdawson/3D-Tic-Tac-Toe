// Minimal custom OrbitControls for rotation/zoom:
class OrbitControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = new THREE.Vector3();
    this.enableDamping = false;
    this.dampingFactor = 0.05;
    this._state = { NONE: -1, ROTATE: 0, TOUCH_ROTATE: 1, TOUCH_ZOOM: 2 };
    this.state = this._state.NONE;

    // For rotation
    this.rotateStart = new THREE.Vector2();
    this.rotateEnd = new THREE.Vector2();
    this.rotateDelta = new THREE.Vector2();

    // For touch
    this.touches = { ONE: 0, TWO: 1 };
    this.prevTouches = [new THREE.Vector2(), new THREE.Vector2()];
    this.touchZoomDistanceStart = 0;
    this.touchZoomDistanceEnd = 0;

    // Add listeners
    this.domElement.addEventListener('mousedown', e => this.onMouseDown(e), false);
    this.domElement.addEventListener('wheel', e => this.onMouseWheel(e), false);
    document.addEventListener('mouseup', () => this.state = this._state.NONE, false);
    document.addEventListener('mousemove', e => this.onMouseMove(e), false);

    // Add touch controls
    this.domElement.addEventListener('touchstart', e => this.onTouchStart(e), false);
    this.domElement.addEventListener('touchend', e => this.onTouchEnd(e), false);
    this.domElement.addEventListener('touchmove', e => this.onTouchMove(e), false);

    // Add keyboard controls
    document.addEventListener('keydown', e => this.onKeyDown(e), false);
  }

  onMouseDown(event) {
    event.preventDefault();
    if (event.button === 0) {
      this.state = this._state.ROTATE;
      this.rotateStart.set(event.clientX, event.clientY);
    }
  }

  onMouseMove(event) {
    if (this.state === this._state.ROTATE) {
      this.rotateEnd.set(event.clientX, event.clientY);
      this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);

      const element = this.domElement;
      const radFactor = (2 * Math.PI) / element.clientHeight;
      this.rotateLeft(this.rotateDelta.x * radFactor);
      this.rotateUp(this.rotateDelta.y * radFactor);

      this.rotateStart.copy(this.rotateEnd);
    }
  }

  onTouchStart(event) {
    event.preventDefault();

    switch (event.touches.length) {
      case 1: // One-finger touch: rotate
        this.state = this._state.TOUCH_ROTATE;
        this.rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
        break;
      case 2: // Two-finger touch: zoom
        this.state = this._state.TOUCH_ZOOM;
        const dx = event.touches[0].pageX - event.touches[1].pageX;
        const dy = event.touches[0].pageY - event.touches[1].pageY;
        this.touchZoomDistanceStart = Math.sqrt(dx * dx + dy * dy);
        this.prevTouches[0].set(event.touches[0].pageX, event.touches[0].pageY);
        this.prevTouches[1].set(event.touches[1].pageX, event.touches[1].pageY);
        break;
    }
  }

  onTouchEnd(event) {
    this.state = this._state.NONE;
  }

  onTouchMove(event) {
    event.preventDefault();

    switch (event.touches.length) {
      case 1: // One-finger touch: rotate
        if (this.state === this._state.TOUCH_ROTATE) {
          this.rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
          this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);

          const element = this.domElement;
          const radFactor = (2 * Math.PI) / element.clientHeight;

          // Increase touch sensitivity for better mobile interaction
          const touchSensitivity = 0.8; // Increased from 0.5
          this.rotateLeft(this.rotateDelta.x * radFactor * touchSensitivity);
          this.rotateUp(this.rotateDelta.y * radFactor * touchSensitivity);

          this.rotateStart.copy(this.rotateEnd);
        }
        break;
      case 2: // Two-finger touch: zoom
        if (this.state === this._state.TOUCH_ZOOM) {
          const dx = event.touches[0].pageX - event.touches[1].pageX;
          const dy = event.touches[0].pageY - event.touches[1].pageY;
          this.touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);

          // Increase zoom sensitivity for better mobile interaction
          const zoomSensitivity = 1.2; // Increased sensitivity

          // Calculate zoom factor with enhanced sensitivity
          const factor = Math.pow(this.touchZoomDistanceStart / this.touchZoomDistanceEnd, zoomSensitivity);

          // Apply zoom
          const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
          offset.multiplyScalar(factor);

          // Apply distance limits
          const minDistance = 3;
          const maxDistance = 15;
          const newDistance = offset.length();

          if (newDistance < minDistance) {
            offset.setLength(minDistance);
          } else if (newDistance > maxDistance) {
            offset.setLength(maxDistance);
          }

          this.camera.position.copy(this.target).add(offset);

          // Update start distance for next move
          this.touchZoomDistanceStart = this.touchZoomDistanceEnd;
        }
        break;
    }
  }

  onMouseWheel(event) {
    event.preventDefault();

    // Adjust zoom speed based on device
    const zoomSpeed = 0.1;

    // Get the delta from the event
    // For trackpads, deltaY is typically smaller than mouse wheels
    // We'll normalize the behavior for both input types
    let delta = 0;

    // Check if this is likely a trackpad gesture (smaller, smoother values)
    const isTrackpad = Math.abs(event.deltaY) < 40;

    if (isTrackpad) {
      // For trackpad, use a smaller multiplier to make zooming smoother
      delta = event.deltaY * 0.01;
    } else {
      // For mouse wheel, use the standard approach
      delta = event.deltaY * 0.001;
    }

    // Compute a factor from the delta
    const factor = 1.0 - delta * zoomSpeed;

    // Move camera relative to the target
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
    offset.multiplyScalar(factor);

    // Clamp the distance so the board never becomes too small (or too far)
    const minDistance = 3;
    const maxDistance = 15; // lowered from 50
    const newDistance = offset.length();

    if (newDistance < minDistance) {
      offset.setLength(minDistance);
    } else if (newDistance > maxDistance) {
      offset.setLength(maxDistance);
    }
    this.camera.position.copy(this.target).add(offset);
  }

  rotateLeft(angle) {
    const quaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      angle
    );
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
    offset.applyQuaternion(quaternion);
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
  }

  rotateUp(angle) {
    const quaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      angle
    );
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
    offset.applyQuaternion(quaternion);
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
  }

  onKeyDown(event) {
    const keyStep = 0.1; // Rotation step for arrow keys
    const zoomStep = 0.2; // Zoom step for up/down keys

    switch (event.key) {
      case 'ArrowLeft':
        this.rotateLeft(keyStep);
        break;
      case 'ArrowRight':
        this.rotateLeft(-keyStep);
        break;
      case 'ArrowUp':
        if (event.shiftKey) {
          // Shift+Up for zooming in
          const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
          offset.multiplyScalar(1 - zoomStep);

          // Apply distance limits
          const minDistance = 3;
          const maxDistance = 15;
          const newDistance = offset.length();

          if (newDistance < minDistance) {
            offset.setLength(minDistance);
          } else if (newDistance > maxDistance) {
            offset.setLength(maxDistance);
          }

          this.camera.position.copy(this.target).add(offset);
        } else {
          // Regular Up for rotation
          this.rotateUp(-keyStep);
        }
        break;
      case 'ArrowDown':
        if (event.shiftKey) {
          // Shift+Down for zooming out
          const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
          offset.multiplyScalar(1 + zoomStep);

          // Apply distance limits
          const minDistance = 3;
          const maxDistance = 15;
          const newDistance = offset.length();

          if (newDistance < minDistance) {
            offset.setLength(minDistance);
          } else if (newDistance > maxDistance) {
            offset.setLength(maxDistance);
          }

          this.camera.position.copy(this.target).add(offset);
        } else {
          // Regular Down for rotation
          this.rotateUp(keyStep);
        }
        break;
    }
  }

  update() {
    return false;
  }
}

// Game variables
let currentPlayer = 'X';
let board = Array(3).fill().map(() => Array(3).fill().map(() => Array(3).fill(null)));
let scores = { 'X': 0, 'O': 0 };
let gameActive = true;
let totalMarks = 0;

// Define a constant for mobile breakpoint to match CSS media queries
const MOBILE_BREAKPOINT = 500;

// Sound variables
let soundEnabled = true;
let placeMarkSound, completeLineSound, winGameSound;
let currentSound = null;

// AI settings
let aiEnabled = false;
let aiDifficulty = 'easy';
const aiPlayer = 'O';

// Flag to track if a line was completed on the current move
let lineCompletedThisTurn = false;

// Tracking variables
let lastPlacedMark = null;
let hoveredCube = null;

// Opacity constants
const CUBE_DEFAULT_OPACITY = 0.4;
const CUBE_MARKED_OPACITY = 0.7;

// Three.js variables
let scene, camera, renderer, controls;
let cubes = [];
let highlightedLines = [];
const initialCameraPosition = new THREE.Vector3(5, 5, 5);

// Camera preset positions
const cameraPresets = {
  front: new THREE.Vector3(0, 0, 8),
  top: new THREE.Vector3(0, 8, 0),
  side: new THREE.Vector3(8, 0, 0),
  corner: new THREE.Vector3(5, 5, 5)
};

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  setViewportHeight();
  initGame();
});

// Dynamically set a CSS variable for the viewport height to handle mobile
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', setViewportHeight);

function initGame() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  // Set initial camera position based on device
  if (window.innerWidth <= MOBILE_BREAKPOINT) {
    // For mobile, position camera significantly higher
    camera.position.set(5, 8, 5); // Increased from 6.5 to 8 for a more noticeable shift upward
  } else {
    camera.position.copy(initialCameraPosition);
  }

  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true // Make the renderer background transparent
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('gameContainer').appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 15);
  scene.add(directionalLight);

  // Add a subtle point light at the center for glow effect
  const centerLight = new THREE.PointLight(0x6688ff, 0.5, 10);
  centerLight.position.set(0, 0, 0);
  scene.add(centerLight);

  createGameBoard();

  // Adjust cube position for mobile devices
  adjustCubePositionForMobile();

  // Initialize sound effects
  placeMarkSound = document.getElementById('placeMarkSound');
  completeLineSound = document.getElementById('completeLineSound');
  winGameSound = document.getElementById('winGameSound');

  // Add event listeners to track audio state
  [placeMarkSound, completeLineSound, winGameSound].forEach(sound => {
    if (sound) {
      sound.addEventListener('play', () => {
        console.log(`${sound.id} started playing`);
      });

      sound.addEventListener('ended', () => {
        console.log(`${sound.id} finished playing`);
        if (currentSound === sound) {
          currentSound = null;
        }
      });

      sound.addEventListener('pause', () => {
        console.log(`${sound.id} was paused`);
      });

      // Ensure sounds don't loop
      sound.loop = false;
    }
  });

  // Set up sound toggle
  const soundToggle = document.getElementById('soundEnabled');
  soundToggle.addEventListener('change', function () {
    soundEnabled = this.checked;
  });

  // AI toggle and difficulty
  const aiToggle = document.getElementById('aiEnabled');
  const aiSelect = document.getElementById('aiDifficulty');
  if (aiToggle && aiSelect) {
    aiToggle.addEventListener('change', function () {
      aiEnabled = this.checked;
    });
    aiSelect.addEventListener('change', function () {
      aiDifficulty = this.value;
    });
  }

  // Set up camera preset buttons
  document.getElementById('frontView').addEventListener('click', () => setCameraPreset('front'));
  document.getElementById('topView').addEventListener('click', () => setCameraPreset('top'));
  document.getElementById('sideView').addEventListener('click', () => setCameraPreset('side'));
  document.getElementById('cornerView').addEventListener('click', () => setCameraPreset('corner'));

  window.addEventListener('resize', onWindowResize);
  renderer.domElement.addEventListener('click', onCubeClick);

  // Add touch-specific event for better mobile interaction
  renderer.domElement.addEventListener('touchend', onCubeTouchEnd);

  // Add mousemove event for hover effects
  renderer.domElement.addEventListener('mousemove', onCubeHover);

  // Hook up the two reset buttons
  document.getElementById('resetButton').addEventListener('click', resetGame);
  document.getElementById('resetZoomButton').addEventListener('click', resetZoom);

  // Add event listener for instructions toggle
  const toggleButton = document.getElementById('toggleInstructions');
  const instructionsPanel = document.getElementById('gameInstructions');

  toggleButton.addEventListener('click', () => {
    instructionsPanel.classList.toggle('collapsed');
    // Save preference to localStorage
    localStorage.setItem('instructionsCollapsed', instructionsPanel.classList.contains('collapsed'));
  });

  // Check if instructions were previously collapsed
  if (localStorage.getItem('instructionsCollapsed') === 'true') {
    instructionsPanel.classList.add('collapsed');
  }

  // Auto-collapse instructions on small screens
  if (window.innerWidth <= MOBILE_BREAKPOINT) {
    instructionsPanel.classList.add('collapsed');
  }

  animate();
}

function createGameBoard() {
  const spacing = 1.2;
  const cellSize = 0.8;
  const cubeGeometry = new THREE.BoxGeometry(cellSize, cellSize, cellSize);

  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      for (let z = 0; z < 3; z++) {
        const cubeMaterial = new THREE.MeshPhongMaterial({
          color: 0xffffff,
          opacity: CUBE_DEFAULT_OPACITY,
          transparent: true,
          side: THREE.DoubleSide,
          emissive: 0x222244, // Add subtle emissive glow
          emissiveIntensity: 0.2 // Low intensity for subtle effect
        });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.position.set(
          (x - 1) * spacing,
          (y - 1) * spacing,
          (z - 1) * spacing
        );
        cube.userData = { x, y, z, marked: false, player: null };
        scene.add(cube);
        cubes.push(cube);
      }
    }
  }

  const wireSize = 3.6;
  const wireframeGeometry = new THREE.BoxGeometry(wireSize, wireSize, wireSize);
  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0x4466aa,
    wireframe: true,
    transparent: true,
    opacity: 0.6
  });
  const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
  scene.add(wireframe);

  // Add a subtle outer glow wireframe
  const outerWireSize = 3.8;
  const outerWireGeometry = new THREE.BoxGeometry(outerWireSize, outerWireSize, outerWireSize);
  const outerWireMaterial = new THREE.MeshBasicMaterial({
    color: 0x6688ff,
    wireframe: true,
    transparent: true,
    opacity: 0.2
  });
  const outerWireframe = new THREE.Mesh(outerWireGeometry, outerWireMaterial);
  scene.add(outerWireframe);
}

function resetZoom() {
  const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

  // Reset to center
  controls.target.set(0, 0, 0);

  if (isMobile) {
    camera.position.set(5, 8, 5);
  } else {
    camera.position.copy(initialCameraPosition);
  }

  controls.update();
}

// Define helper function to stop all sounds
function stopAllSounds() {
  console.log("Stopping all sounds");
  // Properly stop all sounds and reset their state
  if (placeMarkSound) {
    placeMarkSound.pause();
    placeMarkSound.currentTime = 0;
    console.log("Stopped placeMarkSound");
  }
  if (completeLineSound) {
    completeLineSound.pause();
    completeLineSound.currentTime = 0;
    console.log("Stopped completeLineSound");
  }
  if (winGameSound) {
    winGameSound.pause();
    winGameSound.currentTime = 0;
    console.log("Stopped winGameSound");
  }
  // Reset the current sound tracking variable
  currentSound = null;
}

// Helper function to play a sound with proper management
function playSound(sound, soundName) {
  if (!soundEnabled) {
    console.log("Sound disabled, not playing");
    return;
  }

  if (!gameActive && soundName !== "winGameSound") {
    console.log("Game not active, only win sound should play");
    return;
  }

  console.log(`Attempting to play ${soundName}`);

  // Check if any sounds are currently playing
  if (areSoundsPlaying()) {
    console.log("Sounds are currently playing, stopping them first");
  }

  // First, ensure all sounds are stopped
  stopAllSounds();

  // Set a small timeout to ensure browser has time to stop previous sounds
  setTimeout(() => {
    // Double-check that sounds are actually stopped
    if (!areSoundsPlaying()) {
      sound.currentTime = 0;

      // Use a Promise to track when the sound starts playing
      const playPromise = sound.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`${soundName} started playing successfully`);
            currentSound = sound;
          })
          .catch(error => {
            console.error(`Error playing ${soundName}:`, error);
          });
      }
    } else {
      console.warn("Could not play sound - previous sounds still playing");
    }
  }, 50); // Small delay to ensure previous sounds are fully stopped
}

function onCubeClick(event) {
  if (!gameActive) {
    console.log("Game not active, ignoring click");
    return;
  }

  // Calculate mouse position relative to the renderer's DOM element
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // Get all intersections
  const intersects = raycaster.intersectObjects(cubes);

  // Only select the first cube hit by the ray, whether marked or not
  if (intersects.length > 0) {
    const selectedCube = intersects[0].object;
    const { x, y, z, marked } = selectedCube.userData;

    // Only proceed if the cube is not already marked
    if (!marked) {
      // Reset the line completed flag for this turn - we'll set it in checkLines if needed
      lineCompletedThisTurn = false;
      console.log("Reset lineCompletedThisTurn to false at start of turn");

      markCube(selectedCube, x, y, z, currentPlayer);

      // Increment total marks
      totalMarks++;

      // Update the remaining cells display
      document.getElementById('remaining').innerText = `Cells remaining: ${27 - totalMarks}`;

      // Check for completed lines - this will set lineCompletedThisTurn if appropriate
      checkLines();

      // Log game state after checking lines
      logGameState();

      // Check if all cells are filled - only end the game when the board is full
      if (totalMarks === 27) {
        endGame();
        return; // Exit early to prevent further processing
      }

      // Play sound based on game state - ensure only one sound plays at a time
      if (soundEnabled) {
        console.log(`Sound enabled, deciding which sound to play. lineCompletedThisTurn=${lineCompletedThisTurn}`);
        // Only play one sound - prioritize line completion sound over place mark sound
        if (lineCompletedThisTurn) {
          console.log("Line completed this turn, playing completion sound");
          playSound(completeLineSound, "completeLineSound");
        } else {
          console.log("No line completed, playing place mark sound");
          playSound(placeMarkSound, "placeMarkSound");
        }
      }

      // If the game continues, switch players
      currentPlayer = (currentPlayer === 'X') ? 'O' : 'X';
      document.getElementById('turn').innerText = `Current turn: ${currentPlayer}`;

      if (aiEnabled && currentPlayer === aiPlayer) {
        setTimeout(makeAIMove, 300);
      }
    }
  }
}

function makeAIMove() {
  if (!aiEnabled || currentPlayer !== aiPlayer || !gameActive) return;

  const move = getAIMove(board, aiDifficulty, aiPlayer);
  if (!move) return;

  const cube = cubes.find(c =>
    c.userData.x === move.x &&
    c.userData.y === move.y &&
    c.userData.z === move.z);

  if (cube && !cube.userData.marked) {
    lineCompletedThisTurn = false;
    markCube(cube, move.x, move.y, move.z, aiPlayer);
    totalMarks++;
    document.getElementById('remaining').innerText = `Cells remaining: ${27 - totalMarks}`;
    checkLines();
    logGameState();
    if (totalMarks === 27) {
      endGame();
      return;
    }
    if (soundEnabled) {
      if (lineCompletedThisTurn) {
        playSound(completeLineSound, "completeLineSound");
      } else {
        playSound(placeMarkSound, "placeMarkSound");
      }
    }
    currentPlayer = (currentPlayer === 'X') ? 'O' : 'X';
    document.getElementById('turn').innerText = `Current turn: ${currentPlayer}`;
  }
}

function markCube(cube, x, y, z, player) {
  board[x][y][z] = player;
  cube.userData.marked = true;
  cube.userData.player = player;

  if (player === 'X') {
    cube.material.color.set(0xff4444);
    cube.material.opacity = CUBE_MARKED_OPACITY;
  } else {
    cube.material.color.set(0x4444ff);
    cube.material.opacity = CUBE_MARKED_OPACITY;
  }

  // Remove pulse animation from previous mark if exists
  if (lastPlacedMark) {
    lastPlacedMark.children.forEach(child => {
      child.scale.set(1, 1, 1);
    });
  }

  let mark;
  if (player === 'X') {
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    mark = new THREE.Group();
    const cylinder1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8),
      material
    );
    cylinder1.rotation.z = Math.PI / 4;
    mark.add(cylinder1);

    const cylinder2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8),
      material
    );
    cylinder2.rotation.z = -Math.PI / 4;
    mark.add(cylinder2);
  } else {
    mark = new THREE.Mesh(
      new THREE.TorusGeometry(0.25, 0.05, 16, 32),
      new THREE.MeshBasicMaterial({ color: 0x0000ff })
    );
  }

  mark.position.copy(cube.position);
  scene.add(mark);

  // Store reference to the last placed mark for pulse animation
  lastPlacedMark = mark;

  if (window.tutorial && window.tutorial.handleMarkPlaced) {
    window.tutorial.handleMarkPlaced();
  }
}

function checkLines() {
  // Store the previous scores to detect if new lines were completed
  const previousScores = { ...scores };

  // Clear existing highlighted lines and reset scores
  highlightedLines.forEach(line => scene.remove(line));
  highlightedLines = [];
  scores = { 'X': 0, 'O': 0 };

  // Track if any new lines were completed this turn
  let newLinesCompleted = false;

  // X lines
  for (let y = 0; y < 3; y++) {
    for (let z = 0; z < 3; z++) {
      if (checkLine([
        { x: 0, y, z },
        { x: 1, y, z },
        { x: 2, y, z }
      ])) newLinesCompleted = true;
    }
  }
  // Y lines
  for (let x = 0; x < 3; x++) {
    for (let z = 0; z < 3; z++) {
      if (checkLine([
        { x, y: 0, z },
        { x, y: 1, z },
        { x, y: 2, z }
      ])) newLinesCompleted = true;
    }
  }
  // Z lines
  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      if (checkLine([
        { x, y, z: 0 },
        { x, y, z: 1 },
        { x, y, z: 2 }
      ])) newLinesCompleted = true;
    }
  }
  // XY diagonals
  for (let z = 0; z < 3; z++) {
    if (checkLine([
      { x: 0, y: 0, z },
      { x: 1, y: 1, z },
      { x: 2, y: 2, z }
    ])) newLinesCompleted = true;
    if (checkLine([
      { x: 2, y: 0, z },
      { x: 1, y: 1, z },
      { x: 0, y: 2, z }
    ])) newLinesCompleted = true;
  }
  // XZ diagonals
  for (let y = 0; y < 3; y++) {
    if (checkLine([
      { x: 0, y, z: 0 },
      { x: 1, y, z: 1 },
      { x: 2, y, z: 2 }
    ])) newLinesCompleted = true;
    if (checkLine([
      { x: 2, y, z: 0 },
      { x: 1, y, z: 1 },
      { x: 0, y, z: 2 }
    ])) newLinesCompleted = true;
  }
  // YZ diagonals
  for (let x = 0; x < 3; x++) {
    if (checkLine([
      { x, y: 0, z: 0 },
      { x, y: 1, z: 1 },
      { x, y: 2, z: 2 }
    ])) newLinesCompleted = true;
    if (checkLine([
      { x, y: 2, z: 0 },
      { x, y: 1, z: 1 },
      { x, y: 0, z: 2 }
    ])) newLinesCompleted = true;
  }
  // Main 3D diagonals
  if (checkLine([
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 1, z: 1 },
    { x: 2, y: 2, z: 2 }
  ])) newLinesCompleted = true;
  if (checkLine([
    { x: 2, y: 0, z: 0 },
    { x: 1, y: 1, z: 1 },
    { x: 0, y: 2, z: 2 }
  ])) newLinesCompleted = true;
  if (checkLine([
    { x: 0, y: 2, z: 0 },
    { x: 1, y: 1, z: 1 },
    { x: 2, y: 0, z: 2 }
  ])) newLinesCompleted = true;
  if (checkLine([
    { x: 2, y: 2, z: 0 },
    { x: 1, y: 1, z: 1 },
    { x: 0, y: 0, z: 2 }
  ])) newLinesCompleted = true;

  // Update the score display with animation
  const scoreXElement = document.getElementById('score-x');
  const scoreOElement = document.getElementById('score-o');

  scoreXElement.innerText = `X: ${scores.X}`;
  scoreOElement.innerText = `O: ${scores.O}`;

  // Add animation class if scores changed
  if (scores.X > previousScores.X) {
    scoreXElement.classList.remove('score-changed');
    // Force a reflow to restart the animation
    void scoreXElement.offsetWidth;
    scoreXElement.classList.add('score-changed');
  }

  if (scores.O > previousScores.O) {
    scoreOElement.classList.remove('score-changed');
    // Force a reflow to restart the animation
    void scoreOElement.offsetWidth;
    scoreOElement.classList.add('score-changed');
  }

  // Check if any NEW lines were completed this turn by comparing with previous scores
  const newXLines = scores.X - previousScores.X;
  const newOLines = scores.O - previousScores.O;

  console.log(`Previous scores: X:${previousScores.X}, O:${previousScores.O}`);
  console.log(`Current scores: X:${scores.X}, O:${scores.O}`);
  console.log(`New lines: X:${newXLines}, O:${newOLines}`);

  // Only set the flag if the CURRENT player completed a new line
  if ((currentPlayer === 'X' && newXLines > 0) || (currentPlayer === 'O' && newOLines > 0)) {
    console.log(`Player ${currentPlayer} completed ${currentPlayer === 'X' ? newXLines : newOLines} new line(s)`);
    lineCompletedThisTurn = true;
  } else {
    console.log("No new lines completed by current player this turn");
    lineCompletedThisTurn = false;
  }

  // Double-check the flag is set correctly
  console.log(`lineCompletedThisTurn is now set to: ${lineCompletedThisTurn}`);
}

function checkLine(positions) {
  const values = positions.map(pos => board[pos.x][pos.y][pos.z]);
  if (values[0] !== null && values[0] === values[1] && values[1] === values[2]) {
    scores[values[0]]++;
    highlightLine(positions, values[0]);
    return true; // Line was completed
  }
  return false; // No line was completed
}

function highlightLine(positions, player) {
  const spacing = 1.2;
  const points = positions.map(pos =>
    new THREE.Vector3(
      (pos.x - 1) * spacing,
      (pos.y - 1) * spacing,
      (pos.z - 1) * spacing
    )
  );
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: player === 'X' ? 0xff0000 : 0x0000ff,
    linewidth: 2
  });
  const line = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(line);
  highlightedLines.push(line);
}

function endGame() {
  // Set gameActive to false immediately to prevent any other sounds from playing
  gameActive = false;
  console.log("Game ended, setting gameActive to false");

  const gameOverPanel = document.getElementById('gameOver');
  const winnerText = document.getElementById('winner');

  // Determine the winner based on the final scores
  if (scores.X > scores.O) {
    winnerText.innerText = `Player X wins!\nX: ${scores.X} - O: ${scores.O}`;
    console.log(`Player X wins with score ${scores.X} vs ${scores.O}`);
  } else if (scores.O > scores.X) {
    winnerText.innerText = `Player O wins!\nX: ${scores.X} - O: ${scores.O}`;
    console.log(`Player O wins with score ${scores.O} vs ${scores.X}`);
  } else {
    winnerText.innerText = `Game ended in a tie!\nX: ${scores.X} - O: ${scores.O}`;
    console.log(`Game ended in a tie with scores ${scores.X} vs ${scores.O}`);
  }

  // Play win sound
  if (soundEnabled) {
    console.log("Playing win game sound");
    playSound(winGameSound, "winGameSound");
  }

  gameOverPanel.classList.remove('hidden');
}

function resetGame() {
  // Stop any currently playing sounds
  console.log("Resetting game, stopping all sounds");
  stopAllSounds();

  // Reset game state
  currentPlayer = 'X';
  board = Array(3).fill().map(() => Array(3).fill().map(() => Array(3).fill(null)));
  scores = { 'X': 0, 'O': 0 };
  gameActive = true;
  totalMarks = 0;
  lineCompletedThisTurn = false;
  lastPlacedMark = null;
  hoveredCube = null;

  // Update UI
  document.getElementById('score-x').innerText = 'X: 0';
  document.getElementById('score-o').innerText = 'O: 0';
  document.getElementById('turn').innerText = 'Current turn: X';
  document.getElementById('remaining').innerText = 'Cells remaining: 27';

  // Hide game over modal
  document.getElementById('gameOver').classList.add('hidden');

  // Reset cube appearance
  cubes.forEach(cube => {
    cube.userData.marked = false;
    cube.userData.player = null;
    cube.material.color.set(0xffffff);
    cube.material.opacity = CUBE_DEFAULT_OPACITY;
  });

  // Remove any highlighted lines
  highlightedLines.forEach(line => scene.remove(line));
  highlightedLines = [];

  // Properly remove all X and O marks from the scene
  const marksToRemove = [];

  // Identify mark objects to remove
  for (let i = 0; i < scene.children.length; i++) {
    const child = scene.children[i];

    // Check if this is an X mark (Group with CylinderGeometry children)
    if (
      child.type === 'Group' &&
      child.children &&
      child.children.length > 0 &&
      child.children[0].geometry &&
      child.children[0].geometry.type === 'CylinderGeometry'
    ) {
      console.log("Removing X mark from scene");
      marksToRemove.push(child);
      continue;
    }

    // Check if this is an O mark (Mesh with TorusGeometry)
    if (
      child.isMesh &&
      child.geometry &&
      child.geometry.type === 'TorusGeometry'
    ) {
      console.log("Removing O mark from scene");
      marksToRemove.push(child);
    }
  }

  // Explicitly remove each mark object from the scene
  marksToRemove.forEach(child => scene.remove(child));

  // Also reset zoom to the default view.
  resetZoom();

  // Ensure the cube position is adjusted for mobile
  adjustCubePositionForMobile();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Auto-collapse instructions on small screens when resizing
  const instructionsPanel = document.getElementById('gameInstructions');
  if (window.innerWidth <= MOBILE_BREAKPOINT && !instructionsPanel.classList.contains('collapsed')) {
    instructionsPanel.classList.add('collapsed');
  }

  // Adjust cube position on mobile
  adjustCubePositionForMobile();
}

// Function to adjust cube position for mobile devices
function adjustCubePositionForMobile() {
  // Get all objects in the scene
  const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

  // Reset to center
  controls.target.set(0, 0, 0);

  // Update camera to look at the new target
  camera.lookAt(controls.target);
}

function animate() {
  requestAnimationFrame(animate);

  // Create a subtle floating effect for the entire game board
  const time = Date.now() * 0.001; // Convert to seconds

  // Apply gentle floating motion to all cubes
  cubes.forEach(cube => {
    // Only apply floating effect if the game is active
    if (gameActive) {
      // Calculate a subtle vertical float based on time
      const floatY = Math.sin(time * 0.3) * 0.015; // Reduced amplitude and frequency

      // Add a very slight rotation for a more "space-like" floating effect
      const floatRotX = Math.sin(time * 0.2) * 0.001; // Reduced from 0.002
      const floatRotZ = Math.cos(time * 0.25) * 0.001; // Reduced from 0.002

      // Get the original position based on the cube's coordinates
      const spacing = 1.2;
      const x = (cube.userData.x - 1) * spacing;
      const y = (cube.userData.y - 1) * spacing;
      const z = (cube.userData.z - 1) * spacing;

      // Apply the floating effect
      cube.position.y = y + floatY;

      // Apply subtle rotation to the entire scene for a space-like floating effect
      scene.rotation.x = floatRotX;
      scene.rotation.z = floatRotZ;
    }
  });

  // Apply pulse animation to the last placed mark
  if (lastPlacedMark && gameActive) {
    const scale = 1 + 0.1 * Math.sin(time * 3); // Oscillate between 0.9 and 1.1

    if (lastPlacedMark.children && lastPlacedMark.children.length > 0) {
      // For X marks (which are a group with cylinders)
      lastPlacedMark.children.forEach(child => {
        child.scale.set(scale, 1, scale);
      });
    } else {
      // For O marks (which are a single mesh)
      lastPlacedMark.scale.set(scale, scale, scale);
    }
  }

  controls.update();
  if (window.tutorial && window.tutorial.checkRotation) {
    window.tutorial.checkRotation();
  }
  renderer.render(scene, camera);
}

// Function to set camera to a preset position
function setCameraPreset(preset) {
  const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

  switch (preset) {
    case 'front':
      camera.position.set(0, 0, 5);
      break;
    case 'back':
      camera.position.set(0, 0, -5);
      break;
    case 'left':
      camera.position.set(-5, 0, 0);
      break;
    case 'right':
      camera.position.set(5, 0, 0);
      break;
    case 'top':
      camera.position.set(0, 5, 0);
      break;
    case 'bottom':
      camera.position.set(0, -5, 0);
      break;
  }

  // Reset to center
  controls.target.set(0, 0, 0);

  // Ensure the camera is looking at the center after repositioning
  camera.lookAt(controls.target);

  controls.update();
  if (window.tutorial && window.tutorial.handlePresetUsed) {
    window.tutorial.handlePresetUsed();
  }
}

// Function to handle cube hover effects
function onCubeHover(event) {
  if (!gameActive) return;

  // Calculate mouse position relative to the renderer's DOM element
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // Get all intersections
  const intersects = raycaster.intersectObjects(cubes);

  // Remove hover effect from previously hovered cube
  if (hoveredCube && hoveredCube.userData && !hoveredCube.userData.marked) {
    hoveredCube.material.opacity = CUBE_DEFAULT_OPACITY;
    hoveredCube.material.color.set(0xffffff);
  }

  // Apply hover effect to currently hovered cube
  if (intersects.length > 0) {
    const selectedCube = intersects[0].object;
    if (!selectedCube.userData.marked) {
      hoveredCube = selectedCube;
      hoveredCube.material.opacity = 0.6;

      // Show preview color based on current player
      if (currentPlayer === 'X') {
        hoveredCube.material.color.set(0xffcccc); // Light red
      } else {
        hoveredCube.material.color.set(0xccccff); // Light blue
      }
    }
  } else {
    hoveredCube = null;
  }
}

// Helper function to check if any sounds are currently playing
function areSoundsPlaying() {
  const playing = {
    placeMarkSound: placeMarkSound && !placeMarkSound.paused,
    completeLineSound: completeLineSound && !completeLineSound.paused,
    winGameSound: winGameSound && !winGameSound.paused
  };

  console.log("Sound status:", playing);
  return playing.placeMarkSound || playing.completeLineSound || playing.winGameSound;
}

// Debug function to log the current game state
function logGameState() {
  console.log("=== GAME STATE ===");
  console.log(`Current Player: ${currentPlayer}`);
  console.log(`Game Active: ${gameActive}`);
  console.log(`Total Marks: ${totalMarks}`);
  console.log(`Scores: X:${scores.X}, O:${scores.O}`);
  console.log(`Line Completed This Turn: ${lineCompletedThisTurn}`);
  console.log("==================");
}

// Add a touch-specific handler for cube selection
function onCubeTouchEnd(event) {
  if (!gameActive || event.touches.length > 0) {
    return;
  }

  // Prevent default to avoid double-firing with click events
  event.preventDefault();

  // Get the last touch position
  const touch = event.changedTouches[0];

  // Calculate touch position relative to the renderer's DOM element
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((touch.clientX - rect.left) / rect.width) * 2 - 1,
    -((touch.clientY - rect.top) / rect.height) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // Get all intersections
  const intersects = raycaster.intersectObjects(cubes);

  // Only select the first cube hit by the ray, whether marked or not
  if (intersects.length > 0) {
    const selectedCube = intersects[0].object;
    const { x, y, z, marked } = selectedCube.userData;

    // Only proceed if the cube is not already marked
    if (!marked) {
      // Reset the line completed flag for this turn
      lineCompletedThisTurn = false;

      markCube(selectedCube, x, y, z, currentPlayer);

      // Increment total marks
      totalMarks++;

      // Update the remaining cells display
      document.getElementById('remaining').innerText = `Cells remaining: ${27 - totalMarks}`;

      // Check for completed lines
      checkLines();

      // Log game state after checking lines
      logGameState();

      // Check if all cells are filled
      if (totalMarks === 27) {
        endGame();
        return;
      }

      // Play sound based on game state
      if (soundEnabled) {
        if (lineCompletedThisTurn) {
          playSound(completeLineSound, "completeLineSound");
        } else {
          playSound(placeMarkSound, "placeMarkSound");
        }
      }

      // Switch players
      currentPlayer = (currentPlayer === 'X') ? 'O' : 'X';
      document.getElementById('turn').innerText = `Current turn: ${currentPlayer}`;

      if (aiEnabled && currentPlayer === aiPlayer) {
        setTimeout(makeAIMove, 300);
      }
    }
  }
}