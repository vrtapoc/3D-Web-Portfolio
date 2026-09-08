/*
 * Dollhouse cutaway diorama walls:
 * 1) Stepped / angled top silhouette (not a straight rectangle)
 * 2) Real wall thickness (extruded depth on cut edges)
 * 3) Recessed window with frame + reveal
 * Left side stays open. Original props untouched.
 */
(function () {
  var GOOD_SCENE_URL =
    'https://raw.githubusercontent.com/vrtapoc/3D-Web-Portfolio/e85884eca00ae0cd9dc9f3d523d1d14a99f376e5/scene.js';

  function removeOriginalWalls() {
    if (typeof scene === 'undefined' || !scene) return;
    var kill = [];
    scene.traverse(function (obj) {
      if (!obj.isMesh && !obj.isGroup) return;
      var p = obj.position || { x: 0, y: 0, z: 0 };
      // Original left / right wall planes
      if (Math.abs(p.x + 7.5) < 0.6 || Math.abs(p.x - 7.5) < 0.6) {
        kill.push(obj);
        return;
      }
      // Original back wall plane at z ≈ -3, y ≈ 4
      if (Math.abs(p.z + 3) < 0.4 && Math.abs(p.y - 4) < 2.5 && Math.abs(p.x) < 1) {
        // only kill large plane-like back walls, not posters near z=-3
        if (obj.isMesh && obj.geometry && obj.geometry.type === 'PlaneGeometry') {
          kill.push(obj);
        }
      }
      if (obj.name === 'diorama-walls' || obj.name === 'right-wall-window') {
        kill.push(obj);
      }
    });
    kill.forEach(function (obj) {
      try {
        obj.visible = false;
        if (obj.parent) obj.parent.remove(obj);
      } catch (e) {}
    });
  }

  /** Build a thick wall panel with stepped top from a height profile along its length */
  function buildSteppedWall(options) {
    var axis = options.axis; // 'x' or 'z' — wall runs along this axis
    var length = options.length;
    var baseY = 0;
    var thickness = options.thickness || 0.45;
    var heights = options.heights; // array of { t: 0..1, h: number } samples along length
    var center = options.center; // {x,z}
    var inward = options.inward; // direction the interior faces (normalized on X or Z)
    var color = options.color || 0x3a3a3a;
    var segments = options.segments || 12;

    var mat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.94,
      metalness: 0.02
    });

    var group = new THREE.Group();

    function heightAt(t) {
      // linear interpolate profile
      if (t <= heights[0].t) return heights[0].h;
      if (t >= heights[heights.length - 1].t) return heights[heights.length - 1].h;
      for (var i = 0; i < heights.length - 1; i++) {
        var a = heights[i];
        var b = heights[i + 1];
        if (t >= a.t && t <= b.t) {
          var u = (t - a.t) / (b.t - a.t || 1);
          return a.h + (b.h - a.h) * u;
        }
      }
      return heights[heights.length - 1].h;
    }

    // Build as series of vertical boxes with varying height (stepped silhouette)
    var segLen = length / segments;
    for (var s = 0; s < segments; s++) {
      var t0 = s / segments;
      var t1 = (s + 1) / segments;
      var h = Math.max(heightAt((t0 + t1) / 2), 0.5);
      var box = new THREE.Mesh(
        new THREE.BoxGeometry(
          axis === 'z' ? thickness : segLen * 1.02,
          h,
          axis === 'z' ? segLen * 1.02 : thickness
        ),
        mat
      );
      var along = -length / 2 + segLen * (s + 0.5);
      if (axis === 'z') {
        box.position.set(center.x, baseY + h / 2, center.z + along);
      } else {
        box.position.set(center.x + along, baseY + h / 2, center.z);
      }
      box.castShadow = true;
      box.receiveShadow = true;
      group.add(box);
    }

    // Cap the open cut edge with a slightly darker face so thickness reads clearly
    var maxH = 0;
    heights.forEach(function (p) {
      if (p.h > maxH) maxH = p.h;
    });
    var edgeMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.9,
      metalness: 0.04
    });
    // Interior-facing lip along full length at top of average height — skip; thickness of boxes is enough

    group.userData.inward = inward;
    group.userData.thickness = thickness;
    group.userData.center = center;
    group.userData.axis = axis;
    group.userData.length = length;
    return group;
  }

  function buildDioramaWalls() {
    if (typeof THREE === 'undefined' || typeof scene === 'undefined' || !scene) return;
    if (window.__dioramaBuilt) return;
    window.__dioramaBuilt = true;

    var root = new THREE.Group();
    root.name = 'diorama-walls';

    // ---- BACK WALL (runs along X, at z ≈ -3) — stepped top ----
    // Profile: higher in center-left, drops in steps toward right (cutaway feel)
    var back = buildSteppedWall({
      axis: 'x',
      length: 15,
      thickness: 0.5,
      center: { x: 0, z: -3.15 },
      inward: { x: 0, z: 1 },
      color: 0x3a3a3a,
      segments: 16,
      heights: [
        { t: 0.0, h: 6.2 },
        { t: 0.12, h: 7.4 },
        { t: 0.28, h: 7.8 },
        { t: 0.45, h: 7.2 },
        { t: 0.58, h: 6.6 },
        { t: 0.72, h: 7.0 },
        { t: 0.88, h: 5.8 },
        { t: 1.0, h: 5.2 }
      ]
    });
    root.add(back);

    // ---- RIGHT WALL (runs along Z, at x ≈ 7.5) — stepped + window recess ----
    // Build in pieces so we can cut a recessed window opening
    var WALL_X = 7.35;
    var WALL_Z = 4.5;
    var WALL_LEN = 15;
    var THICK = 0.55;
    var wallMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.94,
      metalness: 0.02
    });
    var edgeMat = new THREE.MeshStandardMaterial({
      color: 0x2c2c2c,
      roughness: 0.9,
      metalness: 0.04
    });

    // Height profile along Z for right wall (stepped silhouette)
    function rightHeight(t) {
      var pts = [
        { t: 0.0, h: 5.4 },
        { t: 0.15, h: 6.8 },
        { t: 0.35, h: 7.6 },
        { t: 0.55, h: 7.2 },
        { t: 0.75, h: 6.4 },
        { t: 0.9, h: 5.6 },
        { t: 1.0, h: 4.8 }
      ];
      if (t <= 0) return pts[0].h;
      if (t >= 1) return pts[pts.length - 1].h;
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i];
        var b = pts[i + 1];
        if (t >= a.t && t <= b.t) {
          var u = (t - a.t) / (b.t - a.t || 1);
          return a.h + (b.h - a.h) * u;
        }
      }
      return pts[pts.length - 1].h;
    }

    // Window opening
    var winW = 3.8;
    var winH = 3.8;
    var winBottom = 1.55;
    var winCenterZ = WALL_Z + 0.4;
    var winZ0 = winCenterZ - winW / 2;
    var winZ1 = winCenterZ + winW / 2;
    var z0 = WALL_Z - WALL_LEN / 2;
    var z1 = WALL_Z + WALL_LEN / 2;

    var REVEAL = 0.28; // how much wall pushes outward around window
    var outerX = WALL_X + REVEAL; // exterior face pushed out

    function addSeg(zA, zB, yBot, yTop, xCenter, thick) {
      var len = zB - zA;
      if (len < 0.05 || yTop - yBot < 0.05) return;
      var h = yTop - yBot;
      var mesh = new THREE.Mesh(
        new THREE.BoxGeometry(thick, h, len),
        wallMat
      );
      mesh.position.set(xCenter, (yBot + yTop) / 2, (zA + zB) / 2);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      root.add(mesh);
    }

    // Stepped segments outside window band
    var SEGS = 18;
    for (var s = 0; s < SEGS; s++) {
      var ta = s / SEGS;
      var tb = (s + 1) / SEGS;
      var za = z0 + WALL_LEN * ta;
      var zb = z0 + WALL_LEN * tb;
      var h = rightHeight((ta + tb) / 2);

      // Skip pure window interior (handled as reveal frame)
      var mid = (za + zb) / 2;
      if (mid > winZ0 && mid < winZ1) {
        // only below + above window
        addSeg(za, zb, 0, winBottom, WALL_X, THICK);
        if (h > winBottom + winH) {
          addSeg(za, zb, winBottom + winH, h, WALL_X, THICK);
        }
      } else {
        addSeg(za, zb, 0, h, WALL_X, THICK);
      }
    }

    // --- Recessed window: outer reveal frame pushed outward ---
    // Sides of reveal (thickness between interior wall plane and outer)
    function revealSide(z) {
      var m = new THREE.Mesh(
        new THREE.BoxGeometry(REVEAL + 0.06, winH, 0.14),
        edgeMat
      );
      m.position.set(WALL_X + REVEAL / 2, winBottom + winH / 2, z);
      m.castShadow = true;
      root.add(m);
    }
    revealSide(winZ0);
    revealSide(winZ1);

    // Top + bottom reveal slabs
    var revTop = new THREE.Mesh(
      new THREE.BoxGeometry(REVEAL + 0.06, 0.14, winW),
      edgeMat
    );
    revTop.position.set(WALL_X + REVEAL / 2, winBottom + winH, winCenterZ);
    root.add(revTop);

    var revBot = new THREE.Mesh(
      new THREE.BoxGeometry(REVEAL + 0.06, 0.14, winW),
      edgeMat
    );
    revBot.position.set(WALL_X + REVEAL / 2, winBottom, winCenterZ);
    root.add(revBot);

    // Outer face frame around window (pushed out)
    var outerFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, winH + 0.35, winW + 0.35),
      wallMat
    );
    outerFrame.position.set(outerX, winBottom + winH / 2, winCenterZ);
    // hollow look via just border pieces instead of solid block:
    root.remove(outerFrame);

    // Outer border pieces (picture-frame around opening on exterior)
    function outerBorder(h, lenZ, y, z) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(0.14, h, lenZ), wallMat);
      m.position.set(outerX, y, z);
      m.castShadow = true;
      root.add(m);
    }
    outerBorder(winH + 0.4, 0.2, winBottom + winH / 2, winZ0 - 0.05); // left of opening along Z
    outerBorder(winH + 0.4, 0.2, winBottom + winH / 2, winZ1 + 0.05);
    outerBorder(0.2, winW + 0.4, winBottom + winH + 0.1, winCenterZ); // top
    outerBorder(0.2, winW + 0.4, winBottom - 0.05, winCenterZ); // bottom outer

    // Interior window frame (dark wood)
    var frameMat = new THREE.MeshStandardMaterial({
      color: 0x2a2218,
      roughness: 0.5,
      metalness: 0.18
    });
    var frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, winH + 0.15, winW + 0.15),
      frameMat
    );
    frame.position.set(WALL_X - THICK / 2 + 0.02, winBottom + winH / 2, winCenterZ);
    root.add(frame);

    // Pane muntins
    var muntV = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, winH - 0.2, 0.09),
      frameMat
    );
    muntV.position.set(WALL_X - THICK / 2 + 0.02, winBottom + winH / 2, winCenterZ);
    root.add(muntV);
    var muntH = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.09, winW - 0.2),
      frameMat
    );
    muntH.position.set(WALL_X - THICK / 2 + 0.02, winBottom + winH / 2, winCenterZ);
    root.add(muntH);

    // Glass
    var glass = new THREE.Mesh(
      new THREE.PlaneGeometry(winW - 0.3, winH - 0.3),
      new THREE.MeshStandardMaterial({
        color: 0x9ec5e0,
        transparent: true,
        opacity: 0.32,
        roughness: 0.08,
        metalness: 0.12,
        side: THREE.DoubleSide
      })
    );
    glass.position.set(WALL_X - THICK / 2 - 0.05, winBottom + winH / 2, winCenterZ);
    glass.rotation.y = Math.PI / 2;
    root.add(glass);

    // View
    var c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    var ctx = c.getContext('2d');
    var grd = ctx.createLinearGradient(0, 0, 0, 512);
    grd.addColorStop(0, '#a8c8e0');
    grd.addColorStop(0.5, '#d8e6f0');
    grd.addColorStop(1, '#b8d0a8');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 512, 512);
    for (var i = 0; i < 22; i++) {
      ctx.beginPath();
      ctx.arc(
        30 + Math.random() * 450,
        50 + Math.random() * 320,
        20 + Math.random() * 55,
        0,
        Math.PI * 2
      );
      ctx.fillStyle =
        Math.random() > 0.35 ? 'rgba(140,80,170,0.5)' : 'rgba(70,130,70,0.45)';
      ctx.fill();
    }
    var view = new THREE.Mesh(
      new THREE.PlaneGeometry(winW - 0.25, winH - 0.25),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) })
    );
    view.position.set(WALL_X + REVEAL + 0.15, winBottom + winH / 2, winCenterZ);
    view.rotation.y = -Math.PI / 2;
    root.add(view);

    // Curtains inside reveal
    var curtainMat = new THREE.MeshStandardMaterial({
      color: 0xf0ebe3,
      roughness: 0.88,
      side: THREE.DoubleSide
    });
    var curtain = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, winH - 0.25, 0.95),
      curtainMat
    );
    curtain.position.set(WALL_X - THICK / 2 - 0.12, winBottom + winH / 2, winZ0 + 0.55);
    curtain.castShadow = true;
    root.add(curtain);

    // Sill (extends into room)
    var sill = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.1, winW + 0.15),
      new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.7 })
    );
    sill.position.set(WALL_X - THICK / 2 - 0.2, winBottom, winCenterZ);
    sill.castShadow = true;
    sill.receiveShadow = true;
    root.add(sill);

    scene.add(root);
  }

  function applyView() {
    if (typeof camera === 'undefined' || typeof controls === 'undefined' || !camera || !controls) {
      setTimeout(applyView, 150);
      return;
    }
    if (window.__isoViewApplied) return;
    window.__isoViewApplied = true;

    camera.position.set(-9.5, 10.5, 9.8);
    camera.lookAt(0, 1.4, 0.5);
    controls.target.set(0, 1.4, 0.5);
    controls.minDistance = 10;
    controls.maxDistance = 26;
    controls.minPolarAngle = Math.PI / 6;
    controls.maxPolarAngle = Math.PI / 2.4;
    controls.minAzimuthAngle = -Math.PI / 1.7;
    controls.maxAzimuthAngle = Math.PI / 3.2;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.25;
    if (controls.update) controls.update();

    setTimeout(function () {
      window.__dioramaBuilt = false;
      removeOriginalWalls();
      buildDioramaWalls();
    }, 250);
  }

  function loadFurniture() {
    if (typeof scene === 'undefined' || !scene) {
      setTimeout(loadFurniture, 200);
      return;
    }
    if (window.__furnitureAdded) return;

    function runCreates() {
      if (window.__furnitureAdded) return;
      if (typeof createLobbyChair !== 'function') {
        setTimeout(runCreates, 100);
        return;
      }
      window.__furnitureAdded = true;
      try {
        if (typeof createOfficeChair === 'function') createOfficeChair();
        createLobbyChair();
      } catch (e) {
        console.warn('Furniture create failed', e);
      }
    }

    if (!document.querySelector('script[data-furniture]')) {
      var s = document.createElement('script');
      s.src = 'furniture.js?v=dio1';
      s.setAttribute('data-furniture', '1');
      s.onload = runCreates;
      document.body.appendChild(s);
    } else {
      runCreates();
    }
  }

  function afterSceneCodeInjected() {
    function ensureInit() {
      if (typeof init === 'function' && typeof scene === 'undefined') {
        try {
          init();
        } catch (e) {
          console.warn('init error', e);
        }
      }
      if (typeof scene === 'undefined') {
        setTimeout(ensureInit, 100);
        return;
      }
      applyView();
      loadFurniture();
    }
    setTimeout(ensureInit, 50);
  }

  fetch(GOOD_SCENE_URL, { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('Failed to fetch good scene: ' + r.status);
      return r.text();
    })
    .then(function (code) {
      var script = document.createElement('script');
      script.textContent = code;
      document.body.appendChild(script);
      afterSceneCodeInjected();
    })
    .catch(function (err) {
      console.error(err);
      var el = document.getElementById('loadingScreen');
      if (el) {
        el.style.opacity = '1';
        el.innerHTML =
          '<div style="color:#fff;padding:2rem;font-family:monospace;text-align:center">Scene load failed. Hard-refresh.<br/>' +
          String(err) +
          '</div>';
      }
    });
})();
