// Three.js 3D Scene Setup - Minimal Clean Version
let scene, camera, renderer, controls;
let desk, monitor, keyboard, mouse, decorations;
let raycaster, pointer;
let isAnimating = false;
let hoveredObject = null;

const tooltip = document.getElementById('hoverTooltip');
const loadingScreen = document.getElementById('loadingScreen');

function init() {
    console.log('Init function called');

    // Scene
    scene = new THREE.Scene();
    console.log('Scene created');
    scene.background = new THREE.Color(0x383838);
    scene.fog = new THREE.Fog(0x383838, 20, 50);

    // Camera - zoomed out view matching user screenshot
    camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 4.8, 10.8);
    camera.lookAt(0, 2.0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Raycaster
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();

    // Lights - warm ambient lighting for dark anthracite theme
    const ambientLight = new THREE.AmbientLight(0x505050, 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffe8d0, 0.8);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    // Warm accent lights
    const leftLight = new THREE.PointLight(0xffd4a3, 0.4, 12);
    leftLight.position.set(-3, 4, 0);
    scene.add(leftLight);

    const rightLight = new THREE.PointLight(0xffcb8e, 0.4, 12);
    rightLight.position.set(3, 4, 0);
    scene.add(rightLight);

    // Monitor glow
    const monitorLight = new THREE.PointLight(0x4dabf7, 0.5, 6);
    monitorLight.position.set(0, 2.5, 0);
    scene.add(monitorLight);

    // Create objects
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

    // Controls - natural closer view
    camera.position.set(0, 4.8, 10.5);
    camera.lookAt(0, 1.8, 0);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.8, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 7;
    controls.maxDistance = 20;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI / 6;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.minAzimuthAngle = -Math.PI / 4;
    controls.maxAzimuthAngle = Math.PI / 4;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('click', onPointerClick);

    // Hide loading
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

function createFloor() {
    const floorGeometry = new THREE.PlaneGeometry(15, 15);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x252525,
        roughness: 0.8,
        metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);
}

function createStuccoWall() {
    // Dark anthracite grey rough stucco finish
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark anthracite grey base color
    ctx.fillStyle = '#383838';
    ctx.fillRect(0, 0, 512, 512);

    // Add rough stucco texture with random dots and variations
    for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = Math.random() * 2.5 + 0.8;
        const brightness = Math.floor(Math.random() * 30 - 15);
        ctx.fillStyle = `rgba(${56 + brightness}, ${56 + brightness}, ${56 + brightness}, ${Math.random() * 0.25 + 0.12})`;
        ctx.fillRect(x, y, size, size);
    }

    // Add larger roughness patches for depth and texture
    for (let i = 0; i < 300; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = Math.random() * 12 + 5;
        const brightness = Math.floor(Math.random() * 25 - 12);
        ctx.fillStyle = `rgba(${56 + brightness}, ${56 + brightness}, ${56 + brightness}, ${Math.random() * 0.15 + 0.05})`;
        ctx.fillRect(x, y, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);

    const wallMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.95,
        metalness: 0.0
    });

    // Back wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(15, 8), wallMaterial);
    backWall.position.set(0, 4, -3);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(15, 8), wallMaterial.clone());
    leftWall.material.map = texture.clone();
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-7.5, 4, 4.5);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(15, 8), wallMaterial.clone());
    rightWall.material.map = texture.clone();
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(7.5, 4, 4.5);
    rightWall.receiveShadow = true;
    scene.add(rightWall);
}

function createDesk() {
    desk = new THREE.Group();

    const desktopMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.3,
        metalness: 0.4
    });

    // Main desktop
    const mainTop = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.08, 1.2),
        desktopMaterial
    );
    mainTop.position.set(0, 1.2, 0);
    mainTop.castShadow = true;
    mainTop.receiveShadow = true;
    desk.add(mainTop);

    // Drawers
    const drawerMaterial = new THREE.MeshStandardMaterial({
        color: 0x0f0f0f,
        roughness: 0.3,
        metalness: 0.5
    });

    const drawerGeometry = new THREE.BoxGeometry(0.7, 0.3, 0.5);
    const drawerPositions = [
        [-0.9, 1.01, 0.15],
        [-0.9, 0.71, 0.15],
        [-0.9, 0.41, 0.15]
    ];

    drawerPositions.forEach((pos) => {
        const drawer = new THREE.Mesh(drawerGeometry, drawerMaterial);
        drawer.position.set(...pos);
        drawer.castShadow = true;
        drawer.receiveShadow = true;
        desk.add(drawer);

        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.25, 16),
            new THREE.MeshStandardMaterial({
                color: 0xb8860b,
                roughness: 0.2,
                metalness: 0.8
            })
        );
        handle.rotation.z = Math.PI / 2;
        handle.position.set(-0.9, pos[1], 0.4);
        handle.castShadow = true;
        desk.add(handle);
    });

    // Side panels
    const panelMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.3,
        metalness: 0.4
    });

    const leftPanel = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 1.16, 1.2),
        panelMaterial
    );
    leftPanel.position.set(-1.25, 0.58, 0);
    leftPanel.castShadow = true;
    leftPanel.receiveShadow = true;
    desk.add(leftPanel);

    const rightPanel = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 1.16, 1.2),
        panelMaterial
    );
    rightPanel.position.set(1.25, 0.58, 0);
    rightPanel.castShadow = true;
    rightPanel.receiveShadow = true;
    desk.add(rightPanel);

    // Closer to the wall
    desk.position.set(0, 0, 0.15);
    scene.add(desk);
}

let lampBulb, lampLight, isLampOn = true;

