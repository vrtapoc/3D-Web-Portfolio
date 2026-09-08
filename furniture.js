// Desk chair only — no sofa/rug

function createFloorMat() {}

function createOfficeChair() {
  const chair = new THREE.Group();
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x2a2c32, roughness: 0.6, metalness: 0.06 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x222429, roughness: 0.55, metalness: 0.1 });
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

  chair.position.set(0.15, 0, 1.55);
  chair.rotation.y = Math.PI + 0.08;
  scene.add(chair);
}

function createLobbyChair() {}
