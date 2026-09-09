/*
 * Layout: clean back wall + floating shelf + neon + desk bias + rug
 *         right-wall architectural window + curtains + sun
 * Interactive meshes from original scene are ONLY repositioned.
 */
(function () {
  var ORIG_URL =
    'https://raw.githubusercontent.com/vrtapoc/3D-Web-Portfolio/e85884eca00ae0cd9dc9f3d523d1d14a99f376e5/scene.js';

  var H = 5.8;
  var T = 0.22;
  var WALL = 0x090a0c;
  var xL = -4.8;
  var xR = 4.4;
  var zB = -2.7;
  var zF = 4.2;

  var DESK_X = 0.2;
  var DESK_Z = zB + 0.85;
  var CONSOLE_W = 2.9;
  var CONSOLE_D = 0.75;
  var CONSOLE_H = 0.48;
  var CONSOLE_BOTTOM = 0.74;
  var CONSOLE_Y = CONSOLE_BOTTOM + CONSOLE_H / 2;

  var __neonLight = null;
  var __consoleUnderglow = null;
  var __consoleUnderglow2 = null;

  function removeOriginalWallsAndFloor() {
    if (!scene) return;
    var kill = [];
    scene.traverse(function (obj) {
      if (!obj) return;
      if (obj.name === 'diorama-walls' || obj.name === 'back-wall-decor' || obj.name === 'framed-art-logo') {
        kill.push(obj);
        return;
      }
      if (!obj.isMesh) return;
      var p = obj.position || { x: 0, y: 0, z: 0 };
      if (Math.abs(p.x + 7.5) < 0.6 || Math.abs(p.x - 7.5) < 0.6) kill.push(obj);
      if (obj.geometry && obj.geometry.type === 'PlaneGeometry' && Math.abs(p.z + 3) < 0.45 && Math.abs(p.y - 4) < 3)
        kill.push(obj);
      if (
        obj.geometry &&
        obj.geometry.type === 'PlaneGeometry' &&
        Math.abs(p.y) < 0.05 &&
        obj.rotation &&
        Math.abs(obj.rotation.x + Math.PI / 2) < 0.25
      )
        kill.push(obj);
    });
    kill.forEach(function (o) {
      try {
        o.visible = false;
        if (o.parent) o.parent.remove(o);
      } catch (e) {}
    });
  }

  function removeLegacyFloorMat() {
    if (!scene) return;
    var kill = [];
    scene.traverse(function (obj) {
      if (!obj.isMesh || (obj.userData && obj.userData.isStudioRug)) return;
      var bounds = new THREE.Box3().setFromObject(obj);
      var size = bounds.getSize(new THREE.Vector3());
      var center = bounds.getCenter(new THREE.Vector3());
      var isLowProfile = center.y < 0.08 && size.y < 0.12;
      var isDeskSized = size.x > 2.6 && size.x < 3.8 && size.z > 1.8 && size.z < 3.0;
      if (isLowProfile && isDeskSized) kill.push(obj);
    });
    kill.forEach(function (obj) {
      obj.visible = false;
      if (obj.parent) obj.parent.remove(obj);
    });
  }

  function createWoodFloor() {
    var canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    var ctx = canvas.getContext('2d');
    var planks = 12;
    var plankH = canvas.height / planks;
    ctx.fillStyle = '#0a0908';
    ctx.fillRect(0, 0, 1024, 1024);
    for (var i = 0; i < planks; i++) {
      var y = i * plankH;
      var v = 16 + ((i * 3) % 5);
      ctx.fillStyle = 'rgb(' + (v + 4) + ',' + (v + 1) + ',' + v + ')';
      ctx.fillRect(0, y + 1, 1024, plankH - 2);
      ctx.fillStyle = '#050403';
      ctx.fillRect(0, y, 1024, 1.5);
    }
    var tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2.2, 2.2);
    tex.anisotropy = 8;
    return tex;
  }

  function applyLighting() {
    if (!scene) return;
    scene.traverse(function (obj) {
      if (!obj.isLight) return;
      if (obj.isAmbientLight || obj.isHemisphereLight) obj.intensity = Math.min(obj.intensity, 0.12);
      if (obj.isDirectionalLight) obj.intensity = Math.min(obj.intensity, 0.2);
    });
    var amb = new THREE.AmbientLight(0xa8b0c0, 0.28);
    amb.name = 'amb-ambient';
    scene.add(amb);
    var hemi = new THREE.HemisphereLight(0xc8d0e0, 0x121218, 0.32);
    hemi.name = 'amb-hemi';
    scene.add(hemi);
    var fill = new THREE.DirectionalLight(0xd0d4e0, 0.35);
    fill.position.set(-5, 5.5, 7);
    scene.add(fill);
        var moonlight = new THREE.DirectionalLight(0x4a6a8a, 0.45);
    moonlight.name = 'window-moonlight';
    moonlight.position.set(8.5, 4.5, 1.2);
    moonlight.target.position.set(0, 0.5, 0.5);
    moonlight.castShadow = true;
    moonlight.shadow.mapSize.set(2048, 2048);
    moonlight.shadow.bias = -0.0005;
    scene.add(moonlight);
    scene.add(moonlight.target);
    if (renderer) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.95;
      renderer.shadowMap.enabled = true;
    }
    if (scene.background) scene.background = new THREE.Color(0x06060a);
  }

  function hideDeskBody() {
    if (typeof desk === 'undefined' || !desk) return;
    desk.children.forEach(function (c) {
      if (c === monitor || c === keyboard || c === mouse) return;
      if (c.userData && c.userData.interactive) return;
      if (
        c.userData &&
        (c.userData.name === 'keyboard' ||
          c.userData.name === 'coffeeMug' ||
          c.userData.name === 'tablet' ||
          c.userData.name === 'computer')
      )
        return;
      if (c.isMesh) {
        c.visible = false;
      } else if (c.isGroup) {
        var keep = false;
        c.traverse(function (x) {
          if (x.userData && x.userData.interactive) keep = true;
        });
        if (!keep) c.visible = false;
      }
    });
  }

  function placeWorkstation() {
    if (!scene) return;

    if (typeof desk !== 'undefined' && desk) {
      desk.position.set(DESK_X, 0, DESK_Z);
      desk.rotation.y = 0;
      hideDeskBody();
      if (typeof monitor !== 'undefined' && monitor) {
        monitor.visible = true;
        monitor.rotation.y = 0;
      }
    }

    var lampX = (-3.15 + DESK_X) / 2;
        scene.traverse(function (obj) {
      if (obj.userData && obj.userData.name === 'balloon') {
        obj.position.set(xR - 0.48, 0, winZ1 - 0.45);
      }
    });
    scene.traverse(function (obj) {
      if (obj.userData && obj.userData.name === 'lamp') {
        obj.position.set(lampX, 0, DESK_Z + 0.2);
        obj.rotation.y = 0.4;
      }
    });

    scene.traverse(function (obj) {
      if (obj.name === 'office-chair') {
        obj.position.set(DESK_X, 0, DESK_Z + 1.35);
        obj.rotation.y = Math.PI;
      }
    });

    if (typeof jukebox !== 'undefined' && jukebox) {
      jukebox.position.set(-3.55, 0, 2.9);
      jukebox.rotation.y = Math.PI / 2;
    }

    scene.traverse(function (obj) {
      if (!obj.isGroup) return;
      var isB = obj.userData && obj.userData.name === 'balloon';
      if (!isB) {
        var hs = false;
        obj.traverse(function (c) {
          if (c.isMesh && c.geometry && c.geometry.type === 'SphereGeometry') hs = true;
        });
        if (hs && obj.position.x > 2.5) isB = true;
      }
      if (isB) obj.position.set(3.7, -0.28, 3.5);
    });
  }

  function createFiddleLeafGeo(w, l) {
    var shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(w * 0.4, l * 0.2, w * 0.6, l * 0.6, w * 0.5, l * 0.85);
    shape.bezierCurveTo(w * 0.35, l * 0.98, w * 0.12, l, 0, l);
    shape.bezierCurveTo(-w * 0.12, l, -w * 0.35, l * 0.98, -w * 0.5, l * 0.85);
    shape.bezierCurveTo(-w * 0.6, l * 0.6, -w * 0.4, l * 0.2, 0, 0);
    var geo = new THREE.ShapeGeometry(shape, 12);
    var pos = geo.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var lx = pos.getX(i);
      var ly = pos.getY(i);
      var cup = -Math.sin((ly / l) * Math.PI) * 0.04 - (lx * lx / (w * w)) * 0.03;
      pos.setZ(i, cup);
    }
    geo.computeVertexNormals();
    return geo;
  }
    function createSkylineBackdropTex() {
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    var ctx = canvas.getContext('2d');
    var grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#020408');
    grad.addColorStop(0.7, '#03060c');
    grad.addColorStop(1, '#050a14');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    for (var i = 0; i < 45; i++) {
      var sx = Math.random() * 512;
      var sy = Math.random() * 300;
      var r = Math.random() * 0.7 + 0.25;
      var a = Math.random() * 0.45 + 0.15;
      ctx.fillStyle = 'rgba(195, 215, 245, ' + a + ')';
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
  }

  function createBuildingFacadeTex(floors, cols) {
    var canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#040609';
    ctx.fillRect(0, 0, 128, 256);

    // Vibrant warm amber 0xffa834 and soft incandescent white 0xfff0db
    var palette = ['#ffa834', '#fff0db', '#7ec8f8'];
    var floorH = 256 / floors;
    var colW = 128 / cols;
    var winPadX = colW * 0.24;
    var winPadY = floorH * 0.26;
    var winW = colW - winPadX * 2;
    var winH = floorH - winPadY * 2;

    for (var f = 0; f < floors; f++) {
      for (var c = 0; c < cols; c++) {
        var isLit = Math.random() < 0.16;
        if (isLit) {
          var colIndex = Math.random() < 0.72 ? 0 : (Math.random() < 0.92 ? 1 : 2);
          ctx.fillStyle = palette[colIndex];
        } else {
          ctx.fillStyle = '#07090e';
        }
        ctx.fillRect(c * colW + winPadX, f * floorH + winPadY, winW, winH);
      }
    }
    return new THREE.CanvasTexture(canvas);
  }

  function createCrescentMoonShape(r) {
    var s = new THREE.Shape();
    s.absarc(0, 0, r, 0, Math.PI * 2, false);
    var hole = new THREE.Path();
    hole.absarc(r * 0.35, r * 0.18, r * 0.88, 0, Math.PI * 2, true);
    s.holes.push(hole);
    return s;
  }

  var __cityBeacons = [];
  function animateCityBeacons() {
    requestAnimationFrame(animateCityBeacons);
    var t = Date.now() * 0.0025;
    var pulse = (Math.sin(t) + 1) * 0.75 + 0.3; // 0.3 to 1.8
    for (var i = 0; i < __cityBeacons.length; i++) {
      var b = __cityBeacons[i];
      if (b.material) b.material.emissiveIntensity = pulse;
      if (b.light) b.light.intensity = pulse * 0.4;
    }
  }
  if (!window.__cityBeaconsLoop) {
    window.__cityBeaconsLoop = true;
    animateCityBeacons();
  }
  function createMidnightSkyTexture() {
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    var ctx = canvas.getContext('2d');
    var grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#040711');
    grad.addColorStop(0.5, '#070f20');
    grad.addColorStop(1, '#0d172e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    for (var i = 0; i < 65; i++) {
      var sx = Math.random() * 512;
      var sy = Math.random() * 340;
      var r = Math.random() * 0.9 + 0.3;
      var a = Math.random() * 0.45 + 0.15;
      ctx.fillStyle = 'rgba(185, 210, 245, ' + a + ')';
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    var tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  function createMicroCementBump() {
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    var imgData = ctx.getImageData(0, 0, 512, 512);
    var data = imgData.data;
    for (var i = 0; i < data.length; i += 4) {
      var noise = (Math.random() - 0.5) * 44;
      var val = Math.min(255, Math.max(0, 128 + noise));
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }
    ctx.putImageData(imgData, 0, 0);

    for (var j = 0; j < 35; j++) {
      var x = Math.random() * 512;
      var y = Math.random() * 512;
      var radX = Math.random() * 50 + 20;
      var radY = Math.random() * 25 + 10;
      var shade = Math.random() > 0.5 ? 170 : 85;
      ctx.fillStyle = 'rgba(' + shade + ',' + shade + ',' + shade + ', 0.05)';
      ctx.beginPath();
      ctx.ellipse(x, y, radX, radY, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    var tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 2);
    return tex;
  }
  function buildRoom() {
    if (!scene || window.__dioramaBuilt) return;
    window.__dioramaBuilt = true;

    var root = new THREE.Group();
    root.name = 'diorama-walls';

    var microCementBump = createMicroCementBump();
    var wallMat = new THREE.MeshStandardMaterial({
      color: 0x0f1013,
      roughness: 0.92,
      metalness: 0.06,
      bumpMap: microCementBump,
      bumpScale: 0.0025
    });
    var frameMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.55, metalness: 0.2 });
    var doorMat = new THREE.MeshStandardMaterial({ color: 0x101012, roughness: 0.78, metalness: 0.04 });
    var metalMat = new THREE.MeshStandardMaterial({ color: 0x9a9aa0, roughness: 0.3, metalness: 0.8 });

    function box(w, h, d, x, y, z, mat) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || wallMat);
      m.position.set(x, y, z);
      m.castShadow = false;
      m.receiveShadow = true;
      root.add(m);
      return m;
    }

    var floorW = xR - xL;
    var floorD = zF - zB;
    var floor = new THREE.Mesh(
      new THREE.BoxGeometry(floorW, 0.16, floorD),
      new THREE.MeshStandardMaterial({ map: createWoodFloor(), color: 0x1a1614, roughness: 0.55, metalness: 0.05 })
    );
    floor.position.set((xL + xR) / 2, -0.08, (zB + zF) / 2);
    floor.receiveShadow = true;
    root.add(floor);

        // ---- Acoustic Felt Backing + Vertical Wood Slat Wall ----
    var doorW = 1.0;
    var doorH = 2.4;
    var doorX = -3.15;
    var doorX0 = doorX - doorW / 2;
    var doorX1 = doorX + doorW / 2;

    // 1. Acoustic Felt Backing (Base Wall: near-black matte felt 0x090a0c, roughness 0.98)
    var feltMat = new THREE.MeshStandardMaterial({
      color: 0x090a0c,
      roughness: 0.98,
      metalness: 0.0
    });
    box(xR - xL, H, T, (xL + xR) / 2, H / 2, zB, feltMat);

    // Minimal perimeter baseboard along bottom floor seam + crown trim
    var trimMat = new THREE.MeshStandardMaterial({
      color: 0x08090b,
      roughness: 0.45,
      metalness: 0.1
    });
    var baseH = 0.08;
    var crownH = 0.06;
    box(xR - xL, baseH, 0.035, (xL + xR) / 2, baseH / 2, zB + T / 2 + 0.018, trimMat);
    box(xR - xL, crownH, 0.035, (xL + xR) / 2, H - crownH / 2, zB + T / 2 + 0.018, trimMat);

    // 2. Vertical Slat Array using THREE.InstancedMesh
    var slatW = 0.045;
    var slatD = 0.025;
    var slatGap = 0.038;
    var slatPitch = slatW + slatGap;
    var slatZ = zB + T / 2 + slatD / 2 + 0.002;

    var slatMat = new THREE.MeshStandardMaterial({
      color: 0x151619,
      roughness: 0.65,
      metalness: 0.08
    });

    var slatGeo = new THREE.BoxGeometry(slatW, 1, slatD);
    var dummy = new THREE.Object3D();

    var fullSlatH = H - baseH - crownH;
    var fullSlatY = baseH + fullSlatH / 2;

    var overDoorBottom = doorH + 0.045;
    var overDoorH = H - crownH - overDoorBottom;
    var overDoorY = overDoorBottom + overDoorH / 2;

    // Door boundary clearance
    var doorClearLeft = doorX0 - 0.04;
    var doorClearRight = doorX1 + 0.04;

    var slatConfigs = [];
    var startX = xL + 0.08;
    var endX = xR - 0.08;

    for (var sx = startX; sx <= endX; sx += slatPitch) {
      if (sx >= doorClearLeft && sx <= doorClearRight) {
        // Over-door header slats
        if (overDoorH > 0.2) {
          slatConfigs.push({ x: sx, y: overDoorY, h: overDoorH });
        }
      } else {
        // Full height slats
        slatConfigs.push({ x: sx, y: fullSlatY, h: fullSlatH });
      }
    }

    if (slatConfigs.length > 0) {
      var slatInstances = new THREE.InstancedMesh(slatGeo, slatMat, slatConfigs.length);
      slatInstances.name = 'acoustic-slats';
      slatInstances.castShadow = true;
      slatInstances.receiveShadow = true;

      for (var si = 0; si < slatConfigs.length; si++) {
        var cfg = slatConfigs[si];
        dummy.position.set(cfg.x, cfg.y, slatZ);
        dummy.scale.set(1, cfg.h, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        slatInstances.setMatrixAt(si, dummy.matrix);
      }
      slatInstances.instanceMatrix.needsUpdate = true;
      root.add(slatInstances);
    }

    var doorPanelMat = new THREE.MeshStandardMaterial({ color: 0x1a1b1f, roughness: 0.82, metalness: 0.04 });
    box(doorW - 0.04, doorH - 0.04, 0.04, doorX, doorH / 2, zB + T / 2 + 0.025, doorPanelMat);

    var frameSlim = new THREE.MeshStandardMaterial({ color: 0x2a2b30, roughness: 0.5, metalness: 0.25 });
    box(0.03, doorH + 0.04, 0.05, doorX0, doorH / 2, zB + T / 2 + 0.02, frameSlim);
    box(0.03, doorH + 0.04, 0.05, doorX1, doorH / 2, zB + T / 2 + 0.02, frameSlim);
    box(doorW + 0.06, 0.03, 0.05, doorX, doorH, zB + T / 2 + 0.02, frameSlim);

    var handleMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.35, metalness: 0.7 });
    var handle = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.28, 0.025), handleMat);
    handle.position.set(doorX1 - 0.06, doorH * 0.48, zB + T / 2 + 0.06);
    root.add(handle);

    var doorLight = new THREE.SpotLight(0xffeedd, 1.4, 3.8, Math.PI / 3.5, 0.85, 1.4);
    doorLight.position.set(doorX, 0.04, zB + 0.06);
    doorLight.target.position.set(doorX, 0, zB + 1.5);
    root.add(doorLight);
    root.add(doorLight.target);
    var doorFill = new THREE.PointLight(0xffeedd, 0.35, 2.0, 1.6);
    doorFill.position.set(doorX, 0.06, zB + 0.18);
    root.add(doorFill);
    var crack = new THREE.Mesh(
      new THREE.PlaneGeometry(doorW * 0.9, 0.028),
      new THREE.MeshBasicMaterial({
        color: 0xffeedd,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    crack.rotation.x = -Math.PI / 2;
    crack.position.set(doorX, 0.012, zB + T / 2 + 0.1);
    root.add(crack);

        // Dark studio rug (rounded rectangle with woven border)
    var rugW = 3.2, rugD = 2.4, rugT = 0.015, cornerR = 0.22;
    var rugX = DESK_X, rugZ = DESK_Z + 0.55;

    function createRoundedRect(w, d, r) {
      var s = new THREE.Shape();
      var hw = w / 2, hd = d / 2;
      s.moveTo(-hw + r, -hd);
      s.lineTo(hw - r, -hd);
      s.quadraticCurveTo(hw, -hd, hw, -hd + r);
      s.lineTo(hw, hd - r);
      s.quadraticCurveTo(hw, hd, hw - r, hd);
      s.lineTo(-hw + r, hd);
      s.quadraticCurveTo(-hw, hd, -hw, hd - r);
      s.lineTo(-hw, -hd + r);
      s.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
      return s;
    }

    // Lighter woven border edge (~0.04 thickness)
    var borderGeo = new THREE.ExtrudeGeometry(createRoundedRect(rugW, rugD, cornerR), {
      depth: rugT,
      bevelEnabled: false
    });
    borderGeo.rotateX(-Math.PI / 2);
    var borderMat = new THREE.MeshStandardMaterial({
      color: 0x343842,
      roughness: 0.95,
      metalness: 0.0
    });
    var border = new THREE.Mesh(borderGeo, borderMat);
    border.position.set(rugX, 0.008, rugZ);
    border.userData.isStudioRug = true;
    border.receiveShadow = true;
    root.add(border);

    // Deep heather graphite / dark charcoal inner rug surface
    var borderInset = 0.04;
    var innerW = rugW - borderInset * 2;
    var innerD = rugD - borderInset * 2;
    var innerR = Math.max(0.04, cornerR - borderInset);
    var innerGeo = new THREE.ExtrudeGeometry(createRoundedRect(innerW, innerD, innerR), {
      depth: 0.004,
      bevelEnabled: false
    });
    innerGeo.rotateX(-Math.PI / 2);
    var innerRugMat = new THREE.MeshStandardMaterial({
      color: 0x22242a,
      roughness: 0.95,
      metalness: 0.0
    });
    var innerRug = new THREE.Mesh(innerGeo, innerRugMat);
    innerRug.position.set(rugX, 0.008 + rugT, rugZ);
    innerRug.userData.isStudioRug = true;
    innerRug.receiveShadow = true;
    root.add(innerRug);

    var consoleMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4, metalness: 0.1 });
    var consoleBody = new THREE.Mesh(new THREE.BoxGeometry(CONSOLE_W, CONSOLE_H, CONSOLE_D), consoleMat);
    consoleBody.position.set(DESK_X, CONSOLE_Y, DESK_Z);
    consoleBody.castShadow = true;
    consoleBody.receiveShadow = true;
    root.add(consoleBody);

    var topCap = new THREE.Mesh(
      new THREE.BoxGeometry(CONSOLE_W + 0.02, 0.02, CONSOLE_D + 0.02),
      new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.35, metalness: 0.15 })
    );
    topCap.position.set(DESK_X, CONSOLE_Y + CONSOLE_H / 2 + 0.01, DESK_Z);
    root.add(topCap);

    var ug = new THREE.PointLight(0x00f5ff, 1.0, 2.2, 1.4);
    ug.position.set(DESK_X, CONSOLE_BOTTOM - 0.08, DESK_Z);
    root.add(ug);
    __consoleUnderglow = ug;
    var ug2 = new THREE.PointLight(0x00f5ff, 0.35, 1.8, 1.5);
    ug2.position.set(DESK_X, CONSOLE_BOTTOM - 0.05, DESK_Z + 0.1);
    root.add(ug2);
    __consoleUnderglow2 = ug2;

    var soundbar = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.05, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.9, metalness: 0.05 })
    );
    soundbar.position.set(DESK_X - 0.85, CONSOLE_Y + CONSOLE_H / 2 + 0.04, DESK_Z - CONSOLE_D * 0.15);
    root.add(soundbar);

    var ringMat = new THREE.MeshStandardMaterial({ color: 0xd6c7b2, roughness: 0.9, metalness: 0 });
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.03, 14, 28), ringMat);
    ring.position.set(DESK_X + 1.1, CONSOLE_Y + CONSOLE_H / 2 + 0.1, DESK_Z - CONSOLE_D * 0.1);
    root.add(ring);

    var NEON_PALETTE = [
      { hex: 0x00f5ff, str: '#00f5ff' },
      { hex: 0xff007f, str: '#ff007f' },
      { hex: 0xa855f7, str: '#a855f7' },
      { hex: 0x39ff14, str: '#39ff14' },
      { hex: 0xffa600, str: '#ffa600' },
      { hex: 0xf8fafc, str: '#f8fafc' }
    ];
    var neonColorIndex = 0;
    var neonCanvas = document.createElement('canvas');
    neonCanvas.width = 1024;
    neonCanvas.height = 384;
    var neonCtx = neonCanvas.getContext('2d');
    var neonTex = new THREE.CanvasTexture(neonCanvas);
    neonTex.needsUpdate = true;
    if (THREE.SRGBColorSpace) neonTex.colorSpace = THREE.SRGBColorSpace;

    function drawNeonText(colorStr) {
      neonCtx.clearRect(0, 0, 1024, 384);
      neonCtx.font = '900 160px "JetBrains Mono", Consolas, monospace';
      neonCtx.textAlign = 'center';
      neonCtx.textBaseline = 'middle';
      neonCtx.shadowColor = colorStr;
      neonCtx.shadowBlur = 40;
      neonCtx.fillStyle = colorStr;
      neonCtx.fillText('</bosst>', 512, 200);
      neonCtx.shadowBlur = 18;
      neonCtx.fillText('</bosst>', 512, 200);
      neonCtx.shadowBlur = 6;
      neonCtx.fillStyle = '#ffffff';
      neonCtx.fillText('</bosst>', 512, 200);
      neonTex.needsUpdate = true;
    }
    drawNeonText(NEON_PALETTE[0].str);

    var neonGroup = new THREE.Group();
    neonGroup.position.set(DESK_X, 3.42, zB + T / 2 + 0.12);

    var plateW = 3.2;
    var plateH = 1.15;
    var plateMat = new THREE.MeshStandardMaterial({
      color: 0x12141a,
      roughness: 0.12,
      metalness: 0.1,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    var plate = new THREE.Mesh(new THREE.BoxGeometry(plateW, plateH, 0.025), plateMat);
    neonGroup.add(plate);

    var chromeMat = new THREE.MeshStandardMaterial({ color: 0xc0c4cc, roughness: 0.25, metalness: 0.9 });
    [
      [-plateW * 0.46, plateH * 0.4],
      [plateW * 0.46, plateH * 0.4],
      [-plateW * 0.46, -plateH * 0.4],
      [plateW * 0.46, -plateH * 0.4]
    ].forEach(function (xy) {
      var stand = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.05, 10), chromeMat);
      stand.rotation.x = Math.PI / 2;
      stand.position.set(xy[0], xy[1], -0.035);
      neonGroup.add(stand);
    });

    var neonLogoMat = new THREE.MeshBasicMaterial({
      map: neonTex,
      transparent: true,
      toneMapped: false,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    var logo = new THREE.Mesh(new THREE.PlaneGeometry(plateW * 0.9, plateH * 0.75), neonLogoMat);
    logo.position.set(0, 0, 0.015);
    neonGroup.add(logo);

    var neonLight = new THREE.PointLight(NEON_PALETTE[0].hex, 2.4, 7.5, 1.2);
    neonLight.position.set(0, 0, 0.5);
    neonGroup.add(neonLight);
    __neonLight = neonLight;

    function cycleNeonColor() {
      neonColorIndex = (neonColorIndex + 1) % NEON_PALETTE.length;
      var c = NEON_PALETTE[neonColorIndex];
      drawNeonText(c.str);
      var oldMap = neonLogoMat.map;
      var fresh = new THREE.CanvasTexture(neonCanvas);
      if (THREE.SRGBColorSpace) fresh.colorSpace = THREE.SRGBColorSpace;
      fresh.needsUpdate = true;
      neonLogoMat.map = fresh;
      neonLogoMat.needsUpdate = true;
      neonTex = fresh;
      if (oldMap && oldMap.dispose)
        try {
          oldMap.dispose();
        } catch (e) {}
      if (__neonLight) {
        __neonLight.color.setHex(c.hex);
        __neonLight.intensity = 3.5;
        setTimeout(function () {
          if (__neonLight) __neonLight.intensity = 2.2;
        }, 100);
      }
      if (__consoleUnderglow) __consoleUnderglow.color.setHex(c.hex);
      if (__consoleUnderglow2) __consoleUnderglow2.color.setHex(c.hex);
      if (window.showToast) window.showToast('Neon: ' + c.str);
      if (window.playUiSound) window.playUiSound('click');
    }
    window.__cycleNeonColor = cycleNeonColor;

    function markNeon(m) {
      m.userData = { interactive: true, name: 'neonSign', onClick: cycleNeonColor };
    }
    markNeon(plate);
    markNeon(logo);
    neonGroup.userData = { interactive: true, name: 'neonSign', onClick: cycleNeonColor };
    root.add(neonGroup);

        // ---- Floating wood shelf below neon with breathing room ----
    var shelfW = 2.4;
    var shelfH = 0.05;
    var shelfD = 0.32;
    // Lowered assembly downward so decor has clear visual breathing room below neon sign plate
    var shelfY = 2.62;
    var shelfZ = zB + T / 2 + shelfD / 2 + 0.04;
    var shelfTopSurface = shelfY + shelfH / 2;

    var oakMat = new THREE.MeshStandardMaterial({
      color: 0x1a1614,
      roughness: 0.62,
      metalness: 0.08
    });
    var shelf = new THREE.Mesh(new THREE.BoxGeometry(shelfW, shelfH, shelfD), oakMat);
    shelf.position.set(DESK_X, shelfY, shelfZ);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    root.add(shelf);

    var potMat = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.7, metalness: 0.0 });
    var leafMat = new THREE.MeshStandardMaterial({ color: 0x3d6b45, roughness: 0.55, metalness: 0.0 });
    function makePot(px) {
      var g = new THREE.Group();
      var pot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.1, 16), potMat);
      pot.position.y = 0.05;
      g.add(pot);
      for (var li = 0; li < 4; li++) {
        var leaf = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.04), leafMat);
        leaf.position.set((li - 1.5) * 0.025, 0.14, 0);
        leaf.rotation.z = (li - 1.5) * 0.15;
        g.add(leaf);
      }
      // Succulents sit flush on the top surface of the repositioned shelf
      g.position.set(px, shelfTopSurface, shelfZ);
      root.add(g);
    }
    makePot(DESK_X - shelfW * 0.38);
    makePot(DESK_X + shelfW * 0.38);

    // Minimal center clock sitting flush on shelf top surface
    var clockFace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.03, 24),
      new THREE.MeshStandardMaterial({ color: 0xf5f2eb, roughness: 0.6, metalness: 0.1 })
    );
    clockFace.rotation.x = Math.PI / 2;
    clockFace.position.set(DESK_X, shelfTopSurface + 0.09, shelfZ);
    root.add(clockFace);
    var clockRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.09, 0.008, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.4, metalness: 0.5 })
    );
    clockRim.position.set(DESK_X, shelfTopSurface + 0.09, shelfZ + 0.01);
    root.add(clockRim);

    // Subtle warm downlight washing softly toward desk
    var shelfWash = new THREE.PointLight(0xffeedb, 0.6, 2.2, 1.4);
    shelfWash.position.set(DESK_X, shelfY - 0.06, shelfZ - 0.04);
    root.add(shelfWash);

    var biasLight = new THREE.PointLight(0xff9922, 2.2, 3.2, 1.3);
    biasLight.position.set(DESK_X, CONSOLE_Y + CONSOLE_H / 2 + 0.15, DESK_Z - CONSOLE_D * 0.35);
    root.add(biasLight);

    // RIGHT WALL WINDOW (unchanged)
    var winZ0 = zB + 0.4;
    var winZ1 = zF - 0.4;
    var winLen = winZ1 - winZ0;
    var headerH = 0.55;
    var sillH = 0.15;
    var headerBottom = H - headerH;

    box(T, H, winZ0 - zB, xR, H / 2, (zB + winZ0) / 2);
    box(T, H, zF - winZ1, xR, H / 2, (winZ1 + zF) / 2);
    box(T, headerH, winLen, xR, headerBottom + headerH / 2, (winZ0 + winZ1) / 2);
    box(T, sillH, winLen, xR, sillH / 2, (winZ0 + winZ1) / 2);

        // Industrial Loft Window: crisp matte-black anodized steel mullions
    var winFrameMat = new THREE.MeshStandardMaterial({
      color: 0x0c0d10,
      roughness: 0.35,
      metalness: 0.7
    });

    // Outer framing
    box(0.06, headerBottom - sillH, 0.06, xR - 0.03, sillH + (headerBottom - sillH) / 2, winZ0, winFrameMat);
    box(0.06, headerBottom - sillH, 0.06, xR - 0.03, sillH + (headerBottom - sillH) / 2, winZ1, winFrameMat);
    box(0.06, 0.06, winLen, xR - 0.03, headerBottom, (winZ0 + winZ1) / 2, winFrameMat);
    box(0.06, 0.06, winLen, xR - 0.03, sillH, (winZ0 + winZ1) / 2, winFrameMat);

    // Vertical interior mullions dividing into 3 tall bays
    var bay1Z = winZ0 + winLen * 0.33;
    var bay2Z = winZ0 + winLen * 0.67;
    box(0.045, headerBottom - sillH, 0.045, xR - 0.03, sillH + (headerBottom - sillH) / 2, bay1Z, winFrameMat);
    box(0.045, headerBottom - sillH, 0.045, xR - 0.03, sillH + (headerBottom - sillH) / 2, bay2Z, winFrameMat);

    // Horizontal transom bars
    var transom1Y = sillH + (headerBottom - sillH) * 0.45;
    var transom2Y = sillH + (headerBottom - sillH) * 0.85;
    box(0.04, 0.04, winLen, xR - 0.03, transom1Y, (winZ0 + winZ1) / 2, winFrameMat);
    box(0.04, 0.04, winLen, xR - 0.03, transom2Y, (winZ0 + winZ1) / 2, winFrameMat);

    // Clear floor-to-ceiling glass pane
        // Crystal clear architectural glass (no milky haze or wash)
    var glass = new THREE.Mesh(
      new THREE.PlaneGeometry(winLen - 0.02, headerBottom - sillH - 0.02),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.02,
        transmission: 0.95,
        ior: 1.5,
        transparent: true,
        opacity: 1.0,
        reflectivity: 0.5,
        side: THREE.DoubleSide
      })
    );
    glass.rotation.y = Math.PI / 2;
    glass.position.set(xR - 0.02, sillH + (headerBottom - sillH) / 2, (winZ0 + winZ1) / 2);
    root.add(glass);

                    // ---- Confined Procedural Night City Skyline strictly framed behind window ----
    var cityGroup = new THREE.Group();
    cityGroup.name = 'exterior-city-skyline';
    __cityBeacons = [];

    // 1. Deep Inky Midnight Backdrop Plane (0x020408)
    var skyBackdropTex = createSkylineBackdropTex();
    var skyBackdropMat = new THREE.MeshStandardMaterial({
      color: 0x020408,
      map: skyBackdropTex,
      emissive: 0x03060c,
      emissiveIntensity: 0.35,
      roughness: 0.98,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    var skyBackdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(winLen + 0.2, headerBottom - sillH + 0.1),
      skyBackdropMat
    );
    skyBackdrop.rotation.y = Math.PI / 2;
    skyBackdrop.position.set(xR + 0.48, sillH + (headerBottom - sillH) / 2, (winZ0 + winZ1) / 2);
    cityGroup.add(skyBackdrop);

    // Stylized Glowing Crescent Moon in upper quadrant
    var moonGeo = new THREE.ShapeGeometry(createCrescentMoonShape(0.18), 16);
    var moonMat = new THREE.MeshStandardMaterial({
      color: 0xeeffff,
      emissive: 0xccddee,
      emissiveIntensity: 1.4,
      roughness: 0.2,
      side: THREE.DoubleSide
    });
    var moon = new THREE.Mesh(moonGeo, moonMat);
    moon.rotation.y = Math.PI / 2;
    moon.rotation.z = -0.22;
    moon.position.set(xR + 0.46, headerBottom - 0.65, winZ0 + winLen * 0.28);
    cityGroup.add(moon);

    var moonGlow = new THREE.PointLight(0xccddee, 0.35, 2.5, 1.6);
    moonGlow.position.set(xR + 0.42, headerBottom - 0.65, winZ0 + winLen * 0.28);
    cityGroup.add(moonGlow);

    // 2. Procedural 3D Skyscraper Silhouettes (tightly positioned in [xR + 0.14, xR + 0.38])
    var buildingsData = [
      { z: winZ0 + 0.35, w: 0.48, h: 2.5, d: 0.12, xOff: 0.15, fl: 14, co: 4, spire: false },
      { z: winZ0 + 0.95, w: 0.62, h: 3.6, d: 0.14, xOff: 0.25, fl: 20, co: 5, spire: true, spireH: 0.55 },
      { z: winZ0 + 1.60, w: 0.52, h: 2.2, d: 0.10, xOff: 0.14, fl: 12, co: 4, spire: false },
      { z: winZ0 + 2.25, w: 0.70, h: 4.1, d: 0.16, xOff: 0.28, fl: 24, co: 6, spire: true, spireH: 0.65 },
      { z: winZ0 + 2.95, w: 0.56, h: 2.8, d: 0.12, xOff: 0.18, fl: 16, co: 4, spire: false },
      { z: winZ0 + 3.60, w: 0.65, h: 3.4, d: 0.14, xOff: 0.26, fl: 19, co: 5, spire: true, spireH: 0.45 },
      { z: winZ0 + 4.25, w: 0.54, h: 2.4, d: 0.11, xOff: 0.16, fl: 13, co: 4, spire: false },
      { z: winZ0 + 4.90, w: 0.68, h: 3.8, d: 0.15, xOff: 0.27, fl: 22, co: 5, spire: false },
      { z: winZ0 + 5.55, w: 0.50, h: 2.1, d: 0.10, xOff: 0.15, fl: 11, co: 4, spire: false }
    ];

    var spireMat = new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.5, metalness: 0.6 });

    buildingsData.forEach(function (b) {
      var facadeTex = createBuildingFacadeTex(b.fl, b.co);
      var bMat = new THREE.MeshStandardMaterial({
        color: 0x05070c,
        map: facadeTex,
        emissive: 0xffffff,
        emissiveMap: facadeTex,
        emissiveIntensity: 1.15,
        roughness: 0.9,
        metalness: 0.08
      });
      var bMesh = new THREE.Mesh(new THREE.BoxGeometry(b.d, b.h, b.w), bMat);
      var bX = xR + b.xOff;
      bMesh.position.set(bX, sillH + b.h / 2, b.z);
      cityGroup.add(bMesh);

      // Slender communication spires & animated red rooftop warning beacons
      if (b.spire) {
        var spGeo = new THREE.CylinderGeometry(0.006, 0.012, b.spireH, 8);
        var spireMesh = new THREE.Mesh(spGeo, spireMat);
        var spireY = sillH + b.h + b.spireH / 2;
        spireMesh.position.set(bX, spireY, b.z);
        cityGroup.add(spireMesh);

        var beaconMat = new THREE.MeshStandardMaterial({
          color: 0xff1a1a,
          emissive: 0xff1111,
          emissiveIntensity: 1.0,
          roughness: 0.3
        });
        var beaconMesh = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), beaconMat);
        beaconMesh.position.set(bX, sillH + b.h + b.spireH + 0.01, b.z);
        cityGroup.add(beaconMesh);

        var beaconLight = new THREE.PointLight(0xff1111, 0.4, 1.5, 1.8);
        beaconLight.position.set(bX, sillH + b.h + b.spireH + 0.02, b.z);
        cityGroup.add(beaconLight);

        __cityBeacons.push({ mesh: beaconMesh, material: beaconMat, light: beaconLight });
      }
    });

    // 3. Distant Highway Traffic Light Trails along building bases
    var trafficSpan = winLen + 0.1;
    // Red taillight line (inward lane)
    var redTrailMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
    var redTrail = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.018, trafficSpan * 0.92), redTrailMat);
    redTrail.position.set(xR + 0.22, sillH + 0.08, (winZ0 + winZ1) / 2);
    cityGroup.add(redTrail);

    // Warm white headlight line (outward lane)
    var whiteTrailMat = new THREE.MeshBasicMaterial({ color: 0xffeedd });
    var whiteTrail = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.018, trafficSpan * 0.88), whiteTrailMat);
    whiteTrail.position.set(xR + 0.26, sillH + 0.13, (winZ0 + winZ1) / 2);
    cityGroup.add(whiteTrail);

    root.add(cityGroup);

        // 5. Recessed Ceiling Linear Graze (Top of window)
    var grazeBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.025, winLen),
      new THREE.MeshStandardMaterial({
        color: 0x14161a,
        emissive: 0xffeedd,
        emissiveIntensity: 0.6,
        roughness: 0.4
      })
    );
    grazeBar.position.set(xR - 0.06, headerBottom + 0.015, (winZ0 + winZ1) / 2);
    root.add(grazeBar);

    var windowGrazeLight = new THREE.SpotLight(0xffeedd, 0.65, 5.5, Math.PI / 3.0, 0.85, 1.3);
    windowGrazeLight.position.set(xR - 0.1, headerBottom, (winZ0 + winZ1) / 2);
    windowGrazeLight.target.position.set(xR - 0.05, 0, (winZ0 + winZ1) / 2);
    root.add(windowGrazeLight);
    root.add(windowGrazeLight.target);

    // 6. Tall Architectural Plant (Corner Focal Piece where curtain was bunched)
    var plantGroup = new THREE.Group();
    plantGroup.name = 'corner-architectural-plant';

    // Minimalist matte black / raw concrete cylinder planter
    var potMat = new THREE.MeshStandardMaterial({
      color: 0x141518,
      roughness: 0.9,
      metalness: 0.05
    });
    var pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.20, 0.55, 32), potMat);
    pot.position.y = 0.275;
    pot.castShadow = true;
    pot.receiveShadow = true;
    plantGroup.add(pot);

    // Soil inside pot
    var soil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.21, 0.21, 0.03, 24),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.98 })
    );
    soil.position.y = 0.54;
    plantGroup.add(soil);

    // Foliage: broad leaves branching gracefully on slender stalks reaching ~1.4 - 1.8 units high
    var leafMat = new THREE.MeshStandardMaterial({
      color: 0x182c1f,
      roughness: 0.45,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
    var stalkMat = new THREE.MeshStandardMaterial({
      color: 0x122218,
      roughness: 0.6
    });

    var leafConfigs = [
      { stalkH: 1.15, angleY: 0.3, leanZ: 0.22, leanX: -0.15, leafW: 0.38, leafL: 0.58, pitch: -0.4 },
      { stalkH: 1.45, angleY: 1.6, leanZ: -0.18, leanX: -0.25, leafW: 0.42, leafL: 0.64, pitch: -0.35 },
      { stalkH: 1.65, angleY: 2.8, leanZ: -0.22, leanX: 0.12, leafW: 0.44, leafL: 0.68, pitch: -0.3 },
      { stalkH: 1.35, angleY: 4.1, leanZ: 0.20, leanX: 0.22, leafW: 0.40, leafL: 0.62, pitch: -0.4 },
      { stalkH: 1.75, angleY: 5.3, leanZ: 0.05, leanX: -0.18, leafW: 0.45, leafL: 0.72, pitch: -0.25 },
      { stalkH: 0.95, angleY: 2.2, leanZ: 0.18, leanX: 0.08, leafW: 0.35, leafL: 0.52, pitch: -0.55 }
    ];

    leafConfigs.forEach(function (cfg) {
      var stalkCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 0.54, 0),
        new THREE.Vector3(cfg.leanX * 0.4, 0.54 + cfg.stalkH * 0.5, cfg.leanZ * 0.4),
        new THREE.Vector3(cfg.leanX, 0.54 + cfg.stalkH, cfg.leanZ)
      );
      var stalkGeo = new THREE.TubeGeometry(stalkCurve, 12, 0.012, 8, false);
      var stalkMesh = new THREE.Mesh(stalkGeo, stalkMat);
      stalkMesh.castShadow = true;
      plantGroup.add(stalkMesh);

      var leafGeo = createFiddleLeafGeo(cfg.leafW, cfg.leafL);
      var leafMesh = new THREE.Mesh(leafGeo, leafMat);
      leafMesh.position.set(cfg.leanX, 0.54 + cfg.stalkH, cfg.leanZ);
      leafMesh.rotation.y = cfg.angleY;
      leafMesh.rotation.x = cfg.pitch;
      leafMesh.castShadow = true;
      leafMesh.receiveShadow = true;
      plantGroup.add(leafMesh);
    });

    plantGroup.position.set(xR - 0.45, 0, winZ0 + 0.48);
    root.add(plantGroup);

    scene.add(root);
  }

  function patchNeonClick() {
    if (window.__neonClickPatched) return;
    if (typeof renderer === 'undefined' || !renderer || !renderer.domElement) {
      setTimeout(patchNeonClick, 200);
      return;
    }
    window.__neonClickPatched = true;
    var ray = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    var last = 0;
    renderer.domElement.addEventListener(
      'pointerdown',
      function (event) {
        if (!window.__cycleNeonColor) return;
        if (performance.now() - last < 280) return;
        try {
          var rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          ray.setFromCamera(mouse, camera);
          var hits = ray.intersectObjects(scene.children, true);
          for (var i = 0; i < hits.length; i++) {
            var t = hits[i].object;
            while (t && t !== scene) {
              if (t.userData && t.userData.name === 'neonSign') {
                last = performance.now();
                event.stopImmediatePropagation();
                window.__cycleNeonColor();
                return;
              }
              t = t.parent;
            }
          }
        } catch (e) {}
      },
      true
    );
  }

  function applyView() {
    if (typeof camera === 'undefined' || typeof controls === 'undefined' || !camera || !controls) {
      setTimeout(applyView, 150);
      return;
    }
    if (window.__isoViewApplied) return;
    window.__isoViewApplied = true;
    controls.target.set(0.3, 1.1, 0.4);
    camera.position.set(-7.5, 6.8, 8.5);
    camera.lookAt(0.3, 1.1, 0.4);
    controls.enablePan = false;
    controls.minDistance = 10;
    controls.maxDistance = 18;
    controls.minAzimuthAngle = -Math.PI / 8;
    controls.maxAzimuthAngle = Math.PI / 6;
    controls.minPolarAngle = Math.PI / 3.8;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.1;
    if (controls.update) controls.update();
  }

  function loadFurniture() {
    if (window.__furnitureAdded) return;
    function run() {
      if (window.__furnitureAdded) return;
      if (typeof createOfficeChair !== 'function') {
        setTimeout(run, 100);
        return;
      }
      window.__furnitureAdded = true;
      try {
        createOfficeChair();
        placeWorkstation();
      } catch (e) {
        console.warn(e);
      }
    }
    if (!document.querySelector('script[data-furniture]')) {
      var s = document.createElement('script');
      s.src = 'furniture.js?v=layout2';
      s.setAttribute('data-furniture', '1');
      s.onload = run;
      document.body.appendChild(s);
    } else run();
  }

  fetch(ORIG_URL, { cache: 'no-cache' })
    .then(function (r) {
      return r.text();
    })
    .then(function (code) {
      // The original scene uses top-level `let` declarations.  Because it is
      // loaded dynamically, those bindings are not visible to this layout
      // controller.  Promote only its scene-state declarations to globals so
      // the room replacement below can reliably remove the old floor and add
      // the dark rug, wall, trim, and shelf.
      [
        'scene, camera, renderer, controls',
        'desk, monitor, keyboard, mouse, decorations',
        'raycaster, pointer',
        'isAnimating = false',
        'hoveredObject = null',
        'pointerStart = null',
        'pointerStartTime = 0',
        'lampBulb, lampLight, isLampOn = true',
        'keyboardLight',
        'keyboardColorIndex = 0',
        'steamParticles = []',
        'tabletScreenMesh, tabletCanvas, tabletCtx, tabletTexture, tabletNoteIndex = 0',
        'jukebox, jukeboxLight, jukeboxBulb, jukeboxBulbLight, vinylDisc, isJukeboxPlaying = false',
        'balloonMesh, balloonMaterial, balloonWobbleTime = 0, balloonColorIndex = 0'
      ].forEach(function (declaration) {
        code = code.replace('let ' + declaration + ';', 'var ' + declaration + ';');
      });
      var s = document.createElement('script');
      s.textContent = code;
      document.body.appendChild(s);

      function boot() {
        if (typeof init === 'function' && typeof scene === 'undefined') {
          try {
            init();
          } catch (e) {}
        }
        if (typeof scene === 'undefined') {
          setTimeout(boot, 100);
          return;
        }
        applyView();
        setTimeout(function () {
          window.__dioramaBuilt = false;
          removeOriginalWallsAndFloor();
          buildRoom();
          removeLegacyFloorMat();
          placeWorkstation();
          applyLighting();
          patchNeonClick();
          loadFurniture();
          setTimeout(function () {
            removeLegacyFloorMat();
            placeWorkstation();
          }, 500);
          setTimeout(function () {
            removeLegacyFloorMat();
            placeWorkstation();
          }, 1400);
        }, 300);
      }
      setTimeout(boot, 50);
    })
    .catch(function (err) {
      console.error(err);
    });
})();