function createLamp() {
    const lamp = new THREE.Group();

    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.4, metalness: 0.7 });
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.6 });

    // Base
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.15, 0.06, 32),
        baseMaterial
    );
    base.position.set(0, 0.03, 0);
    base.castShadow = true;
    lamp.add(base);

    // Pole
    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 1.75, 16),
        poleMaterial
    );
    pole.position.set(0, 0.90, 0);
    pole.castShadow = true;
    lamp.add(pole);

    // Head
    const head = new THREE.Mesh(
        new THREE.CylinderGeometry(0.065, 0.065, 0.26, 32),
        poleMaterial
    );
    head.position.set(0, 1.76, 0);
    head.rotation.z = -Math.PI / 4.2;
    head.castShadow = true;
    lamp.add(head);

    // Bulb
    lampBulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.065, 32, 32),
        new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xffa500,
            emissiveIntensity: 1.3,
            roughness: 0.2
        })
    );
    lampBulb.position.set(-0.10, 1.62, 0);
    lampBulb.castShadow = true;
    lamp.add(lampBulb);

    // Light
    lampLight = new THREE.PointLight(0xffb347, 1.0, 4.5);
    lampLight.position.set(-0.10, 1.62, 0);
    lampLight.castShadow = true;
    lamp.add(lampLight);

    lamp.userData = { interactive: true, name: 'lamp' };
    lamp.children.forEach(c => c.userData = { interactive: true, name: 'lamp' });

    // Position: right side, further back so it doesn’t sit on the desk
    lamp.position.set(1.55, 0, 0.55);
    scene.add(lamp);
}

function createMonitor() {
    monitor = new THREE.Group();

    // Stand
    const stand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.15, 0.06, 32),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.3, metalness: 0.7 })
    );
    stand.position.set(0, 1.27, -0.35);
    stand.castShadow = true;

    // Neck
    const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.3, metalness: 0.7 })
    );
    neck.position.set(0, 1.48, -0.35);
    neck.castShadow = true;

    // Frame
    const frame = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.85, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.2, metalness: 0.6 })
    );
    frame.position.set(0, 1.85, -0.37);
    frame.castShadow = true;
    frame.userData = { interactive: true, name: 'computer' };

    // ===== Screen =====
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 1024;
    screenCanvas.height = 640;
    const ctx = screenCanvas.getContext('2d');

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, 1024, 640);

    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 0, 1024, 48);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(12, 8, 180, 40);
    ctx.fillStyle = '#58a6ff';
    ctx.fillRect(12, 44, 180, 3);

    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillStyle = '#e6edf3';
    ctx.fillText('portfolio.tsx', 28, 34);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 48, 70, 592);
    ctx.strokeStyle = '#21262d';
    ctx.beginPath();
    ctx.moveTo(70, 48);
    ctx.lineTo(70, 640);
    ctx.stroke();

    const codeLines = [
        { num: 1,  parts: [{ text: 'import', color: '#ff7b72' }, { text: ' { useEffect, useState } ', color: '#e6edf3' }, { text: 'from', color: '#ff7b72' }, { text: " 'react'", color: '#a5d6ff' }] },
        { num: 2,  parts: [{ text: '', color: '#e6edf3' }] },
        { num: 3,  parts: [{ text: 'const', color: '#ff7b72' }, { text: ' Portfolio', color: '#d2a8ff' }, { text: ' = () => {', color: '#e6edf3' }] },
        { num: 4,  parts: [{ text: '  const', color: '#ff7b72' }, { text: ' [active, setActive]', color: '#e6edf3' }, { text: ' = useState(0)', color: '#e6edf3' }] },
        { num: 5,  parts: [{ text: '  const', color: '#ff7b72' }, { text: ' roles = [', color: '#e6edf3' }, { text: "'Developer'", color: '#a5d6ff' }, { text: ', ', color: '#e6edf3' }, { text: "'Designer'", color: '#a5d6ff' }, { text: ']', color: '#e6edf3' }] },
        { num: 6,  parts: [{ text: '', color: '#e6edf3' }] },
        { num: 7,  parts: [{ text: '  return (', color: '#e6edf3' }] },
        { num: 8,  parts: [{ text: '    <div', color: '#7ee787' }, { text: ' className=', color: '#79c0ff' }, { text: '"hero"', color: '#a5d6ff' }, { text: '>', color: '#7ee787' }] },
        { num: 9,  parts: [{ text: '      <h1>', color: '#7ee787' }, { text: 'Vincent Tapoc', color: '#e6edf3' }, { text: '</h1>', color: '#7ee787' }] },
        { num: 10, parts: [{ text: '      <Code lines={roles} />', color: '#e6edf3' }] },
        { num: 11, parts: [{ text: '    </div>', color: '#7ee787' }] },
        { num: 12, parts: [{ text: '  )', color: '#e6edf3' }] },
        { num: 13, parts: [{ text: '}', color: '#e6edf3' }] },
        { num: 14, parts: [{ text: '', color: '#e6edf3' }] },
        { num: 15, parts: [{ text: 'export default Portfolio', color: '#ff7b72' }] }
    ];

    const lineHeight = 34;
    const startY = 82;

    codeLines.forEach((line, i) => {
        const y = startY + i * lineHeight;
        ctx.font = '20px "JetBrains Mono", monospace';
        ctx.fillStyle = '#484f58';
        ctx.textAlign = 'right';
        ctx.fillText(String(line.num), 55, y);

        ctx.textAlign = 'left';
        let x = 90;
        line.parts.forEach(part => {
            ctx.fillStyle = part.color;
            ctx.fillText(part.text, x, y);
            x += ctx.measureText(part.text).width;
        });
    });

    ctx.fillStyle = 'rgba(88, 166, 255, 0.12)';
    ctx.fillRect(70, startY + 8 * lineHeight - 24, 954, lineHeight);

    const screenTexture = new THREE.CanvasTexture(screenCanvas);

    const screen = new THREE.Mesh(
        new THREE.BoxGeometry(1.08, 0.66, 0.02),
        new THREE.MeshStandardMaterial({
            map: screenTexture,
            emissive: 0x111111,
            emissiveIntensity: 0.25,
            roughness: 0.4,
            metalness: 0.1
        })
    );
    screen.position.set(0, 1.85, -0.31);
    screen.userData = { interactive: true, name: 'computer' };

    // ===== Notification Badge (!) on top-right edge =====
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 128;
    badgeCanvas.height = 128;
    const bctx = badgeCanvas.getContext('2d');

    // Red circle background
    bctx.beginPath();
    bctx.arc(64, 64, 52, 0, Math.PI * 2);
    bctx.fillStyle = '#ff2b2b';
    bctx.fill();

    // White border
    bctx.beginPath();
    bctx.arc(64, 64, 52, 0, Math.PI * 2);
    bctx.lineWidth = 6;
    bctx.strokeStyle = '#ffffff';
    bctx.stroke();

    // Exclamation mark
    bctx.font = 'bold 72px Arial';
    bctx.fillStyle = '#ffffff';
    bctx.textAlign = 'center';
    bctx.textBaseline = 'middle';
    bctx.fillText('!', 64, 68);

    const badgeTexture = new THREE.CanvasTexture(badgeCanvas);

    const badgeMaterial = new THREE.MeshBasicMaterial({
        map: badgeTexture,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide
    });

    const badge = new THREE.Mesh(
        new THREE.PlaneGeometry(0.22, 0.22),
        badgeMaterial
    );

    // Outside the monitor – top right corner
