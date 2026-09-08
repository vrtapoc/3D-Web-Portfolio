// Hybrid camera patch (loads after scene.js)
(function hybridCameraPatch() {
  function apply() {
    if (typeof camera === 'undefined' || typeof controls === 'undefined' || !camera || !controls) {
      setTimeout(apply, 200);
      return;
    }
    if (window.__hybridCamApplied) return;
    window.__hybridCamApplied = true;

    camera.position.set(0, 6.4, 13.2);
    camera.lookAt(0, 1.2, 0.3);
    controls.target.set(0, 1.2, 0.3);
    controls.minDistance = 9;
    controls.maxDistance = 22;
    controls.minPolarAngle = Math.PI / 5;
    controls.maxPolarAngle = Math.PI / 2.35;
    controls.minAzimuthAngle = -Math.PI / 3.2;
    controls.maxAzimuthAngle = Math.PI / 3.2;
    controls.autoRotateSpeed = 0.35;
    controls.update();
    console.log('Hybrid camera applied');
  }
  window.addEventListener('load', function () { setTimeout(apply, 1100); });
})();
