// Side lounge zone: long chair + large rug (no desk mat)

function createFloorMat() {
  // Desk mat removed per request — no-op kept so older callers don't break
}

function createOfficeChair() {
  // Keep a simple office chair at the desk (no mat under desk)
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

// Long lounge chair + big rug on the side (reference: sofa + large area rug)
function createLobbyChair() {
  const zone = new THREE.Group();

  // Large long rug under lounge
  const rug = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.035, 2.4),
    new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.95, metalness: 0.04 })
  );
  rug.position.set(0, 0.02, 0);
  rug.receiveShadow = true;
  rug.castShadow = true;
  zone.add(rug);

  // Rug border
  const rugBorder = new THREE.Mesh(
    new THREE.BoxGeometry(3.75, 0.028, 2.55),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9, metalness: 0.05 })
  );
  rugBorder.position.set(0, 0.012, 0);
  rugBorder.receiveShadow = true;
  zone.add(rugBorder);

  // Thin red accent strip on rug edge
  const rugAccent = new THREE.Mesh(
    new THREE.BoxGeometry(3.55, 0.038, 0.07),
    new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.65,
      metalness: 0.08,
      emissive: 0xef4444,
      emissiveIntensity: 0.07
    })
  );
  rugAccent.position.set(0, 0.03, 1.12);
  zone.add(rugAccent);

  // Long lounge / sofa-style chair
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.72, metalness: 0.08 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.65, metalness: 0.08 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.5 });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 0.95), bodyMat);
  seat.position.set(0, 0.52, 0.05);
  seat.castShadow = true;
  seat.receiveShadow = true;
  zone.add(seat);

  const seatPad = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.08, 0.85), accentMat);
  seatPad.position.set(0, 0.62, 0.05);
  seatPad.castShadow = true;
  zone.add(seatPad);

  const back = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.78, 0.14), bodyMat);
  back.position.set(0, 0.95, -0.42);
  back.rotation.x = -0.1;
  back.castShadow = true;
  zone.add(back);

  // Arms
  [-1, 1].forEach(function (side) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.9), accentMat);
    arm.position.set(side * 1.27, 0.72, 0.0);
    arm.castShadow = true;
    zone.add(arm);
  });

  // Legs under long seat
  const legPositions = [
    [-1.0, 0.24, 0.35],
    [1.0, 0.24, 0.35],
    [-1.0, 0.24, -0.3],
    [1.0, 0.24, -0.3],
    [0, 0.24, 0.35],
    [0, 0.24, -0.3]
  ];
  legPositions.forEach(function (pos) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.48, 10), legMat);
    leg.position.set(pos[0], pos[1], pos[2]);
    leg.castShadow = true;
    zone.add(leg);
  });

  // Place on right side of room, angled for isometric readability
  zone.position.set(3.15, 0, 1.35);
  zone.rotation.y = -Math.PI / 2.35;
  scene.add(zone);
}