badge.position.set(0.62, 2.28, -0.28);
    badge.userData = { isMonitorGlow: true };

    // Small light for the badge
    const badgeLight = new THREE.PointLight(0xff3333, 0.45, 1.8);
    badgeLight.position.copy(badge.position);
    badgeLight.userData = { isMonitorLight: true };

    // Add everything to the monitor
    monitor.add(stand, neck, frame, screen, badge, badgeLight);
    desk.add(monitor);
}

let keyboardLight;
const keyboardColors = [0x4488ff, 0xff44cc, 0x00ffaa, 0xffaa00, 0xffd700];
let keyboardColorIndex = 0;

function createKeyboard() {
    keyboard = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.03, 0.25),
        new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.5,
            metalness: 0.3
        })
    );
    keyboard.position.set(0, 1.255, 0.25);
    keyboard.castShadow = true;
    keyboard.userData = { interactive: true, name: 'keyboard' };
    desk.add(keyboard);

    // Keys
    const keys = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.01, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0a })
    );
    keys.position.set(0, 1.275, 0.25);
    keys.userData = { interactive: true, name: 'keyboard' };
    desk.add(keys);
}

function createKeyboardBacklight() {
    keyboardLight = new THREE.PointLight(keyboardColors[0], 0.35, 1.2);
    keyboardLight.position.set(0, 1.28, 0.25);
    desk.add(keyboardLight);
}

function createFloatingParticles() {
    const particleCount = 40;
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    for (let i = 0; i < particleCount; i++) {
        positions.push(
            (Math.random() - 0.5) * 6,
            Math.random() * 3 + 0.5,
            (Math.random() - 0.5) * 4
        );
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.025,
        transparent: true,
        opacity: 0.35,
        depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // simple animation
    function animateParticles() {
        const positions = geometry.attributes.position.array;
        for (let i = 1; i < positions.length; i += 3) {
            positions[i] += 0.0015;
            if (positions[i] > 4) positions[i] = 0.5;
        }
        geometry.attributes.position.needsUpdate = true;
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
}



function createMouse() {
    mouse = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.025, 0.09),
        new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.5,
            metalness: 0.3
        })
    );
    mouse.position.set(0.65, 1.255, 0.28);
    mouse.castShadow = true;
    desk.add(mouse);
}

let steamParticles = [];
let tabletScreenMesh, tabletCanvas, tabletCtx, tabletTexture, tabletNoteIndex = 0;
const tabletNotes = [
    { title: 'Notes', items: ['• Fix portfolio glow', '• Add new projects', '• Update contact info', '• Deploy to Vercel'] },
    { title: 'Tech Stack', items: ['• React / Next.js', '• Three.js / WebGL', '• TypeScript & Tailwind', '• Node.js & Express'] },
    { title: 'Status', items: ['• Location: Manila, PH', '• Availability: Immediate', '• Focus: Frontend & Vibe', '• Email: connect@bosstcode.com'] }
];

function drawTabletNote(pageIndex) {
    if (!tabletCtx) return;
    const page = tabletNotes[pageIndex % tabletNotes.length];
    tabletCtx.fillStyle = '#0d1117';
    tabletCtx.fillRect(0, 0, 512, 768);

    // Top bar
    tabletCtx.fillStyle = '#161b22';
    tabletCtx.fillRect(0, 0, 512, 60);

    tabletCtx.fillStyle = '#e6edf3';
    tabletCtx.font = 'bold 24px Arial';
    tabletCtx.fillText(page.title, 30, 40);

    // Content
    tabletCtx.fillStyle = '#8b949e';
    tabletCtx.font = '20px Arial';
    page.items.forEach((item, idx) => {
        tabletCtx.fillText(item, 30, 120 + idx * 45);
    });

    tabletCtx.fillStyle = '#58a6ff';
    tabletCtx.fillText('Vincent Tapoc', 30, 420);
    tabletCtx.fillStyle = '#ff7b72';
    tabletCtx.font = '16px Arial';
    tabletCtx.fillText('(Click tablet to switch notes)', 30, 460);

    if (tabletTexture) tabletTexture.needsUpdate = true;
}

