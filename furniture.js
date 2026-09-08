// Furniture with non-black charcoal materials for readable late-night look

function createFloorMat() {}

function createOfficeChair() {
  const chair = new THREE.Group();
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x1e2023, roughness: 0.75, metalness: 0.06 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.55, metalness: 0.12 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.4, metalness: 0.55 });

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

  chair.position.set(0.2, 0, 1.7);
  chair.rotation.y = Math.PI + 0.1;
  scene.add(chair);
}

function createLobbyChair() {
  const zone = new THREE.Group();

  const rug = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 0.03, 2.2),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.92, metalness: 0.03 })
  );
  rug.position.set(0, 0.02, 0);
  rug.receiveShadow = true;
  zone.add(rug);

  const neonMat = new THREE.MeshStandardMaterial({
    color: 0xff2020,
    roughness: 0.4,
    metalness: 0.1,
    emissive: 0xff2020,
    emissiveIntensity: 0.85
  });
  [
    [2.75, 0.035, 0.045, 0, 0.04, 1.05],
    [2.75, 0.035, 0.045, 0, 0.04, -1.05],
    [0.045, 0.035, 2.15, 1.35, 0.04, 0],
    [0.045, 0.035, 2.15, -1.35, 0.04, 0]
  ].forEach(function (d) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(d[0], d[1], d[2]), neonMat);
    strip.position.set(d[3], d[4], d[5]);
    zone.add(strip);
  });

  const led = new THREE.PointLight(0xff2020, 0.5, 4);
  led.position.set(0, 0.1, 0.2);
  zone.add(led);

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e2023, roughness: 0.75, metalness: 0.06 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x25272a, roughness: 0.7, metalness: 0.06 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.45, metalness: 0.4 });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.15, 0.9), bodyMat);
  seat.position.set(0, 0.5, 0.05);
  seat.castShadow = true;
  seat.receiveShadow = true;
  zone.add(seat);

  const seatPad = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.07, 0.8), accentMat);
  seatPad.position.set(0, 0.6, 0.05);
  seatPad.castShadow = true;
  zone.add(seatPad);

  const back = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.72, 0.12), bodyMat);
  back.position.set(0, 0.9, -0.4);
  back.rotation.x = -0.08;
  back.castShadow = true;
  zone.add(back);

  [-1, 1].forEach(function (side) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.85), accentMat);
    arm.position.set(side * 1.1, 0.68, 0);
    arm.castShadow = true;
    zone.add(arm);
  });

  [
    [-0.9, 0.22, 0.32],
    [0.9, 0.22, 0.32],
    [-0.9, 0.22, -0.28],
    [0.9, 0.22, -0.28]
  ].forEach(function (pos) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.44, 10), legMat);
    leg.position.set(pos[0], pos[1], pos[2]);
    leg.castShadow = true;
    zone.add(leg);
  });

  zone.position.set(-1.8, 0, 2.6);
  zone.rotation.y = 0.15;
  scene.add(zone);
}
