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
const descriptionElement = document.getElementById('descriptionTyping');

if (roleElement) {
    typewriterEffect(roleElement, ['Vibe Coder', 'Front End Developer', 'Web Developer', 'Marketing Management'], {
        typeDelay: 100,
        deleteDelay: 80,
        pauseDelay: 1800
    });
}

if (descriptionElement) {
    descriptionElement.textContent = '';
}

// Hide intro on button click
enterBtn.addEventListener('click', hideIntro);

function hideIntro() {
    introScreen.classList.add('hidden');
    document.body.classList.remove('intro-active');
    setTimeout(() => {
        introScreen.style.display = 'none';
    }, 800);
}

// Digital Clock with user's timezone
function updateClock() {
    const now = new Date();

    // Time
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('clockTime').textContent = `${hours}:${minutes}:${seconds}`;

    // Date
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    document.getElementById('clockDate').textContent = now.toLocaleDateString('en-US', options);
}

// Update clock every second
updateClock();
setInterval(updateClock, 1000);

// Modal controls
const portfolioModal = document.getElementById('portfolioModal');
const closeModal = document.getElementById('closeModal');

closeModal.addEventListener('click', () => {
    portfolioModal.classList.remove('active');
    document.body.style.overflow = 'auto';

    // Reset camera position
    if (typeof camera !== 'undefined' && typeof controls !== 'undefined') {
        controls.autoRotate = true;
        const duration = 1000;
        const startTime = Date.now();
        const startPosition = {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        };
        const targetPosition = { x: 0, y: 4, z: 8 };

        function animateBack() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            camera.position.x = startPosition.x + (targetPosition.x - startPosition.x) * eased;
            camera.position.y = startPosition.y + (targetPosition.y - startPosition.y) * eased;
            camera.position.z = startPosition.z + (targetPosition.z - startPosition.z) * eased;

            camera.lookAt(0, 1.3, 0);

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

// Close modal on background click
portfolioModal.addEventListener('click', (e) => {
    if (e.target === portfolioModal) {
        closeModal.click();
    }
});

// Modal navigation
const modalNavBtns = document.querySelectorAll('.modal-nav-btn');
const modalSections = document.querySelectorAll('.modal-section');

modalNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetSection = btn.getAttribute('data-section');

        // Remove active class from all buttons and sections
        modalNavBtns.forEach(b => b.classList.remove('active'));
        modalSections.forEach(s => s.classList.remove('active'));

        // Add active class to clicked button and corresponding section
        btn.classList.add('active');
        document.getElementById(`${targetSection}-section`).classList.add('active');
    });
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && portfolioModal.classList.contains('active')) {
        closeModal.click();
    }
});

// Add loading animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});