function createCoffeeMug() {
    const mug = new THREE.Group();

    // Body
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.065, 0.14, 32),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.2 })
    );
    body.position.y = 0.07;
    body.castShadow = true;
    mug.add(body);

    // Handle - properly aligned vertical C-shape attached to mug wall
    const handle = new THREE.Mesh(
        new THREE.TorusGeometry(0.04, 0.011, 16, 32, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.2 })
    );
    handle.position.set(0.065, 0.07, 0);
    handle.rotation.z = -Math.PI / 2;
    handle.castShadow = true;
    mug.add(handle);

    // Coffee surface
    const coffee = new THREE.Mesh(
        new THREE.CircleGeometry(0.06, 32),
        new THREE.MeshStandardMaterial({
            color: 0x3d2314,
            roughness: 0.8,
            emissive: 0x1a0f08,
            emissiveIntensity: 0.1
        })
    );
    coffee.rotation.x = -Math.PI / 2;
    coffee.position.y = 0.135;
    mug.add(coffee);

    // Rising steam particles
    steamParticles = [];
    const steamGroup = new THREE.Group();
    for (let i = 0; i < 10; i++) {
        const p = new THREE.Mesh(
            new THREE.SphereGeometry(0.007 + Math.random() * 0.005, 8, 8),
            new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.15 + Math.random() * 0.2,
                roughness: 1
            })
        );
        p.position.set((Math.random() - 0.5) * 0.06, 0.14 + Math.random() * 0.12, (Math.random() - 0.5) * 0.06);
        p.userData = { speed: 0.001 + Math.random() * 0.001, offset: Math.random() * Math.PI * 2 };
        steamParticles.push(p);
        steamGroup.add(p);
    }
    mug.add(steamGroup);

    mug.userData = { interactive: true, name: 'coffeeMug' };
    mug.children.forEach(c => c.userData = { interactive: true, name: 'coffeeMug' });

    mug.position.set(0.95, 1.24, 0.28);
    mug.rotation.y = -Math.PI / 4;
    desk.add(mug);
}

function createTablet() {
    const tablet = new THREE.Group();

    // Stand base
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.02, 0.11),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4, metalness: 0.5 })
    );
    base.position.y = 0.01;
    base.castShadow = true;
    tablet.add(base);

    // Stand neck
    const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.013, 0.18, 16),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.6 })
    );
    neck.position.y = 0.10;
    neck.castShadow = true;
    tablet.add(neck);

    // Tablet body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.42, 0.016),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.6 })
    );
    body.position.set(0, 0.36, 0);
    body.castShadow = true;
    tablet.add(body);

    // Screen with dynamic notes canvas
    tabletCanvas = document.createElement('canvas');
    tabletCanvas.width = 512;
    tabletCanvas.height = 768;
    tabletCtx = tabletCanvas.getContext('2d');

    tabletTexture = new THREE.CanvasTexture(tabletCanvas);
    drawTabletNote(0);

    tabletScreenMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.25, 0.38),
        new THREE.MeshStandardMaterial({
            map: tabletTexture,
            emissive: 0x111111,
            emissiveIntensity: 0.25
        })
    );
    tabletScreenMesh.position.set(0, 0.36, 0.01);
    tablet.add(tabletScreenMesh);

    tablet.userData = { interactive: true, name: 'tablet' };
    tablet.children.forEach(c => c.userData = { interactive: true, name: 'tablet' });

    // Position: right side of the main monitor
    tablet.position.set(0.85, 1.2, -0.25);
    tablet.rotation.y = -0.3;
    desk.add(tablet);
}


function createSmallDecorations() {
    const paperTexts = ['README.md', 'TODO', 'NOTES', 'API', 'CODE'];
    const randomTexts = ['function init()', 'const data = {};', '// Fix bug', 'deploy', 'class App', 'render()', 'useEffect()'];

    decorations = new THREE.Group();

    const stackBaseY = 1.245;
    const stackX = -0.80;
    const stackZ = 0.10;
    const yStep = 0.008;

    for (let i = 0; i < 3; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#f2f2f2';
        ctx.fillRect(0, 0, 256, 256);

        ctx.strokeStyle = '#b0b0b0';
        ctx.lineWidth = 2;
        ctx.strokeRect(6, 6, 244, 244);

        ctx.fillStyle = '#1c1c1c';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(paperTexts[i % paperTexts.length], 20, 40);

        ctx.font = '14px monospace';
        ctx.fillStyle = '#3e3e3e';
        for (let j = 0; j < 5; j++) {
            const line = randomTexts[Math.floor(Math.random() * randomTexts.length)];
            ctx.fillText(line, 20, 75 + j * 28);
        }

        const texture = new THREE.CanvasTexture(canvas);
        const paper = new THREE.Mesh(
            new THREE.BoxGeometry(0.38, 0.006, 0.28),
            new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.9,
                metalness: 0.0
            })
        );

        paper.position.set(stackX, stackBaseY + i * yStep, stackZ);
        paper.rotation.y = (i - 1) * 0.1;
        paper.castShadow = true;
        decorations.add(paper);
    }

    desk.add(decorations);
}

