g');
    } else if (name === 'jukebox') {
        isJukeboxPlaying = !isJukeboxPlaying;
        if (jukeboxLight) jukeboxLight.intensity = isJukeboxPlaying ? 1.4 : 0.3;
        updateJukeboxBulbState();
        if (window.showToast) window.showToast(isJukeboxPlaying ? '📻 Jukebox ON: Playing Retro Beats!' : '📻 Jukebox OFF');
        if (window.playJukeboxBeats) window.playJukeboxBeats(isJukeboxPlaying);
    }
}

function zoomToMonitor() {
    isAnimating = true;
    controls.enabled = false;
    controls.autoRotate = false;
    tooltip.style.display = 'none';

    const targetPosition = { x: 0, y: 2, z: 2.5 };
    const duration = 1200;
    const startTime = Date.now();
    const startPosition = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
    };

    function animateCamera() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(progress);

        camera.position.x = startPosition.x + (targetPosition.x - startPosition.x) * eased;
        camera.position.y = startPosition.y + (targetPosition.y - startPosition.y) * eased;
        camera.position.z = startPosition.z + (targetPosition.z - startPosition.z) * eased;

        camera.lookAt(0, 1.8, 0);

        if (progress < 1) {
            requestAnimationFrame(animateCamera);
        } else {
            setTimeout(() => {
                document.getElementById('portfolioModal').classList.add('active');
                document.body.style.overflow = 'hidden';
            }, 200);
        }
    }

    animateCamera();
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    const time = Date.now() * 0.001;

    if (monitor) {
        monitor.children.forEach(child => {
            if (child.userData && child.userData.isMonitorGlow) {
                const bounce = Math.sin(time * 3.2) * 0.045;
                child.position.y = 2.28 + bounce;
                const scale = 1 + Math.sin(time * 3.2) * 0.08;
                child.scale.set(scale, scale, scale);
            }

            if (child.userData && child.userData.isMonitorLight) {
                child.intensity = 0.35 + Math.sin(time * 3.2) * 0.25;
                child.position.y = 2.28 + Math.sin(time * 3.2) * 0.045;
            }
        });
    }

    if (balloonMesh) {
        const floatY = Math.sin(time * 2.2) * 0.025;
        let wobble = 0;
        if (balloonWobbleTime) {
            const dt = (Date.now() - balloonWobbleTime) * 0.001;
            if (dt < 1.2) {
                wobble = Math.sin(dt * 22) * Math.exp(-dt * 3.5) * 0.07;
            }
        }
        balloonMesh.position.y = 1.95 + floatY + wobble;
    }

    if (vinylDisc && isJukeboxPlaying) {
        vinylDisc.rotation.z += 0.06;
    }

    if (steamParticles && steamParticles.length > 0) {
        steamParticles.forEach(p => {
            p.position.y += p.userData.speed;
            p.position.x += Math.sin(time * 2 + p.userData.offset) * 0.0003;
            p.material.opacity = Math.max(0, 0.25 - (p.position.y - 0.14) * 1.5);
            if (p.position.y > 0.32) {
                p.position.y = 0.14;
                p.material.opacity = 0.2;
            }
        });
    }

    renderer.render(scene, camera);
}

window.addEventListener('load', () => {
    setTimeout(() => {
        init();
    }, 100);
});
