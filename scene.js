// Three.js 3D Scene Setup - Minimal Clean Version
let scene, camera, renderer, controls;
let desk, monitor, keyboard, mouse, decorations;
let raycaster, pointer;
let hoveredObject = null;
let isAnimating = false;
let balloonMesh, balloonWobbleTime = 0;
let steamParticles = [];

const loadingScreen = document.getElementById('loadingScreen');
const tooltip = document.getElementById('hoverTooltip');

const TAP_MOVE_THRESHOLD = 12;
const TAP_TIME_THRESHOLD = 500;
let pointerStart = null;
let pointerStartTime = 0;

function init() {
    console.log('Scene created');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 15, 35);

    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 6.4, 13.2);
    camera.lookAt(0, 1.2, 0.3);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.7);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    scene.add(mainLight);

    const leftLight = new THREE.PointLight(0xff8866, 0.4, 20);
    leftLight.position.set(-3, 4, 0);
    scene.add(leftLight);

    const rightLight = new THREE.PointLight(0x6688ff, 0.3, 20);
    rightLight.position.set(3, 4, 0);
    scene.add(rightLight);

    const monitorLight = new THREE.PointLight(0x44aaff, 0.5, 8);
    monitorLight.position.set(0, 2.5, 0);
    scene.add(monitorLight);

    createFloor();
    createStuccoWall();
    createDesk();
    createMonitor();
    createKeyboard();
    createMouse();
    createSmallDecorations();
    createLamp();
    createTallPlant();
    createCoffeeMug();
    createTablet();
    createKeyboardBacklight();
    createFloatingParticles();
    createWallPoster();
    createJukebox();
    createFloorMat();
    createOfficeChair();
    createLobbyChair();

    camera.position.set(0, 6.4, 13.2);
    camera.lookAt(0, 1.2, 0.3);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.2, 0.3);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 9;
    controls.maxDistance = 22;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI / 5;
    controls.maxPolarAngle = Math.PI / 2.35;
    controls.minAzimuthAngle = -Math.PI / 3.2;
    controls.maxAzimuthAngle = Math.PI / 3.2;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown, { passive: false });
    renderer.domElement.addEventListener('pointerup', onPointerUp, { passive: false });
    renderer.domElement.addEventListener('pointercancel', onPointerCancel, { passive: false });

    setTimeout(() => {
        console.log('Hiding loading screen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            console.log('Scene fully loaded!');
        }, 500);
    }, 1000);

    animate();
}