function createWallPoster() {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.3, metalness: 0.5 });
    const frameZ = -2.9;
    const planeZ = -2.87;

    // ===== 1. LEFT POSTER (Abstract Bauhaus Red Sun Art - Smaller 0.75x0.55) =====
    const sideWidth = 0.75;
    const sideHeight = 0.55;
    const sideInnerW = 0.67;
    const sideInnerH = 0.47;
    const sideY = 2.65;

    const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(sideWidth, sideHeight, 0.04), frameMat);
    leftFrame.position.set(-2.1, sideY, frameZ);
    leftFrame.castShadow = true;
    scene.add(leftFrame);

    const leftCanvas = document.createElement('canvas');
    leftCanvas.width = 512;
    leftCanvas.height = 400;
    const lctx = leftCanvas.getContext('2d');

    lctx.fillStyle = '#171717';
    lctx.fillRect(0, 0, 512, 400);

    // Cartoon-style Albert Einstein portrait
    lctx.fillStyle = '#f1d5b3';
    lctx.beginPath();
    lctx.ellipse(255, 170, 70, 92, 0, 0, Math.PI * 2);
    lctx.fill();

    // Hair and iconic wild hair
    lctx.fillStyle = '#d7b387';
    lctx.beginPath();
    lctx.moveTo(180, 95);
    lctx.lineTo(210, 34);
    lctx.lineTo(240, 80);
    lctx.lineTo(260, 22);
    lctx.lineTo(290, 82);
    lctx.lineTo(318, 38);
    lctx.lineTo(342, 95);
    lctx.lineTo(180, 95);
    lctx.fill();

    // Mustache and eyebrows
    lctx.fillStyle = '#6f4b2d';
    lctx.fillRect(195, 192, 28, 10);
    lctx.fillRect(290, 192, 28, 10);
    lctx.fillRect(210, 210, 95, 12);

    // Eyes and smile
    lctx.fillStyle = '#2c1f16';
    lctx.fillRect(220, 170, 16, 8);
    lctx.fillRect(278, 170, 16, 8);
    lctx.strokeStyle = '#3d281d';
    lctx.lineWidth = 4;
    lctx.beginPath();
    lctx.arc(255, 216, 32, 0.1, Math.PI - 0.1);
    lctx.stroke();

    // Simple red scientific notation text
    lctx.fillStyle = '#d53a2f';
    lctx.font = 'bold 28px sans-serif';
    lctx.textAlign = 'center';
    lctx.fillText('E = mc²', 256, 310);
    lctx.font = '18px sans-serif';
    lctx.fillText('GENIUS', 256, 340);

    const leftPoster = new THREE.Mesh(
        new THREE.PlaneGeometry(sideInnerW, sideInnerH),
        new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(leftCanvas), roughness: 0.5 })
    );
    leftPoster.position.set(-2.1, sideY, planeZ);
    scene.add(leftPoster);

    // ===== 2. MIDDLE POSTER (TSCO Logo - HERO MONITOR-SIZED: 1.30x0.85) =====
    const mainWidth = 1.30;
    const mainHeight = 0.85;
    const mainInnerW = 1.20;
    const mainInnerH = 0.75;
    const mainY = 2.80;

    const midFrame = new THREE.Mesh(new THREE.BoxGeometry(mainWidth, mainHeight, 0.04), frameMat);
    midFrame.position.set(0.0, mainY, frameZ);
    midFrame.castShadow = true;
    scene.add(midFrame);

    const midCanvas = document.createElement('canvas');
    midCanvas.width = 1024;
    midCanvas.height = 640;
    const mctx = midCanvas.getContext('2d');

    mctx.fillStyle = '#0a0a0a';
    mctx.fillRect(0, 0, 1024, 640);

    mctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    mctx.lineWidth = 4;
    mctx.strokeRect(28, 28, 968, 584);

    mctx.fillStyle = '#ffffff';
    mctx.font = 'bold 84px Arial';
    mctx.textAlign = 'center';
    mctx.fillText('TSCO', 512, 300);

    mctx.font = 'bold 34px Arial';
    mctx.fillStyle = '#ff4d4d';
    mctx.fillText('Vincent Tapoc', 512, 390);

    const midPoster = new THREE.Mesh(
        new THREE.PlaneGeometry(mainInnerW, mainInnerH),
        new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(midCanvas) })
    );
    midPoster.position.set(0.0, mainY, planeZ);
    scene.add(midPoster);

    // ===== 3. RIGHT POSTER (Cartoon Mona Lisa with Red Palette) =====
    const rightFrame = new THREE.Mesh(new THREE.BoxGeometry(sideWidth, sideHeight, 0.04), frameMat);
    rightFrame.position.set(2.1, sideY, frameZ);
    rightFrame.castShadow = true;
    scene.add(rightFrame);

    const rightCanvas = document.createElement('canvas');
    rightCanvas.width = 512;
    rightCanvas.height = 400;
    const rctx = rightCanvas.getContext('2d');

    rctx.fillStyle = '#1f1212';
    rctx.fillRect(0, 0, 512, 400);

    // warm red vignette backdrop
    const redGrad = rctx.createRadialGradient(255, 170, 10, 255, 170, 240);
    redGrad.addColorStop(0, 'rgba(170, 40, 35, 0.95)');
    redGrad.addColorStop(0.5, 'rgba(85, 18, 18, 0.9)');
    redGrad.addColorStop(1, 'rgba(25, 10, 10, 0)');
    rctx.fillStyle = redGrad;
    rctx.fillRect(0, 0, 512, 400);

    // cartoon portrait face
    rctx.fillStyle = '#f2d0b2';
    rctx.beginPath();
    rctx.ellipse(258, 180, 94, 110, 0, 0, Math.PI * 2);
    rctx.fill();

    // hair / dark veil
    rctx.fillStyle = '#4a1f1d';
    rctx.beginPath();
    rctx.moveTo(198, 115);
    rctx.quadraticCurveTo(260, 40, 338, 120);
    rctx.lineTo(322, 190);
    rctx.quadraticCurveTo(260, 150, 200, 185);
    rctx.closePath();
    rctx.fill();

    // eyes
    rctx.fillStyle = '#2e1d1b';
    rctx.fillRect(220, 175, 18, 9);
    rctx.fillRect(276, 175, 18, 9);

    // smile / subtle Mona Lisa expression
    rctx.strokeStyle = '#7a352f';
    rctx.lineWidth = 5;
    rctx.beginPath();
    rctx.arc(257, 220, 32, 0.15, Math.PI - 0.15);
    rctx.stroke();

    // red outfit / dress
    rctx.fillStyle = '#be2a2a';
    rctx.beginPath();
    rctx.moveTo(188, 305);
    rctx.quadraticCurveTo(260, 258, 334, 305);
    rctx.lineTo(314, 380);
    rctx.lineTo(197, 380);
    rctx.closePath();
    rctx.fill();

    rctx.fillStyle = '#f6d7c9';
    rctx.font = 'bold 30px serif';
    rctx.textAlign = 'center';
    rctx.fillText('LA JOLLA', 256, 338);

    const rightPoster = new THREE.Mesh(
        new THREE.PlaneGeometry(sideInnerW, sideInnerH),
        new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(rightCanvas), roughness: 0.5 })
    );
    rightPoster.position.set(2.1, sideY, planeZ);
    scene.add(rightPoster);
}

