// ===== Configuration =====
const FRAME_COUNT = 192;
const FRAME_SPEED = 2.0;
const IMAGE_SCALE = 0.88;

// ===== DOM Elements =====
const loader = document.getElementById('loader');
const loaderProgress = document.getElementById('loader-progress');
const loaderPercent = document.getElementById('loader-percent');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const canvasWrap = document.getElementById('canvas-wrap');
const darkOverlay = document.getElementById('dark-overlay');
const scrollContainer = document.getElementById('scroll-container');
const heroSection = document.querySelector('.hero-standalone');

let frames = [];
let currentFrame = 0;
let bgColor = '#000000';

// ===== Canvas Setup =====
function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
}

// ===== Draw Frame =====
function drawFrame(index) {
  const img = frames[index];
  if (!img) return;

  const rect = canvas.getBoundingClientRect();
  const cw = rect.width;
  const ch = rect.height;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  // Padded cover mode
  const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;

  // Fill with background color
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, cw, ch);

  // Draw image
  ctx.drawImage(img, dx, dy, dw, dh);
}

// ===== Sample Background Color =====
function sampleBgColor(index) {
  const img = frames[index];
  if (!img) return;

  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = 10;
  tempCanvas.height = 10;

  try {
    tempCtx.drawImage(img, 0, 0, 10, 10);
    const pixel = tempCtx.getImageData(0, 0, 1, 1).data;
    bgColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
  } catch (e) {
    // Cross-origin issue, use default
  }
}

// ===== Frame Preloader =====
async function preloadFrames() {
  const total = FRAME_COUNT;
  let loaded = 0;

  // Load first 10 frames immediately
  const immediateLoads = Math.min(10, total);
  for (let i = 0; i < immediateLoads; i++) {
    await loadFrame(i);
    loaded++;
    updateLoader(loaded, total);
  }

  // Load remaining frames in background
  const promises = [];
  for (let i = immediateLoads; i < total; i++) {
    promises.push(loadFrame(i).then(() => {
      loaded++;
      updateLoader(loaded, total);
    }));
  }

  await Promise.all(promises);

  // Sample background color from first few frames
  sampleBgColor(0);

  // Hide loader
  setTimeout(() => {
    loader.classList.add('hidden');
    initHeroAnimation();
  }, 500);
}

function loadFrame(index) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      frames[index] = img;
      resolve();
    };
    img.onerror = () => resolve(); // Skip failed frames
    img.src = `frames/frame_${String(index).padStart(4, '0')}.jpg`;
  });
}

function updateLoader(loaded, total) {
  const percent = Math.round((loaded / total) * 100);
  loaderProgress.style.width = percent + '%';
  loaderPercent.textContent = percent + '%';
}

// ===== Hero Animation =====
function initHeroAnimation() {
  const words = document.querySelectorAll('.hero-heading .word');
  const tagline = document.querySelector('.hero-tagline');
  const scrollIndicator = document.querySelector('.scroll-indicator');

  const tl = gsap.timeline({ delay: 0.3 });

  tl.to(words, {
    y: 0,
    opacity: 1,
    duration: 1.2,
    stagger: 0.15,
    ease: 'power4.out'
  })
  .to(tagline, {
    opacity: 1,
    y: 0,
    duration: 1,
    ease: 'power3.out'
  }, '-=0.6')
  .to(scrollIndicator, {
    opacity: 1,
    duration: 1,
    ease: 'power3.out'
  }, '-=0.5');

  // Start scroll triggers
  initScrollTriggers();
}

// ===== Lenis Smooth Scroll =====
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true
});

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// ===== Scroll Triggers =====
function initScrollTriggers() {
  setupFrameBinding();
  setupSectionAnimations();
  setupMarquee();
  setupDarkOverlay();
  setupHeroTransition();
}

// Frame to scroll binding
function setupFrameBinding() {
  ScrollTrigger.create({
    trigger: scrollContainer,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const accelerated = Math.min(self.progress * FRAME_SPEED, 1);
      const index = Math.min(Math.floor(accelerated * FRAME_COUNT), FRAME_COUNT - 1);

      if (index !== currentFrame) {
        currentFrame = index;

        // Sample bg color every 20 frames
        if (index % 20 === 0) {
          sampleBgColor(index);
        }

        requestAnimationFrame(() => drawFrame(currentFrame));
      }
    }
  });
}

// Section animations
function setupSectionAnimations() {
  const sections = document.querySelectorAll('.scroll-section');

  sections.forEach((section) => {
    setupSectionAnimation(section);
  });
}

