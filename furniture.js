// Extra room furniture (loaded after scene.js)
// ===== Floor mat under desk =====
function createFloorMat() {
    const matGroup = new THREE.Group();

    const rug = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.04, 2.2),
        new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.95,
            metalness: 0.05
        })
    );
    rug.position.set(0, 0.02, 0.85);
    rug.receiveShadow = true;
    rug.castShadow = true;
    matGroup.add(rug);

    // subtle border stripe
    const border = new THREE.Mesh(
        new THREE.BoxGeometry(2.9, 0.035, 2.3),
        new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.9,
            metalness: 0.05
        })
    );
    border.position.set(0, 0.015, 0.85);
    border.receiveShadow = true;
    matGroup.add(border);

    // thin accent edge (site red)
    const accent = new THREE.Mesh(
        new THREE.BoxGeometry(2.82, 0.042, 0.06),
        new THREE.MeshStandardMaterial({
            color: 0xef4444,
            roughness: 0.7,
            metalness: 0.1,
            emissive: 0xef4444,
            emissiveIntensity: 0.08
        })
    );
    accent.position.set(0, 0.03, 1.92);
    matGroup.add(accent);

    scene.add(matGroup);
}

// ===== Office chair facing the desk =====
function createOfficeChair() {
    const chair = new THREE.Group();
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.55, metalness: 0.15 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.75, metalness: 0.08 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.35, metalness: 0.65 });

    // seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.1, 0.68), seatMat);
    seat.position.set(0, 0.72, 0);
    seat.castShadow = true;
    seat.receiveShadow = true;
    chair.add(seat);

    // seat cushion slight curve illusion
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.06, 0.62), seatMat);
    cushion.position.set(0, 0.8, 0);
    cushion.castShadow = true;
    chair.add(cushion);

    // backrest
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.1), seatMat);
    back.position.set(0, 1.22, -0.32);
    back.castShadow = true;
    chair.add(back);

    // lumbar pad
    const lumbar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.28, 0.08), blackMat);
    lumbar.position.set(0, 1.05, -0.26);
    chair.add(lumbar);

    // central column
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.55, 12), metalMat);
    column.position.set(0, 0.42, 0);
    column.castShadow = true;
    chair.add(column);

    // star base
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 0.08), metalMat);
        leg.position.set(Math.cos(angle) * 0.22, 0.08, Math.sin(angle) * 0.22);
        leg.rotation.y = -angle;
        leg.castShadow = true;
        chair.add(leg);

        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 12), blackMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(Math.cos(angle) * 0.42, 0.05, Math.sin(angle) * 0.42);
        chair.add(wheel);
    }

    // armrests
    [-1, 1].forEach((side) => {
        const armPost = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.28, 10), metalMat);
        armPost.position.set(side * 0.38, 0.9, 0.05);
        chair.add(armPost);

        const armTop = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.4), blackMat);
        armTop.position.set(side * 0.38, 1.05, 0.02);
        chair.add(armTop);
    });

    // place in front of desk, slightly rotated toward camera
    chair.position.set(0.15, 0, 1.55);
    chair.rotation.y = Math.PI + 0.12;
    scene.add(chair);
}

// ===== Lobby / lounge chair on the side =====
function createLobbyChair() {
    const lounge = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.7, metalness: 0.1 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.65, metalness: 0.08 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.5 });

    // seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.14, 0.8), bodyMat);
    seat.position.set(0, 0.55, 0);
    seat.castShadow = true;
    seat.receiveShadow = true;
    lounge.add(seat);

    // back
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.7, 0.12), bodyMat);
    back.position.set(0, 0.95, -0.36);
    back.rotation.x = -0.12;
    back.castShadow = true;
    lounge.add(back);

    // side arms
    [-1, 1].forEach((side) => {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.75), accentMat);
        arm.position.set(side * 0.52, 0.72, -0.02);
        arm.castShadow = true;
        lounge.add(arm);
    });

    // legs
    const legPositions = [
        [-0.38, 0.27, 0.28],
        [0.38, 0.27, 0.28],
        [-0.38, 0.27, -0.28],
        [0.38, 0.27, -0.28]
    ];
    legPositions.forEach((pos) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.54, 10), legMat);
        leg.position.set(...pos);
        leg.castShadow = true;
        lounge.add(leg);
    });

    // thin cushion stripe
    const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.03, 0.55),
        new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6, metalness: 0.05, emissive: 0xef4444, emissiveIntensity: 0.06 })
    );
    stripe.position.set(0, 0.64, 0.05);
    lounge.add(stripe);

    // place on the right side, near wall / open floor, angled into the room
    lounge.position.set(3.4, 0, 1.6);
    lounge.rotation.y = -Math.PI / 2.4;
    scene.add(lounge);
}

// Hook into scene init completion: re-call if scene already built
(function attachFurniture() {
  function tryCreate() {
    if (typeof scene === 'undefined' || !scene) {
      setTimeout(tryCreate, 200);
      return;
    }
    // Avoid duplicates
    if (window.__furnitureAdded) return;
    window.__furnitureAdded = true;
    try {
      createFloorMat();
      createOfficeChair();
      createLobbyChair();
    } catch (e) {
      console.warn('Furniture create failed', e);
    }
  }
  if (document.readyState === 'complete') tryCreate();
  else window.addEventListener('load', () => setTimeout(tryCreate, 1200));
})();