// ===== 3D Old-School Retro Jukebox =====
let jukebox, jukeboxLight, jukeboxBulb, jukeboxBulbLight, vinylDisc, isJukeboxPlaying = false;

function updateJukeboxBulbState() {
    if (!jukeboxBulb || !jukeboxBulb.material) return;

    const bulbMat = jukeboxBulb.material;
    const isOn = isJukeboxPlaying;
    const bodyColor = new THREE.Color(0x000000);
    const glowIdle = new THREE.Color(0xffc76b);
    const glowActive = new THREE.Color(0xffd27a);

    bulbMat.color.copy(bodyColor);
    bulbMat.emissive.copy(isOn ? glowActive : glowIdle);
    bulbMat.emissiveIntensity = isOn ? 1.1 : 0.35;

    if (jukeboxBulbLight) {
        jukeboxBulbLight.color.copy(isOn ? glowActive : glowIdle);
        jukeboxBulbLight.intensity = isOn ? 0.9 : 0.25;
        jukeboxBulbLight.distance = isOn ? 6.5 : 4.5;
    }
}

function removeDuplicateJukeboxObjects() {
    if (!scene) return;

    const oldObjects = [];
    scene.traverse((obj) => {
        if (!obj || obj === scene) return;
        const name = (obj.name || '').toLowerCase();
        if (name === 'jukebox' || name.includes('jukebox') || name.includes('cabinet')) {
            oldObjects.push(obj);
        }
    });

    oldObjects.forEach((obj) => {
        if (obj.parent) obj.parent.remove(obj);
    });
}

function createJukebox() {
  jukebox = new THREE.Group();

  const scale = 1.8;

  // Cabinet body — solid black
  const cabinetMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    roughness: 0.6,
    metalness: 0.2
  });
  const cabinetW = 0.6 * scale, cabinetH = 1.0 * scale, cabinetD = 0.35 * scale;
  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(cabinetW, cabinetH, cabinetD), cabinetMat);
  cabinet.position.set(0, cabinetH / 2, 0);
  jukebox.add(cabinet);

  // Arch — white, opening upward
  const archMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.8,
    roughness: 0.3
  });
  const archRadius = 0.28 * scale;
  const archGeo = new THREE.TorusGeometry(archRadius, 0.03 * scale, 16, 32, Math.PI);
  const arch = new THREE.Mesh(archGeo, archMat);
  arch.position.set(0, cabinetH + 0.02, cabinetD * 0.15);
  jukebox.add(arch);

  // Dome-style bulb mounted directly on top of the frame, like a classic raised lamp cap
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: 0xffc76b,
    emissiveIntensity: 0.35,
    roughness: 0.35,
    metalness: 0.2
  });
  jukeboxBulb = new THREE.Mesh(new THREE.SphereGeometry(0.105 * scale, 28, 28, 0, Math.PI * 2, 0, Math.PI / 1.8), bulbMat);
  jukeboxBulb.position.set(0, cabinetH + 0.02, cabinetD * 0.18);
  jukeboxBulb.scale.set(2.05, 1.22, 1.45);
  jukeboxBulb.rotation.x = -Math.PI * 0.2;
  jukebox.add(jukeboxBulb);

  jukeboxBulbLight = new THREE.PointLight(0xffd27a, 0.85, 7.5);
  jukeboxBulbLight.position.set(0, cabinetH + 0.05, cabinetD * 0.2);
  jukebox.add(jukeboxBulbLight);
  updateJukeboxBulbState();

  // Glass panel — lightened up so the vinyl inside is actually visible
  // (opacity raised from 0.25 to 0.4, color lightened from near-black to a lighter gray,
  //  transmission increased so more light passes through)
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x2a2a2a,
    transparent: true,
    opacity: 0.4,
    roughness: 0.05,
    transmission: 0.85,
    metalness: 0
  });
  const glassWindow = new THREE.Mesh(
    new THREE.BoxGeometry(0.42 * scale, 0.32 * scale, 0.02),
    glassMat
  );
  glassWindow.position.set(0, cabinetH * 0.65, cabinetD / 2 + 0.005);
  jukebox.add(glassWindow);

  // Small dedicated light INSIDE the cabinet, aimed at the vinyl, so it's actually lit and visible
  const vinylLight = new THREE.PointLight(0xffffff, 0.6, 1.0);
  vinylLight.position.set(0, cabinetH * 0.65, cabinetD / 2 - 0.05);
  jukebox.add(vinylLight);

  // Inner glow — reduced opacity slightly so it accents rather than washes out the vinyl
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xff2b2b,
    transparent: true,
    opacity: 0.1
  });
  const innerGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.38 * scale, 0.28 * scale), glowMat);
  innerGlow.position.set(0, cabinetH * 0.65, cabinetD / 2 - 0.01);
  jukebox.add(innerGlow);

  // Vinyl disc — brighter material so it reads clearly through the lightened glass
  vinylDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.11 * scale, 32),
    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.2, metalness: 0.8 })
  );
  vinylDisc.position.set(0, cabinetH * 0.65, cabinetD / 2 + 0.015);
  jukebox.add(vinylDisc);

  // Grille bars
  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.5,
    metalness: 0.4
  });
  for (let i = 0; i < 4; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.42 * scale, 0.022 * scale, 0.02), grilleMat);
    bar.position.set(0, (0.20 + i * 0.08) * scale, cabinetD / 2 + 0.005);
    jukebox.add(bar);
  }

  // Soft red accent light (exterior)
  jukeboxLight = new THREE.PointLight(0xff2b2b, 0.4, 3.0);
  jukeboxLight.position.set(0, cabinetH * 0.7, cabinetD);
  jukebox.add(jukeboxLight);

  jukebox.userData = { interactive: true, name: 'jukebox' };
  jukebox.children.forEach(c => c.userData = { interactive: true, name: 'jukebox' });

  // Position it close to the right wall, directly under the third poster
  jukebox.position.set(2.15, 0, -1.75);
  jukebox.rotation.y = 0;
  scene.add(jukebox);

  return jukebox;
}
window.playJukeboxBeats = function(enabled) {
    if (window.__jukeboxJazzTimer) {
        clearInterval(window.__jukeboxJazzTimer);
        window.__jukeboxJazzTimer = null;
    }

    if (!enabled) return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const audioCtx = window.__jukeboxJazzCtx || new AudioCtx();
    window.__jukeboxJazzCtx = audioCtx;

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const progression = [174.61, 196.0, 220.0, 246.94, 220.0, 196.0, 174.61, 146.83];
    let step = 0;

    function playJazzNote(freq, start, duration, type, amp, pan = 0) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const panner = audioCtx.createStereoPanner();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(amp, start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        panner.pan.setValueAtTime(pan, start);

        osc.connect(gain);
        gain.connect(panner);
        panner.connect(audioCtx.destination);

        osc.start(start);
        osc.stop(start + duration);
    }

    function playSoftNoise(start) {
        const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.2, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.03;
        }

        const source = audioCtx.createBufferSource();
        const gain = audioCtx.createGain();
        const panner = audioCtx.createStereoPanner();

        source.buffer = buffer;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.015, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);

        panner.pan.setValueAtTime(0.1, start);

        source.connect(gain);
        gain.connect(panner);
        panner.connect(audioCtx.destination);

        source.start(start);
        source.stop(start + 0.2);
    }

    window.__jukeboxJazzTimer = setInterval(() => {
        const now = audioCtx.currentTime;
        const root = progression[step % progression.length];
        const voicing = [root, root * 1.25, root * 1.5];

        voicing.forEach((freq, i) => {
            const pan = (i - 1) * 0.18;
            playJazzNote(freq, now + i * 0.04, 0.9, 'triangle', 0.02 + i * 0.006, pan);
        });

        if (step % 2 === 0) {
            playJazzNote(root / 2, now, 0.85, 'sine', 0.02, -0.12);
        }

        if (step % 3 === 0) {
            playSoftNoise(now + 0.05);
        }

        step += 1;
    }, 520);
};

