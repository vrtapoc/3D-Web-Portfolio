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
        var moonlight = new THREE.DirectionalLight(0xffecd8, 0.38);
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

    // Warm doorway ambient fill — subtle warm spill from the door corridor
    var warmFill = new THREE.PointLight(0xffd580, 0.45, 4.2, 1.8);
    warmFill.position.set(-3.15, 1.6, zB + 1.0);
    warmFill.name = 'door-warm-fill';
    scene.add(warmFill);

    // Deep indigo/navy atmospheric fog outside
    scene.fog = new THREE.Fog(0x060c1c, 16, 48);

    // Bloom via EffectComposer (targeting neon sign and screen glows)
    (function tryBloom() {
      if (typeof THREE.EffectComposer === 'undefined' ||
          typeof THREE.RenderPass === 'undefined' ||
          typeof THREE.UnrealBloomPass === 'undefined') {
        setTimeout(tryBloom, 200);
        return;
      }
      if (window.__bloomApplied) return;
      window.__bloomApplied = true;
      try {
        var composer = new THREE.EffectComposer(renderer);
        composer.addPass(new THREE.RenderPass(scene, camera));
        var bloom = new THREE.UnrealBloomPass(
          new THREE.Vector2(window.innerWidth, window.innerHeight),
          0.48,   // subtle bloom strength
          0.35,   // radius
          0.75    // threshold (catches neon sign and bright highlights)
        );
        composer.addPass(bloom);
        window.__dioramaComposer = composer;

        // Hijack renderer.render seamlessly without creating extra rAF loops
        if (!window.__rendererRenderHijacked && renderer && renderer.render) {
          window.__rendererRenderHijacked = true;
          var origRender = renderer.render.bind(renderer);
          var isRenderingComposer = false;
          renderer.render = function (s, c) {
            if (window.__dioramaComposer && !isRenderingComposer) {
              isRenderingComposer = true;
              try {
                window.__dioramaComposer.render();
              } finally {
                isRenderingComposer = false;
              }
            } else {
              origRender(s, c);
            }
          };
          window.addEventListener('resize', function () {
            if (window.__dioramaComposer) {
              window.__dioramaComposer.setSize(window.innerWidth, window.innerHeight);
            }
          });
        }
      } catch (e) {
        console.warn('[Bloom] EffectComposer setup:', e);
      }
    })();
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

    // Staging Area: Cluster Jukebox, Balloon Lamp, and Floor Lamp along FAR-LEFT room wall
    if (typeof jukebox !== 'undefined' && jukebox) {
      jukebox.position.set(-4.1, 0, 1.4);
      jukebox.rotation.y = Math.PI * 0.45;
    }

    scene.traverse(function (obj) {
      if (obj.userData && obj.userData.name === 'balloon') {
        obj.position.set(-4.15, 0, 2.5);
        // Ensure red/pink balloon color
        if (typeof balloonMaterial !== 'undefined' && balloonMaterial) {
          balloonMaterial.color.setHex(0xd94747);
        }
      }
      if (obj.userData && obj.userData.name === 'lamp') {
        obj.position.set(-4.1, 0, 0.4);
        obj.rotation.y = 0.85;
      }
    });
    buildModernOfficeChair();

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

    function createRealisticCityFacadeTex(floors, cols) {
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#040508';
    ctx.fillRect(0, 0, 256, 512);

    var floorH = 512 / floors;
    var colW = 256 / cols;
    var winW = colW * 0.55;
    var winH = floorH * 0.45;
    var padX = (colW - winW) / 2;
    var padY = (floorH - winH) / 2;

    var warmColors = ['#ffb86c', '#fff4e6', '#ffd08a'];

    for (var f = 0; f < floors; f++) {
      // 40% of entire floors are dark (after hours / vacant)
      var floorIsActive = Math.random() > 0.42;
      if (!floorIsActive) continue;

      // Sometimes a continuous horizontal illuminated office strip
      var isStrip = Math.random() < 0.28;
      if (isStrip) {
        var stripColor = warmColors[Math.floor(Math.random() * warmColors.length)];
        ctx.fillStyle = stripColor;
        ctx.fillRect(padX, f * floorH + padY, 256 - padX * 2, winH);
        continue;
      }

      for (var c = 0; c < cols; c++) {
        // Clustered lit offices (~30% of windows on active floors)
        if (Math.random() < 0.32) {
          var winColor = warmColors[Math.floor(Math.random() * warmColors.length)];
          ctx.fillStyle = winColor;
          ctx.fillRect(c * colW + padX, f * floorH + padY, winW, winH);
        }
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

  function createClassicalMuralTexture() {
    var cvs = document.createElement('canvas');
    cvs.width = 2048;
    cvs.height = 1720;
    var ctx = cvs.getContext('2d');

    // 1. Deep Matte Charcoal Background with subtle vignette and stone grain
    var bgGrad = ctx.createRadialGradient(800, 860, 100, 1024, 860, 1400);
    bgGrad.addColorStop(0.0, '#101319');
    bgGrad.addColorStop(0.5, '#0a0c10');
    bgGrad.addColorStop(1.0, '#060709');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 2048, 1720);

    // Subtle stone texture noise
    var imgData = ctx.getImageData(0, 0, 2048, 1720);
    var d = imgData.data;
    for (var n = 0; n < d.length; n += 4) {
      var noise = (Math.random() - 0.5) * 12;
      d[n] = Math.min(255, Math.max(0, d[n] + noise));
      d[n + 1] = Math.min(255, Math.max(0, d[n + 1] + noise));
      d[n + 2] = Math.min(255, Math.max(0, d[n + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // 2. Classical Statue Face (Sculptural Chiaroscuro in Monochrome Marble)
    var cx = 680;
    var cy = 820;

    ctx.save();

    // Ambient back-glow behind head silhouette
    var headGlow = ctx.createRadialGradient(cx - 50, cy - 80, 80, cx, cy, 750);
    headGlow.addColorStop(0.0, 'rgba(32, 40, 54, 0.35)');
    headGlow.addColorStop(0.6, 'rgba(18, 24, 34, 0.18)');
    headGlow.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = headGlow;
    ctx.fillRect(0, 0, 2048, 1720);

    // Neck & Trapezius / Shoulder Base
    var neckGrad = ctx.createLinearGradient(cx - 250, 1100, cx + 350, 1720);
    neckGrad.addColorStop(0.0, '#12151b');
    neckGrad.addColorStop(0.35, '#2e3544');
    neckGrad.addColorStop(0.65, '#181b22');
    neckGrad.addColorStop(1.0, '#090a0d');
    ctx.fillStyle = neckGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 280, 1720);
    ctx.quadraticCurveTo(cx - 220, 1300, cx - 160, 1120);
    ctx.lineTo(cx + 180, 1100);
    ctx.quadraticCurveTo(cx + 260, 1320, cx + 420, 1720);
    ctx.closePath();
    ctx.fill();

    // Sternocleidomastoid muscle & clavicle hollow highlights
    var muscleGrad = ctx.createLinearGradient(cx - 120, 1120, cx + 80, 1600);
    muscleGrad.addColorStop(0.0, 'rgba(120, 135, 155, 0.45)');
    muscleGrad.addColorStop(0.5, 'rgba(75, 88, 105, 0.25)');
    muscleGrad.addColorStop(1.0, 'rgba(20, 25, 35, 0.0)');
    ctx.fillStyle = muscleGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 110, 1150);
    ctx.quadraticCurveTo(cx - 30, 1350, cx + 50, 1650);
    ctx.quadraticCurveTo(cx + 10, 1680, cx - 40, 1500);
    ctx.quadraticCurveTo(cx - 90, 1320, cx - 130, 1180);
    ctx.closePath();
    ctx.fill();

    // Throat shadow
    var throatShadow = ctx.createLinearGradient(cx - 50, 1120, cx + 180, 1350);
    throatShadow.addColorStop(0.0, 'rgba(4, 5, 8, 0.95)');
    throatShadow.addColorStop(0.7, 'rgba(8, 10, 14, 0.6)');
    throatShadow.addColorStop(1.0, 'rgba(12, 14, 18, 0.0)');
    ctx.fillStyle = throatShadow;
    ctx.beginPath();
    ctx.moveTo(cx - 40, 1130);
    ctx.quadraticCurveTo(cx + 80, 1180, cx + 180, 1260);
    ctx.quadraticCurveTo(cx + 100, 1400, cx + 20, 1380);
    ctx.closePath();
    ctx.fill();

    // Main Head Form (Jaw, Cheeks, Forehead)
    var faceGrad = ctx.createRadialGradient(cx - 80, cy - 60, 60, cx + 50, cy + 80, 520);
    faceGrad.addColorStop(0.0, '#424c5e');
    faceGrad.addColorStop(0.4, '#242a36');
    faceGrad.addColorStop(0.75, '#13171f');
    faceGrad.addColorStop(1.0, '#07080b');
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 240, 620);
    ctx.quadraticCurveTo(cx - 280, 840, cx - 210, 1050);
    ctx.quadraticCurveTo(cx - 120, 1200, cx - 10, 1210);
    ctx.quadraticCurveTo(cx + 160, 1190, cx + 240, 1060);
    ctx.quadraticCurveTo(cx + 310, 850, cx + 280, 660);
    ctx.quadraticCurveTo(cx + 200, 360, cx - 20, 340);
    ctx.quadraticCurveTo(cx - 180, 360, cx - 240, 620);
    ctx.closePath();
    ctx.fill();

    // Sculptural Forehead Highlight Planes
    var fhGrad = ctx.createLinearGradient(cx - 200, 420, cx + 180, 600);
    fhGrad.addColorStop(0.0, 'rgba(145, 160, 185, 0.55)');
    fhGrad.addColorStop(0.35, 'rgba(105, 120, 142, 0.40)');
    fhGrad.addColorStop(0.7, 'rgba(45, 55, 70, 0.15)');
    fhGrad.addColorStop(1.0, 'rgba(10, 14, 20, 0.0)');
    ctx.fillStyle = fhGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 190, 480);
    ctx.quadraticCurveTo(cx - 50, 420, cx + 120, 450);
    ctx.quadraticCurveTo(cx + 170, 560, cx + 110, 640);
    ctx.quadraticCurveTo(cx - 60, 620, cx - 180, 590);
    ctx.closePath();
    ctx.fill();

    // Brow ridge sculpted highlights
    var browGrad = ctx.createLinearGradient(cx - 160, 610, cx + 120, 650);
    browGrad.addColorStop(0.0, 'rgba(175, 190, 215, 0.7)');
    browGrad.addColorStop(0.4, 'rgba(125, 140, 165, 0.5)');
    browGrad.addColorStop(1.0, 'rgba(30, 38, 50, 0.1)');
    ctx.fillStyle = browGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 160, 630);
    ctx.quadraticCurveTo(cx - 60, 605, cx + 40, 625);
    ctx.quadraticCurveTo(cx + 120, 640, cx + 100, 660);
    ctx.quadraticCurveTo(cx + 20, 645, cx - 60, 635);
    ctx.quadraticCurveTo(cx - 130, 655, cx - 160, 630);
    ctx.closePath();
    ctx.fill();

    // Classical Greek Nose Bridge & Tip
    var noseGrad = ctx.createLinearGradient(cx - 70, 660, cx + 40, 960);
    noseGrad.addColorStop(0.0, 'rgba(180, 195, 220, 0.85)');
    noseGrad.addColorStop(0.3, 'rgba(150, 168, 195, 0.80)');
    noseGrad.addColorStop(0.7, 'rgba(195, 210, 235, 0.90)');
    noseGrad.addColorStop(1.0, 'rgba(60, 70, 88, 0.2)');
    ctx.fillStyle = noseGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 50, 660);
    ctx.lineTo(cx - 38, 880);
    ctx.quadraticCurveTo(cx - 45, 935, cx - 20, 945);
    ctx.lineTo(cx + 15, 935);
    ctx.quadraticCurveTo(cx + 20, 915, cx - 5, 905);
    ctx.lineTo(cx - 15, 680);
    ctx.closePath();
    ctx.fill();

    // Nose shadow
    var noseShadow = ctx.createLinearGradient(cx - 15, 700, cx + 80, 940);
    noseShadow.addColorStop(0.0, 'rgba(5, 7, 10, 0.85)');
    noseShadow.addColorStop(0.7, 'rgba(10, 14, 20, 0.65)');
    noseShadow.addColorStop(1.0, 'rgba(20, 25, 35, 0.0)');
    ctx.fillStyle = noseShadow;
    ctx.beginPath();
    ctx.moveTo(cx - 10, 680);
    ctx.lineTo(cx + 65, 920);
    ctx.quadraticCurveTo(cx + 25, 955, cx - 15, 948);
    ctx.lineTo(cx - 5, 905);
    ctx.closePath();
    ctx.fill();

    // Left Cheekbone Highlight
    var cheekGrad = ctx.createRadialGradient(cx - 130, 820, 20, cx - 100, 840, 220);
    cheekGrad.addColorStop(0.0, 'rgba(155, 172, 198, 0.65)');
    cheekGrad.addColorStop(0.45, 'rgba(90, 105, 128, 0.35)');
    cheekGrad.addColorStop(1.0, 'rgba(15, 18, 25, 0.0)');
    ctx.fillStyle = cheekGrad;
    ctx.beginPath();
    ctx.ellipse(cx - 130, 820, 120, 160, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Classical Sculpted Lips & Philtrum
    var philGrad = ctx.createLinearGradient(cx - 35, 940, cx - 10, 995);
    philGrad.addColorStop(0.0, 'rgba(160, 175, 200, 0.55)');
    philGrad.addColorStop(1.0, 'rgba(70, 80, 100, 0.15)');
    ctx.fillStyle = philGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 30, 948);
    ctx.lineTo(cx - 26, 995);
    ctx.lineTo(cx - 12, 995);
    ctx.lineTo(cx - 15, 948);
    ctx.closePath();
    ctx.fill();

    // Upper Lip
    ctx.fillStyle = '#11141c';
    ctx.beginPath();
    ctx.moveTo(cx - 85, 1005);
    ctx.quadraticCurveTo(cx - 22, 990, cx - 20, 1000);
    ctx.quadraticCurveTo(cx - 18, 990, cx + 45, 1010);
    ctx.quadraticCurveTo(cx - 20, 1025, cx - 85, 1005);
    ctx.closePath();
    ctx.fill();

    // Lower Lip
    var lipGrad = ctx.createLinearGradient(cx - 70, 1010, cx + 30, 1060);
    lipGrad.addColorStop(0.0, 'rgba(170, 185, 210, 0.85)');
    lipGrad.addColorStop(0.45, 'rgba(120, 135, 160, 0.70)');
    lipGrad.addColorStop(1.0, 'rgba(35, 42, 55, 0.3)');
    ctx.fillStyle = lipGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 75, 1010);
    ctx.quadraticCurveTo(cx - 20, 1020, cx + 35, 1015);
    ctx.quadraticCurveTo(cx - 15, 1065, cx - 75, 1010);
    ctx.closePath();
    ctx.fill();

    // Under-lip shadow
    ctx.fillStyle = '#06080b';
    ctx.beginPath();
    ctx.moveTo(cx - 65, 1055);
    ctx.quadraticCurveTo(cx - 20, 1070, cx + 25, 1058);
    ctx.quadraticCurveTo(cx - 20, 1090, cx - 65, 1055);
    ctx.closePath();
    ctx.fill();

    // Chin Prominence
    var chinGrad = ctx.createRadialGradient(cx - 25, 1130, 15, cx - 20, 1140, 110);
    chinGrad.addColorStop(0.0, 'rgba(195, 212, 238, 0.90)');
    chinGrad.addColorStop(0.5, 'rgba(110, 125, 150, 0.45)');
    chinGrad.addColorStop(1.0, 'rgba(10, 14, 20, 0.0)');
    ctx.fillStyle = chinGrad;
    ctx.beginPath();
    ctx.ellipse(cx - 25, 1130, 85, 65, 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Jawline Ridge
    var jawGrad = ctx.createLinearGradient(cx - 180, 1060, cx + 240, 1070);
    jawGrad.addColorStop(0.0, 'rgba(150, 165, 190, 0.65)');
    jawGrad.addColorStop(0.4, 'rgba(95, 110, 130, 0.35)');
    jawGrad.addColorStop(0.75, 'rgba(135, 150, 175, 0.55)');
    jawGrad.addColorStop(1.0, 'rgba(20, 25, 35, 0.0)');
    ctx.strokeStyle = jawGrad;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(cx - 200, 1050);
    ctx.quadraticCurveTo(cx - 110, 1185, cx - 15, 1205);
    ctx.quadraticCurveTo(cx + 140, 1180, cx + 230, 1065);
    ctx.stroke();

    // Classical Sculpted Curls
    var curlConfigs = [
      { x: cx - 220, y: 380, r: 65, rot: 0.3, col: '#8a96aa' },
      { x: cx - 140, y: 320, r: 75, rot: -0.2, col: '#a2afc2' },
      { x: cx - 50, y: 290, r: 85, rot: 0.4, col: '#b8c5d8' },
      { x: cx + 55, y: 305, r: 80, rot: -0.3, col: '#9ca9bc' },
      { x: cx + 150, y: 350, r: 70, rot: 0.5, col: '#808d9e' },
      { x: cx + 230, y: 430, r: 65, rot: -0.4, col: '#677382' },
      { x: cx - 270, y: 460, r: 60, rot: 0.2, col: '#727e90' },
      { x: cx - 290, y: 560, r: 55, rot: -0.3, col: '#5c6674' },
      { x: cx + 290, y: 530, r: 60, rot: 0.4, col: '#55606d' },
      { x: cx + 295, y: 640, r: 50, rot: -0.2, col: '#48525e' },
      { x: cx - 110, y: 400, r: 70, rot: 0.6, col: '#95a3b6' },
      { x: cx + 10, y: 380, r: 75, rot: -0.5, col: '#aebbd0' },
      { x: cx + 110, y: 410, r: 65, rot: 0.3, col: '#8895a6' }
    ];

    curlConfigs.forEach(function (c) {
      ctx.fillStyle = '#0f1218';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();

      var cGrad = ctx.createRadialGradient(c.x - c.r * 0.3, c.y - c.r * 0.3, 5, c.x, c.y, c.r);
      cGrad.addColorStop(0.0, c.col);
      cGrad.addColorStop(0.5, 'rgba(45, 55, 70, 0.4)');
      cGrad.addColorStop(1.0, 'rgba(10, 14, 20, 0.0)');
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.arc(c.x - 4, c.y - 4, c.r * 0.85, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = c.col;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r * 0.65, c.rot, c.rot + Math.PI * 1.2);
      ctx.stroke();
    });

    // 3. Horizontal Dry-Brush Eye Blindfold Band (Artistic Obscuration)
    var bandY = 740;
    var bandH = 145;

    var darkBandGrad = ctx.createLinearGradient(120, bandY, 1350, bandY);
    darkBandGrad.addColorStop(0.0, 'rgba(4, 5, 8, 0.96)');
    darkBandGrad.addColorStop(0.7, 'rgba(7, 9, 14, 0.94)');
    darkBandGrad.addColorStop(0.9, 'rgba(12, 16, 24, 0.7)');
    darkBandGrad.addColorStop(1.0, 'rgba(10, 12, 16, 0.0)');
    ctx.fillStyle = darkBandGrad;
    ctx.fillRect(120, bandY - bandH / 2, 1200, bandH);

    var brushSeed = 42;
    function bRand() {
      brushSeed = (brushSeed * 9301 + 49297) % 233280;
      return brushSeed / 233280;
    }

    for (var b = 0; b < 65; b++) {
      var by = bandY - bandH / 2 + bRand() * bandH;
      var bx0 = 100 + bRand() * 120;
      var bLen = 600 + bRand() * 650;
      var bThick = 1.5 + bRand() * 6.5;

      var bShade = Math.floor(bRand() * 3);
      var bCol = 'rgba(215, 225, 240, ';
      var bAlpha = 0.25 + bRand() * 0.55;
      if (bShade === 1) {
        bCol = 'rgba(110, 130, 158, ';
        bAlpha = 0.35 + bRand() * 0.45;
      } else if (bShade === 2) {
        bCol = 'rgba(20, 26, 36, ';
        bAlpha = 0.6 + bRand() * 0.35;
      }

      ctx.strokeStyle = bCol + bAlpha + ')';
      ctx.lineWidth = bThick;
      ctx.beginPath();
      ctx.moveTo(bx0, by);
      ctx.lineTo(bx0 + bLen, by + (bRand() - 0.5) * 6);
      ctx.stroke();
    }

    var highlightStreaks = [
      { y: bandY - 45, x0: 220, len: 950, w: 4.5, op: 0.8 },
      { y: bandY - 18, x0: 160, len: 1080, w: 6.0, op: 0.9 },
      { y: bandY + 8, x0: 260, len: 880, w: 3.5, op: 0.7 },
      { y: bandY + 35, x0: 190, len: 1020, w: 5.0, op: 0.85 },
      { y: bandY + 58, x0: 280, len: 780, w: 3.0, op: 0.65 }
    ];

    highlightStreaks.forEach(function (st) {
      var sGrad = ctx.createLinearGradient(st.x0, st.y, st.x0 + st.len, st.y);
      sGrad.addColorStop(0.0, 'rgba(235, 242, 255, 0.0)');
      sGrad.addColorStop(0.15, 'rgba(235, 242, 255, ' + st.op + ')');
      sGrad.addColorStop(0.65, 'rgba(195, 210, 235, ' + (st.op * 0.85) + ')');
      sGrad.addColorStop(1.0, 'rgba(140, 160, 190, 0.0)');
      ctx.strokeStyle = sGrad;
      ctx.lineWidth = st.w;
      ctx.beginPath();
      ctx.moveTo(st.x0, st.y);
      ctx.lineTo(st.x0 + st.len, st.y);
      ctx.stroke();
    });

    ctx.restore();

    // 4. Elegant Minimal Typography on the Right Side
    var textX = 1580;
    var startY = 620;
    var lineGap = 135;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    var lines = ['LESS', 'DISTRACTIONS', 'MORE', 'RESULTS'];

    lines.forEach(function (line, idx) {
      var ly = startY + idx * lineGap;
      var fontSize = (line === 'DISTRACTIONS') ? 66 : 74;
      ctx.font = '500 ' + fontSize + 'px "Space Grotesk", "Segoe UI", sans-serif';

      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 6;

      var spaced = line.split('').join(line === 'DISTRACTIONS' ? '  ' : '   ');
      ctx.fillStyle = '#ded8cc';
      ctx.fillText(spaced, textX, ly);

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 250, 240, 0.15)';
      ctx.fillText(spaced, textX, ly - 1);
    });

    var ruleY = startY + (lines.length - 1) * lineGap + 120;
    var ruleW = 260;
    var ruleGrad = ctx.createLinearGradient(textX - ruleW / 2, ruleY, textX + ruleW / 2, ruleY);
    ruleGrad.addColorStop(0.0, 'rgba(222, 216, 204, 0.0)');
    ruleGrad.addColorStop(0.2, 'rgba(222, 216, 204, 0.55)');
    ruleGrad.addColorStop(0.8, 'rgba(222, 216, 204, 0.55)');
    ruleGrad.addColorStop(1.0, 'rgba(222, 216, 204, 0.0)');
    ctx.fillStyle = ruleGrad;
    ctx.fillRect(textX - ruleW / 2, ruleY, ruleW, 2.5);

    var tex = new THREE.CanvasTexture(cvs);
    tex.needsUpdate = true;
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function buildModernOfficeChair() {
    var existing = scene.getObjectByName('office-chair');
    if (existing) scene.remove(existing);

    var chair = new THREE.Group();
    chair.name = 'office-chair';

    var shellMat = new THREE.MeshStandardMaterial({
      color: 0x16171b,
      roughness: 0.55,
      metalness: 0.1
    });
    var metalMat = new THREE.MeshStandardMaterial({
      color: 0x101114,
      metalness: 0.8,
      roughness: 0.25
    });

    // Sleek single-piece contoured executive shell (smooth continuous curved seat + back)
    var profile = new THREE.Shape();
    profile.moveTo(0.26, 0.0);
    profile.lineTo(0.26, 0.06);
    profile.quadraticCurveTo(-0.18, 0.05, -0.22, 0.14);
    profile.quadraticCurveTo(-0.29, 0.48, -0.27, 0.82);
    profile.quadraticCurveTo(-0.25, 0.90, -0.29, 0.92);
    profile.lineTo(-0.33, 0.90);
    profile.quadraticCurveTo(-0.35, 0.46, -0.27, 0.09);
    profile.quadraticCurveTo(-0.21, -0.01, 0.24, -0.01);
    profile.closePath();

    var shellGeo = new THREE.ExtrudeGeometry(profile, {
      depth: 0.62,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02
    });
    shellGeo.center();

    var shellMesh = new THREE.Mesh(shellGeo, shellMat);
    shellMesh.position.set(0, 0.84, 0);
    shellMesh.rotation.y = Math.PI / 2;
    shellMesh.castShadow = true;
    shellMesh.receiveShadow = true;
    chair.add(shellMesh);

    // Minimalist gunmetal loop armrests on each side
    [-1, 1].forEach(function (side) {
      var armCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.33, 0.52, 0.06),
        new THREE.Vector3(side * 0.35, 0.76, 0.15),
        new THREE.Vector3(side * 0.35, 0.78, -0.12),
        new THREE.Vector3(side * 0.33, 0.62, -0.22)
      ]);
      var armGeo = new THREE.TubeGeometry(armCurve, 20, 0.015, 8, false);
      var armMesh = new THREE.Mesh(armGeo, metalMat);
      armMesh.castShadow = true;
      chair.add(armMesh);
    });

    // Central support column
    var column = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.42, 16), metalMat);
    column.position.y = 0.24;
    column.castShadow = true;
    chair.add(column);

    // 5-Point star base with clean miniature caster wheels
    var hub = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.05, 16), metalMat);
    hub.position.y = 0.08;
    chair.add(hub);

    for (var i = 0; i < 5; i++) {
      var angle = (i / 5) * Math.PI * 2;
      var legLen = 0.38;
      var leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, legLen), metalMat);
      leg.position.set(Math.sin(angle) * (legLen / 2 + 0.03), 0.07, Math.cos(angle) * (legLen / 2 + 0.03));
      leg.rotation.y = angle;
      leg.castShadow = true;
      chair.add(leg);

      var wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.03, 12), metalMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(Math.sin(angle) * (legLen + 0.035), 0.035, Math.cos(angle) * (legLen + 0.035));
      wheel.castShadow = true;
      chair.add(wheel);
    }

    // Centered cleanly behind desk on rug, facing desk with subtle ~15°-20° welcoming angle toward isometric camera
    chair.position.set(0.18, 0, DESK_Z + 0.58);
    chair.rotation.y = 2.78 - Math.PI;
    scene.add(chair);
    return chair;
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
    var doorW = 1.3;
    var doorH = 3.2;
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
      { hex: 0x00f3ff, str: '#00f3ff' }, // Cyan
      { hex: 0xff007f, str: '#ff007f' }, // Magenta
      { hex: 0xffaa00, str: '#ffaa00' }, // Amber
      { hex: 0x00ff66, str: '#00ff66' }, // Green
      { hex: 0xa855f7, str: '#a855f7' }  // Purple
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

      var fresh = new THREE.CanvasTexture(neonCanvas);
      if (THREE.SRGBColorSpace) fresh.colorSpace = THREE.SRGBColorSpace;
      fresh.needsUpdate = true;
      var oldMap = neonLogoMat.map;
      neonLogoMat.map = fresh;
      if (neonLogoMat.color) neonLogoMat.color.set(c.hex);
      if (neonLogoMat.emissive) neonLogoMat.emissive.set(c.hex);
      neonLogoMat.needsUpdate = true;
      neonTex = fresh;
      if (oldMap && oldMap.dispose) {
        try { oldMap.dispose(); } catch (e) {}
      }

      // Point light & underglow color sync + realistic ignition flicker
      if (__neonLight) {
        __neonLight.color.setHex(c.hex);
        __neonLight.intensity = 0.2;
        setTimeout(function () {
          if (__neonLight) __neonLight.intensity = 1.8;
          setTimeout(function () {
            if (__neonLight) __neonLight.intensity = 0.4;
            setTimeout(function () {
              if (__neonLight) __neonLight.intensity = 2.4;
            }, 50);
          }, 50);
        }, 40);
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

    // ---- RIGHT WALL: Large Sculptural Art Mural ("LESS DISTRACTIONS MORE RESULTS") ----
    var wallD = zF - zB;
    var wallZ = (zB + zF) / 2;

    // Solid right wall base
    box(T, H, wallD, xR, H / 2, wallZ, wallMat);

    // Full-Wall Classical Sculpture Art Mural
    var muralW = wallD - 0.22; // 6.68 wide along Z
    var muralH = H - 0.24;     // 5.56 tall along Y
    var muralTex = createClassicalMuralTexture();
    var muralMat = new THREE.MeshStandardMaterial({
      map: muralTex,
      roughness: 0.72,
      metalness: 0.06,
      bumpMap: microCementBump,
      bumpScale: 0.0016
    });

    var mural = new THREE.Mesh(new THREE.PlaneGeometry(muralW, muralH), muralMat);
    mural.rotation.y = -Math.PI / 2;
    mural.position.set(xR - T / 2 - 0.006, H / 2, wallZ);
    mural.receiveShadow = true;
    root.add(mural);

    // Sleek minimal architectural border frame (matte dark charcoal profile)
    var frameMat = new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.45, metalness: 0.6 });
    var fT = 0.035; // thickness
    var fD = 0.025; // depth
    var fX = xR - T / 2 - fD / 2;

    box(fD, fT, muralW + 0.06, fX, H / 2 + muralH / 2 + fT / 2, wallZ, frameMat);
    box(fD, fT, muralW + 0.06, fX, H / 2 - muralH / 2 - fT / 2, wallZ, frameMat);
    box(fD, muralH, fT, fX, H / 2, wallZ - muralW / 2 - fT / 2, frameMat);
    box(fD, muralH, fT, fX, H / 2, wallZ + muralW / 2 + fT / 2, frameMat);

    // Recessed ceiling linear graze light washing softly over the art mural
    var grazeBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.025, wallD * 0.75),
      new THREE.MeshStandardMaterial({
        color: 0x14161a,
        emissive: 0xffeedd,
        emissiveIntensity: 0.5,
        roughness: 0.4
      })
    );
    grazeBar.position.set(xR - T / 2 - 0.06, H - 0.06, wallZ);
    root.add(grazeBar);

    var muralWashLight = new THREE.SpotLight(0xffeedd, 0.85, 7.5, Math.PI / 3.0, 0.85, 1.2);
    muralWashLight.position.set(xR - T / 2 - 0.35, H - 0.05, wallZ);
    muralWashLight.target.position.set(xR - T / 2, 2.6, wallZ);
    root.add(muralWashLight);
    root.add(muralWashLight.target);

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
      setTimeout(patchNeonClick, 150);
      return;
    }
    window.__neonClickPatched = true;

    var ray = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    var isHovered = false;
    var pointerDownPos = new THREE.Vector2();

    function checkNeonHit(clientX, clientY) {
      if (!camera || !scene) return false;
      var rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(mouse, camera);
      var hits = ray.intersectObjects(scene.children, true);
      for (var i = 0; i < hits.length; i++) {
        var obj = hits[i].object;
        while (obj && obj !== scene) {
          if (obj.userData && obj.userData.name === 'neonSign') return true;
          obj = obj.parent;
        }
      }
      return false;
    }

    // Set cursor to pointer on hover
    window.addEventListener('pointermove', function (e) {
      var hit = checkNeonHit(e.clientX, e.clientY);
      if (hit) {
        document.body.style.cursor = 'pointer';
        isHovered = true;
      } else if (isHovered) {
        document.body.style.cursor = 'default';
        isHovered = false;
      }
    }, { passive: true });

    window.addEventListener('pointerdown', function (e) {
      pointerDownPos.set(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('pointerup', function (e) {
      var dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 10) return; // Ignore camera orbit drags
      if (checkNeonHit(e.clientX, e.clientY)) {
        if (window.__cycleNeonColor) {
          window.__cycleNeonColor();
        }
      }
    }, { passive: true });
  }

  function applyView() {
    if (typeof camera === 'undefined' || typeof controls === 'undefined' || !camera || !controls) {
      setTimeout(applyView, 150);
      return;
    }
    if (window.__isoViewApplied) return;
    window.__isoViewApplied = true;
    controls.target.set(0.3, 1.1, 0.4);
    // Pulled back by ~22% for wider isometric diorama framing with full negative space
    camera.position.set(-9.25, 8.05, 10.3);
    camera.lookAt(0.3, 1.1, 0.4);
    controls.enablePan = false;
    controls.minDistance = 12;
    controls.maxDistance = 26;
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
          buildModernOfficeChair();
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
