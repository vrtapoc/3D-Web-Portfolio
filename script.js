// Intro Screen
document.body.classList.add('intro-active');

const introScreen = document.getElementById('introScreen');
const enterBtn = document.getElementById('enterBtn');

function typewriterEffect(element, phrases, options = {}) {
    const {
        typeDelay = 100,
        deleteDelay = 80,
        pauseDelay = 1600,
        loop = true
    } = options;

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function tick() {
        const activePhrase = phrases[phraseIndex];

        if (!deleting) {
            charIndex += 1;
            element.textContent = activePhrase.slice(0, charIndex);

            if (charIndex >= activePhrase.length) {
                deleting = true;
                setTimeout(tick, pauseDelay);
                return;
            }
        } else {
            charIndex -= 1;
            element.textContent = activePhrase.slice(0, charIndex);

            if (charIndex <= 0) {
                deleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
            }
        }

        setTimeout(tick, deleting ? deleteDelay : typeDelay);
    }

    tick();
}

const roleElement = document.getElementById('roleTyping');
if (roleElement) {
    typewriterEffect(roleElement, ['Vibe Coder', 'Front End Developer', 'Web Developer', 'Marketing Management'], {
        typeDelay: 100,
        deleteDelay: 80,
        pauseDelay: 1800
    });
}

const introPercent = document.getElementById('introPercent');

function runIntroLoader() {
    const totalDuration = 2200;
    const startTime = Date.now();

    const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const rawProgress = Math.min(1, elapsed / totalDuration);

        let easedProgress = rawProgress;
        if (rawProgress < 0.9) {
            easedProgress = Math.pow(rawProgress / 0.9, 0.8) * 0.9;
        } else {
            const lateProgress = (rawProgress - 0.9) / 0.1;
            easedProgress = 0.9 + Math.pow(lateProgress, 2.4) * 0.1;
        }

        const progressVal = Math.floor(easedProgress * 100);

        if (introPercent) {
            const paddedNum = String(progressVal).padStart(3, '0');
            introPercent.innerHTML = `${paddedNum}<span class="percent-symbol">%</span>`;
        }

        if (rawProgress >= 1) {
            clearInterval(interval);
            if (introPercent) {
                introPercent.innerHTML = `100<span class="percent-symbol">%</span>`;
            }
            if (enterBtn) {
                enterBtn.classList.remove('hidden');
            }
        }
    }, 25);
}

runIntroLoader();

if (enterBtn) {
    enterBtn.addEventListener('click', hideIntro);
}

function hideIntro() {
    if (window.playEnterSound) {
        window.playEnterSound();
    }
    introScreen.classList.add('hidden');
    document.body.classList.remove('intro-active');
    setTimeout(() => {
        introScreen.style.display = 'none';
    }, 800);
}

window.playEnterSound = function() {
    try {
        const audio = new Audio('assets/Among Us (Role Reveal) - Sound Effect (HD).mp3');
        audio.volume = 1;
        audio.play();
    } catch (e) {
        console.warn('Enter Sound playback failed:', e);
    }
};

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('clockTime').textContent = `${hours}:${minutes}:${seconds}`;
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    document.getElementById('clockDate').textContent = now.toLocaleDateString('en-US', options);
}

updateClock();
setInterval(updateClock, 1000);

const portfolioModal = document.getElementById('portfolioModal');
const closeModal = document.getElementById('closeModal');

closeModal.addEventListener('click', () => {
    portfolioModal.classList.remove('active');
    document.body.style.overflow = 'auto';

    if (typeof camera !== 'undefined' && typeof controls !== 'undefined') {
        controls.autoRotate = true;
        const duration = 1000;
        const startTime = Date.now();
        const startPosition = {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        };
        const targetPosition = { x: 0, y: 4.8, z: 10.8 };

        function animateBack() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            camera.position.x = startPosition.x + (targetPosition.x - startPosition.x) * eased;
            camera.position.y = startPosition.y + (targetPosition.y - startPosition.y) * eased;
            camera.position.z = startPosition.z + (targetPosition.z - startPosition.z) * eased;

            camera.lookAt(0, 2.0, 0);

            if (progress < 1) {
                requestAnimationFrame(animateBack);
            } else {
                controls.enabled = true;
                isAnimating = false;
            }
        }

        animateBack();
    }
});

portfolioModal.addEventListener('click', (e) => {
    if (e.target === portfolioModal) {
        closeModal.click();
    }
});

const modalNavBtns = document.querySelectorAll('.modal-nav-btn');
const modalSections = document.querySelectorAll('.modal-section');
const railIcons = document.querySelectorAll('.rail-icon');

function scrollModalToTop() {
    if (!portfolioModal) return;

    // Instant reset — works more reliably on iOS Safari than scrollTo alone
    portfolioModal.scrollTop = 0;
    try {
        portfolioModal.scrollTo(0, 0);
    } catch (e) {}

    const content = portfolioModal.querySelector('.modal-content');
    if (content) content.scrollTop = 0;

    // Second pass after layout paints (mobile sticky headers / section swap)
    requestAnimationFrame(() => {
        portfolioModal.scrollTop = 0;
        try {
            portfolioModal.scrollTo(0, 0);
        } catch (e) {}
    });
}