// Balloon interactive variables
let balloonMesh, balloonMaterial, balloonWobbleTime = 0, balloonColorIndex = 0;
const balloonColors = [0xd94747, 0x00e5ff, 0xffd700, 0xa855f7, 0x10b981];

function createTallPlant() {
    const plantGroup = new THREE.Group();

    const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.22, 0.35, 32),
        new THREE.MeshStandardMaterial({
            color: 0x2d2d2d,
            roughness: 0.85
        })
    );
    pot.position.set(0, 0.175, 0);
    pot.castShadow = true;
    pot.receiveShadow = true;
    plantGroup.add(pot);

    balloonMaterial = new THREE.MeshStandardMaterial({
        color: balloonColors[0],
        roughness: 0.8,
        emissive: 0x3d1010,
        emissiveIntensity: 0.15
    });

    balloonMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.34, 24, 24),
        balloonMaterial
    );
    balloonMesh.position.set(0, 1.95, 0);
    balloonMesh.scale.set(1.0, 1.28, 1.0);
    balloonMesh.castShadow = true;
    plantGroup.add(balloonMesh);

    const balloonNub = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.18, 12),
        balloonMaterial
    );
    balloonNub.position.set(0, 1.60, 0);
    balloonNub.rotation.x = Math.PI;
    balloonNub.castShadow = true;
    plantGroup.add(balloonNub);

    const balloonStringStart = new THREE.Vector3(0, 1.51, 0);
    const vaseTop = new THREE.Vector3(0, 0.35, 0);
    const stringLength = balloonStringStart.distanceTo(vaseTop);

    const balloonString = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, stringLength, 10),
        new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.8 })
    );
    balloonString.position.copy(balloonStringStart.clone().add(vaseTop).multiplyScalar(0.5));
    balloonString.lookAt(vaseTop);
    balloonString.rotateX(Math.PI / 2);
    balloonString.castShadow = true;
    plantGroup.add(balloonString);

    plantGroup.userData = { interactive: true, name: 'balloon' };
    plantGroup.children.forEach(c => c.userData = { interactive: true, name: 'balloon' });

    plantGroup.position.set(-1.85, 0, 0.40);
    scene.add(plantGroup);
}

function onPointerMove(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    let targetObj = null;

    for (let intersect of intersects) {
        let obj = intersect.object;
        while (obj && obj !== scene && (!obj.userData || !obj.userData.interactive)) {
            obj = obj.parent;
        }

        if (obj && obj.userData && obj.userData.interactive) {
            targetObj = obj;
            break;
        }
    }

    if (targetObj) {
        if (hoveredObject !== targetObj) {
            if (hoveredObject && hoveredObject.userData.name === 'computer') {
                hoveredObject.scale.set(1, 1, 1);
            }
            hoveredObject = targetObj;
            if (targetObj.userData.name === 'computer') {
                targetObj.scale.set(1.05, 1.05, 1.05);
            }

            const tooltips = {
                'computer': '🖥️ Click to Open Portfolio',
                'lamp': '💡 Toggle Desk Lamp',
                'keyboard': '⌨️ Cycle Keyboard RGB',
                'coffeeMug': '☕ Drink Coffee (100% Fuel)',
                'tablet': '📱 Cycle Tablet Notes',
                'balloon': '🎈 Bounce Balloon (Change Color)',
                'jukebox': '📻 Toggle Retro Jukebox Music'
            };

            tooltip.textContent = tooltips[targetObj.userData.name] || 'Interactive Object';
            tooltip.style.display = 'block';
            document.body.style.cursor = 'pointer';
        }
        tooltip.style.left = event.clientX + 15 + 'px';
        tooltip.style.top = event.clientY + 15 + 'px';
    } else {
        if (hoveredObject) {
            if (hoveredObject.userData.name === 'computer') {
                hoveredObject.scale.set(1, 1, 1);
            }
            hoveredObject = null;
            tooltip.style.display = 'none';
            document.body.style.cursor = 'default';
        }
    }
}

