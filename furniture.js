// Sofa centered facing back wall + desk chair pulled back (reference layout)

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

  // Pulled BACK from desk — relaxed ergonomic position (callout 4)
  chair.position.set(0.35, 0, 2.15);
  chair.rotation.y = Math.PI + 0.08;
  scene.add(chair);
}

// Sofa + rug in center, facing toward desk / back wall (reference)
function createLobbyChair() {
  const zone = new THREE.Group();

  const rug = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.035, 2.5),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.92, metalness: 0.04 })
  );
  rug.position.set(0, 0.02, 0);
  rug.receiveShadow = true;
  rug.castShadow = true;
  zone.add(rug);

  // Red neon underglow perimeter
  const neonMat = new THREE.MeshStandardMaterial({
    color: 0xff2020,
    roughness: 0.35,
    metalness: 0.1,
    emissive: 0xff2020,
    emissiveIntensity: 0.85
  });
  [
    [3.35, 0.04, 0.05, 0, 0.04, 1.2],
    [3.35, 0.04, 0.05, 0, 0.04, -1.2],
    [0.05, 0.04, 2.45, 1.65, 0.04, 0],
    [0.05, 0.04, 2.45, -1.65, 0.04, 0]
  ].forEach(function (d) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(d[0], d[1], d[2]), neonMat);
    strip.position.set(d[3], d[4], d[5]);
    zone.add(strip);
  });

  const led = new THREE.PointLight(0xff2020, 0.7, 5);
  led.position.set(0, 0.12, 0.3);
  zone.add(led);

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a2f38, roughness: 0.7, metalness: 0.08 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x3a4050, roughness: 0.65, metalness: 0.08 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.5 });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.16, 0.95), bodyMat);
  seat.position.set(0, 0.52, 0.05);
  seat.castShadow = true;
  seat.receiveShadow = true;
  zone.add(seat);

  const seatPad = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.08, 0.85), accentMat);
  seatPad.position.set(0, 0.62, 0.05);
  seatPad.castShadow = true;
  zone.add(seatPad);

  const back = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.78, 0.14), bodyMat);
  back.position.set(0, 0.95, -0.42);
  back.rotation.x = -0.08;
  back.castShadow = true;
  zone.add(back);

  [-1, 1].forEach(function (side) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.9), accentMat);
    arm.position.set(side * 1.2, 0.72, 0);
    arm.castShadow = true;
    zone.add(arm);
  });

  [
    [-1.0, 0.24, 0.35],
    [1.0, 0.24, 0.35],
    [-1.0, 0.24, -0.3],
    [1.0, 0.24, -0.3]
  ].forEach(function (pos) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.48, 10), legMat);
    leg.position.set(pos[0], pos[1], pos[2]);
    leg.castShadow = true;
    zone.add(leg);
  });

  // Center floor, facing desk (toward -Z / back wall)
  zone.position.set(0.6, 0, 3.0);
  zone.rotation.y = 0;
  scene.add(zone);
}