function goToSection(targetSection) {
    if (!targetSection) return;

    modalNavBtns.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-section') === targetSection);
    });
    modalSections.forEach(s => s.classList.remove('active'));

    const sectionEl = document.getElementById(`${targetSection}-section`);
    if (sectionEl) sectionEl.classList.add('active');

    setActiveRail(targetSection);
    scrollModalToTop();
}

function setActiveRail(section) {
    railIcons.forEach(icon => {
        icon.classList.toggle('active', icon.getAttribute('data-rail') === section);
    });
    document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-section') === section);
    });
}

setActiveRail('about');

modalNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        goToSection(btn.getAttribute('data-section'));
    });
});

railIcons.forEach(icon => {
    icon.setAttribute('role', 'button');
    icon.setAttribute('tabindex', '0');
    icon.style.pointerEvents = 'auto';
    icon.style.cursor = 'pointer';

    icon.addEventListener('click', (e) => {
        e.stopPropagation();
        goToSection(icon.getAttribute('data-rail'));
    });

    icon.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            goToSection(icon.getAttribute('data-rail'));
        }
    });
});

document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        goToSection(btn.getAttribute('data-section'));
    });
});

window.showToast = function(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
};

let audioCtx = null;
window.playUiSound = function(type) {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'sip') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(520, now + 0.15);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'boing') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(460, now + 0.12);
            osc.frequency.exponentialRampToValueAtTime(260, now + 0.28);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            osc.start(now);
            osc.stop(now + 0.28);
        } else if (type === 'toggle') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        }
    } catch (e) {}
};

let jukeboxInterval = null;
window.playJukeboxBeats = function(isPlaying) {
    if (!isPlaying) {
        if (jukeboxInterval) {
            clearInterval(jukeboxInterval);
            jukeboxInterval = null;
        }
        return;
    }

    if (jukeboxInterval) clearInterval(jukeboxInterval);

    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const bassLine = [
            { freq: 146.83, dur: 0.50 },
            { freq: 164.81, dur: 0.50 },
            { freq: 174.61, dur: 0.50 },
            { freq: 196.00, dur: 0.50 },
            { freq: 185.00, dur: 0.50 },
            { freq: 164.81, dur: 0.50 },
            { freq: 130.81, dur: 0.50 },
            { freq: 146.83, dur: 0.50 }
        ];

        const chordSets = [
            [293.66, 369.99, 440.00, 523.25],
            [392.00, 493.88, 587.33, 698.46],
            [261.63, 329.63, 392.00, 493.88],
            [220.00, 277.18, 329.63, 415.30]
        ];

        let step = 0;

        const playStep = () => {
            if (!audioCtx) return;
            const now = audioCtx.currentTime;
            const note = bassLine[step % bassLine.length];
            const chordIdx = Math.floor(step / 2) % chordSets.length;
            const chords = chordSets[chordIdx];

            const bassOsc = audioCtx.createOscillator();
            const bassGain = audioCtx.createGain();
            bassOsc.type = 'sine';
            bassOsc.frequency.setValueAtTime(note.freq, now);
            bassGain.gain.setValueAtTime(0, now);
            bassGain.gain.linearRampToValueAtTime(0.28, now + 0.02);
            bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
            bassOsc.connect(bassGain);
            bassGain.connect(audioCtx.destination);
            bassOsc.start(now);
            bassOsc.stop(now + 0.48);

            if (step % 2 === 0) {
                chords.forEach(freq => {
                    const cOsc = audioCtx.createOscillator();
                    const cGain = audioCtx.createGain();
                    cOsc.type = 'triangle';
                    cOsc.frequency.setValueAtTime(freq, now);
                    cGain.gain.setValueAtTime(0, now);
                    cGain.gain.linearRampToValueAtTime(0.07, now + 0.02);
                    cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
                    cOsc.connect(cGain);
                    cGain.connect(audioCtx.destination);
                    cOsc.start(now);
                    cOsc.stop(now + 0.9);
                });
            }

            step++;
        };

        playStep();
        jukeboxInterval = setInterval(playStep, 480);
    } catch (e) {
        console.warn('Jukebox jazz playback failed:', e);
    }
};

document.querySelectorAll('.nav-email, a[href^="mailto:"]').forEach(link => {
    link.addEventListener('click', (e) => {
        const email = 'connect@bosstcode.com';
        if (navigator.clipboard) {
            navigator.clipboard.writeText(email).then(() => {
                if (window.showToast) window.showToast(`📋 Copied ${email} to clipboard!`);
                if (window.playUiSound) window.playUiSound('click');
            });
        }
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (portfolioModal && portfolioModal.classList.contains('active')) {
            closeModal.click();
        }
    }
});

window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});
