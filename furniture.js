// Furniture layout — sofa faces panoramic window; desk chair at desk

function createFloorMat() {}

function createOfficeChair() {
  const chair = new THREE.Group();
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.75, metalness: 0.08 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.55, metalness: 0.15 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.35, metalness: 0.65 });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.1, 0.68), seatMat);
  seat.position.set(0, 0.72, 0);
  seat.castShadow = true;
  seat.receiveShadow = true;
  chair.add(seat);

  const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.06, 0.62), seatMat);
  cushion.position.set(0, 0.8, 0);
  cushion.castShadow = true;
  chair.add(cushion);

  const back = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.1), seatMat);
  back.position.set(0, 1.22, -0.32);
  back.castShadow = true;
  chair.add(back);

  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.55, 12), metalMat);
  column.position.set(0, 0.42, 0);
  column.castShadow = true;
  chair.add(column);

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

  [-1, 1].forEach(function (side) {
    const armPost = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.28, 10), metalMat);
    armPost.position.set(side * 0.38, 0.9, 0.05);
    chair.add(armPost);
    const armTop = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.4), blackMat);
    armTop.position.set(side * 0.38, 1.05, 0.02);
    chair.add(armTop);
  });

  chair.position.set(0.15, 0, 1.55);
  chair.rotation.y = Math.PI + 0.12;
  scene.add(chair);
}

// Sofa + rug on open left — seats face RIGHT (window), backrest to open left
function createLobbyChair() {
  const zone = new THREE.Group();

  // Rug under sofa
  const rug = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.035, 3.4),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.95, metalness: 0.04 })
  );
  rug.position.set(0, 0.02, 0);
  rug.receiveShadow = true;
  rug.castShadow = true;
  zone.add(rug);

  // Red neon edge (underglow strip on rug perimeter facing window side)
  const neonMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.4,
    metalness: 0.1,
    emissive: 0xef4444,
    emissiveIntensity: 0.55
  });
  const neonFront = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 3.3), neonMat);
  neonFront.position.set(1.25, 0.04, 0);
  zone.add(neonFront);
  const neonSideA = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.04, 0.06), neonMat);
  neonSideA.position.set(0, 0.04, 1.65);
  zone.add(neonSideA);
  const neonSideB = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.04, 0.06), neonMat);
  neonSideB.position.set(0, 0.04, -1.65);
  zone.add(neonSideB);

  // Soft red point light under sofa for LED glow
  if (typeof THREE !== 'undefined') {
    const led = new THREE.PointLight(0xef4444, 0.45, 4.5);
    led.position.set(0.4, 0.15, 0);
    zone.add(led);
  }

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1f2a, roughness: 0.72, metalness: 0.08 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x2a3344, roughness: 0.65, metalness: 0.08 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.5 });

  // Sofa oriented locally: seat faces +X (will face window after world placement)
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.16, 2.4), bodyMat);
  seat.position.set(0.1, 0.52, 0);
  seat.castShadow = true;
  seat.receiveShadow = true;
  zone.add(seat);

  const seatPad = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 2.25), accentMat);
  seatPad.position.set(0.1, 0.62, 0);
  seatPad.castShadow = true;
  zone.add(seatPad);

  // Backrest on -X side (faces open left)
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.78, 2.4), bodyMat);
  back.position.set(-0.4, 0.95, 0);
  back.castShadow = true;
  zone.add(back);

  [-1, 1].forEach(function (side) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.32, 0.14), accentMat);
    arm.position.set(0.05, 0.72, side * 1.27);
    arm.castShadow = true;
    zone.add(arm);
  });

  const legPositions = [
    [0.35, 0.24, -1.0],
    [0.35, 0.24, 1.0],
    [-0.3, 0.24, -1.0],
    [-0.3, 0.24, 1.0],
    [0.35, 0.24, 0],
    [-0.3, 0.24, 0]
  ];
  legPositions.forEach(function (pos) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.48, 10), legMat);
    leg.position.set(pos[0], pos[1], pos[2]);
    leg.castShadow = true;
    zone.add(leg);
  });

  // Open left side of room, facing window (+X)
  zone.position.set(-2.2, 0, 2.4);
  zone.rotation.y = 0; // local +X already points toward window
  scene.add(zone);
}