function setupSectionAnimation(section) {
  const type = section.dataset.animation;
  const persist = section.dataset.persist === 'true';
  const enter = parseFloat(section.dataset.enter);
  const leave = parseFloat(section.dataset.leave);

  const children = section.querySelectorAll(
    '.section-label, .section-heading, .section-body, .cta-button, .stat'
  );

  // Set initial state
  gsap.set(children, { opacity: 0 });

  // Create timeline
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: scrollContainer,
      start: `${enter}% top`,
      end: `${leave}% top`,
      scrub: 1,
      onEnter: () => {
        section.style.opacity = '1';
        section.style.visibility = 'visible';
      },
      onLeave: () => {
        if (!persist) {
          gsap.to(children, {
            opacity: 0,
            duration: 0.5,
            ease: 'power2.in'
          });
        }
      },
      onEnterBack: () => {
        section.style.opacity = '1';
        section.style.visibility = 'visible';
      },
      onLeaveBack: () => {
        if (!persist) {
          gsap.to(children, {
            opacity: 0,
            duration: 0.5,
            ease: 'power2.in'
          });
        }
      }
    }
  });

  // Apply animation based on type
  switch (type) {
    case 'fade-up':
      tl.from(children, {
        y: 50,
        opacity: 0,
        stagger: 0.12,
        duration: 0.9,
        ease: 'power3.out'
      });
      break;
    case 'slide-left':
      tl.from(children, {
        x: -80,
        opacity: 0,
        stagger: 0.14,
        duration: 0.9,
        ease: 'power3.out'
      });
      break;
    case 'slide-right':
      tl.from(children, {
        x: 80,
        opacity: 0,
        stagger: 0.14,
        duration: 0.9,
        ease: 'power3.out'
      });
      break;
    case 'scale-up':
      tl.from(children, {
        scale: 0.85,
        opacity: 0,
        stagger: 0.12,
        duration: 1.0,
        ease: 'power2.out'
      });
      break;
    case 'stagger-up':
      tl.from(children, {
        y: 60,
        opacity: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: 'power3.out'
      });
      break;
  }
}

// Counter animations
function initCounterAnimations() {
  document.querySelectorAll('.stat-number').forEach(el => {
    const target = parseFloat(el.dataset.value);
    const decimals = parseInt(el.dataset.decimals || '0');

    gsap.from(el, {
      textContent: 0,
      duration: 2,
      ease: 'power1.out',
      snap: { textContent: decimals === 0 ? 1 : 0.1 },
      scrollTrigger: {
        trigger: el.closest('.scroll-section'),
        start: 'top 70%',
        toggleActions: 'play none none reverse'
      },
      onUpdate: function() {
        el.textContent = parseFloat(el.textContent).toFixed(decimals);
      }
    });
  });
}

// Horizontal marquee
function setupMarquee() {
  const marqueeWraps = document.querySelectorAll('.marquee-wrap');

  marqueeWraps.forEach(el => {
    const speed = parseFloat(el.dataset.scrollSpeed) || -25;
    const text = el.querySelector('.marquee-text');

    // Duplicate text for seamless loop
    text.innerHTML = text.textContent + text.textContent;

    gsap.to(text, {
      xPercent: -50,
      ease: 'none',
      scrollTrigger: {
        trigger: scrollContainer,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true
      }
    });

    // Fade in/out based on scroll
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        let opacity = 0;

        // Show around 35-55% scroll
        if (p >= 0.30 && p <= 0.60) {
          if (p < 0.35) {
            opacity = (p - 0.30) / 0.05;
          } else if (p > 0.55) {
            opacity = 1 - (p - 0.55) / 0.05;
          } else {
            opacity = 1;
          }
        }

        el.style.opacity = opacity;
      }
    });
  });
}

// Dark overlay
function setupDarkOverlay() {
  const fadeRange = 0.04;

  ScrollTrigger.create({
    trigger: scrollContainer,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      let opacity = 0;

      // Stats section overlay (50-65%)
      const enter = 0.50;
      const leave = 0.65;

      if (p >= enter - fadeRange && p <= enter) {
        opacity = (p - (enter - fadeRange)) / fadeRange * 0.92;
      } else if (p > enter && p < leave) {
        opacity = 0.92;
      } else if (p >= leave && p <= leave + fadeRange) {
        opacity = 0.92 * (1 - (p - leave) / fadeRange);
      }

      darkOverlay.style.opacity = opacity;
    }
  });
}

// Hero transition (circle wipe)
function setupHeroTransition() {
  ScrollTrigger.create({
    trigger: scrollContainer,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;

      // Hero fades out as scroll begins
      heroSection.style.opacity = Math.max(0, 1 - p * 15);

      // Canvas reveals via expanding circle clip-path
      const wipeProgress = Math.min(1, Math.max(0, (p - 0.01) / 0.06));
      const radius = wipeProgress * 75;

      canvasWrap.style.opacity = Math.min(1, p * 12);
      canvasWrap.style.clipPath = `circle(${radius}% at 50% 50%)`;
    }
  });
}

// ===== Initialize =====
window.addEventListener('resize', () => {
  setupCanvas();
  if (frames[currentFrame]) {
    drawFrame(currentFrame);
  }
});

// Start
setupCanvas();
preloadFrames();
initCounterAnimations();