function onPointerClick() {
    if (!hoveredObject) return;

    const name = hoveredObject.userData.name;

    if (name === 'computer' && !isAnimating) {
        zoomToMonitor();
        if (window.playUiSound) window.playUiSound('click');
    } else if (name === 'lamp') {
        isLampOn = !isLampOn;
        if (lampLight) lampLight.intensity = isLampOn ? 1.0 : 0.05;
        if (lampBulb) lampBulb.material.emissiveIntensity = isLampOn ? 1.3 : 0.05;
        if (window.showToast) window.showToast(isLampOn ? '💡 Desk Lamp ON' : '🌑 Desk Lamp OFF');
        if (window.playUiSound) window.playUiSound('toggle');
    } else if (name === 'keyboard') {
        keyboardColorIndex = (keyboardColorIndex + 1) % keyboardColors.length;
        const newColor = keyboardColors[keyboardColorIndex];
        if (keyboardLight) keyboardLight.color.setHex(newColor);
        if (window.showToast) window.showToast('⌨️ Keyboard RGB updated!');
        if (window.playUiSound) window.playUiSound('click');
    } else if (name === 'coffeeMug') {
        if (window.showToast) window.showToast('☕ Sip... Coffee level 100%! Ready to code.');
        if (window.playUiSound) window.playUiSound('sip');
    } else if (name === 'tablet') {
        tabletNoteIndex = (tabletNoteIndex + 1) % tabletNotes.length;
        drawTabletNote(tabletNoteIndex);
        if (window.showToast) window.showToast(`📱 Note switched: ${tabletNotes[tabletNoteIndex].title}`);
        if (window.playUiSound) window.playUiSound('click');
    } else if (name === 'balloon') {
        balloonColorIndex = (balloonColorIndex + 1) % balloonColors.length;
        if (balloonMaterial) balloonMaterial.color.setHex(balloonColors[balloonColorIndex]);
        balloonWobbleTime = Date.now();
        if (window.showToast) window.showToast('🎈 Balloon bounced! Color updated.');
        if (window.playUiSound) window.playUiSound('boing');
    } else if (name === 'jukebox') {
        isJukeboxPlaying = !isJukeboxPlaying;
        if (jukeboxLight) jukeboxLight.intensity = isJukeboxPlaying ? 1.4 : 0.3;
        updateJukeboxBulbState();
        if (window.showToast) window.showToast(isJukeboxPlaying ? '📻 Jukebox ON: Playing Retro Beats!' : '📻 Jukebox OFF');
        if (window.playJukeboxBeats) window.playJukeboxBeats(isJukeboxPlaying);
    }
}

function zoomToMonitor() {
    isAnimating = true;
    controls.enabled = false;
    controls.autoRotate = false;
    tooltip.style.display = 'none';

    const targetPosition = { x: 0, y: 2, z: 2.5 };
    const duration = 1200;
    const startTime = Date.now();
    const startPosition = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
    };

    function animateCamera() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(progress);

        camera.position.x = startPosition.x + (targetPosition.x - startPosition.x) * eased;
        camera.position.y = startPosition.y + (targetPosition.y - startPosition.y) * eased;
        camera.position.z = startPosition.z + (targetPosition.z - startPosition.z) * eased;

        camera.lookAt(0, 1.8, 0);

        if (progress < 1) {
            requestAnimationFrame(animateCamera);
        } else {
            setTimeout(() => {
                document.getElementById('portfolioModal').classList.add('active');
                document.body.style.overflow = 'hidden';
            }, 200);
        }
    }

    animateCamera();
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    const time = Date.now() * 0.001;

    if (monitor) {
        monitor.children.forEach(child => {
            if (child.userData && child.userData.isMonitorGlow) {
                const bounce = Math.sin(time * 3.2) * 0.045;
                child.position.y = 2.28 + bounce;
                const scale = 1 + Math.sin(time * 3.2) * 0.08;
                child.scale.set(scale, scale, scale);
            }

            if (child.userData && child.userData.isMonitorLight) {
                child.intensity = 0.35 + Math.sin(time * 3.2) * 0.25;
                child.position.y = 2.28 + Math.sin(time * 3.2) * 0.045;
            }
        });
    }

    // Animate balloon wobble and float
    if (balloonMesh) {
        const floatY = Math.sin(time * 2.2) * 0.025;
        let wobble = 0;
        if (balloonWobbleTime) {
            const dt = (Date.now() - balloonWobbleTime) * 0.001;
            if (dt < 1.2) {
                wobble = Math.sin(dt * 22) * Math.exp(-dt * 3.5) * 0.07;
            }
        }
        balloonMesh.position.y = 1.95 + floatY + wobble;
    }

    // Animate vinyl disc rotation in jukebox
    if (vinylDisc && isJukeboxPlaying) {
        vinylDisc.rotation.z += 0.06;
    }

    // Animate coffee steam particles
    if (steamParticles && steamParticles.length > 0) {
        steamParticles.forEach(p => {
            p.position.y += p.userData.speed;
            p.position.x += Math.sin(time * 2 + p.userData.offset) * 0.0003;
            p.material.opacity = Math.max(0, 0.25 - (p.position.y - 0.14) * 1.5);
            if (p.position.y > 0.32) {
                p.position.y = 0.14;
                p.material.opacity = 0.2;
            }
        });
    }

    renderer.render(scene, camera);
}

window.addEventListener('load', () => {
    setTimeout(() => {
        init();
    }, 100);
});