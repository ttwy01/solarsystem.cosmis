/**
 * ============================================================
 * ห้องเรียนระบบสุริยะ (Solar System Observatory Classroom)
 * Advanced Interactive Engine: Canvas Nebula, 3D Tilt, Web Audio & HUD
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ============================================================
     1. Web Audio API (Sci-Fi Sound Synthesizer)
     - สร้างเสียงเอฟเฟกต์ไซไฟด้วยโค้ด 100% ไม่ต้องดาวน์โหลดไฟล์เสียง
     ============================================================ */
  let audioCtx = null;
  let isSoundEnabled = true;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // เสียงเมื่อเลื่อนเมาส์ชี้ดาว (Hover Chime)
  function playHoverSound() {
    if (!isSoundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {}
  }

  // เสียงเมื่อคลิกปุ่มทั่วไป (Cyber Click)
  function playClickSound() {
    if (!isSoundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {}
  }

  // เสียงเมื่อคลิกเปิดหน้าต่างโฮโลแกรม (Warp Whoosh)
  function playWarpSound() {
    if (!isSoundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.18);
      osc.frequency.exponentialRampToValueAtTime(329.63, audioCtx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {}
  }

  // เสียงความสำเร็จเมื่อทำแบบทดสอบผ่าน (Victory Chimes)
  function playSuccessSound() {
    if (!isSoundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.09 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.09);
        osc.stop(audioCtx.currentTime + idx * 0.09 + 0.25);
      });
    } catch (e) {}
  }

  // สลับเปิด/ปิดเสียง SFX และเสียงบรรยาย
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const audioIcon = document.getElementById('audioIcon');
  if (audioToggleBtn && audioIcon) {
    audioToggleBtn.addEventListener('click', () => {
      isSoundEnabled = !isSoundEnabled;
      if (isSoundEnabled) {
        initAudio();
        audioToggleBtn.classList.remove('muted');
        audioIcon.className = 'fa-solid fa-volume-high';
        playHoverSound();
      } else {
        audioToggleBtn.classList.add('muted');
        audioIcon.className = 'fa-solid fa-volume-xmark';
        stopModalTTS();
      }
    });
  }

  /* ============================================================
     2. Interactive Space Canvas (Nebula Clouds, Parallax Stars & Meteors)
     ============================================================ */
  const canvas = document.getElementById('space-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    window.addEventListener('mousemove', (e) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        targetMouseX = e.touches[0].clientX;
        targetMouseY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initSpaceObjects();
    });

    // 2.1 เนบิวลาอวกาศลึก (Procedural Nebula Clusters)
    const nebulae = [
      { x: width * 0.2, y: height * 0.3, radius: 280, color: 'rgba(0, 240, 255, 0.035)', pulse: 0 },
      { x: width * 0.8, y: height * 0.6, radius: 340, color: 'rgba(168, 85, 247, 0.035)', pulse: 1.5 },
      { x: width * 0.5, y: height * 0.85, radius: 300, color: 'rgba(255, 107, 0, 0.025)', pulse: 3 }
    ];

    // 2.2 ดวงดาวแบบ 3 มิติ หลายระดับความลึก (Multi-depth Starfield)
    const stars = [];
    const STAR_COUNT = Math.min(Math.floor((width * height) / 3600), 280);

    function initSpaceObjects() {
      stars.length = 0;
      for (let i = 0; i < STAR_COUNT; i++) {
        const depth = Math.random() * 3 + 1; // 1 = ไกลสุด, 4 = ใกล้สุด
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: (Math.random() * 1.4 + 0.3) * (depth / 2.5),
          depth: depth,
          baseAlpha: Math.random() * 0.7 + 0.25,
          alpha: Math.random() * 0.7 + 0.25,
          speed: Math.random() * 0.025 + 0.008,
          phase: Math.random() * Math.PI * 2,
          color: ['#ffffff', '#bae6fd', '#fef08a', '#e0e7ff', '#fed7aa'][Math.floor(Math.random() * 5)]
        });
      }
    }
    initSpaceObjects();

    // 2.3 สะเก็ดดาวเรืองแสง (Glowing Cosmic Sparks)
    const cosmicSparks = [];
    for (let i = 0; i < 40; i++) {
      cosmicSparks.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2.2 + 0.8,
        alpha: Math.random() * 0.5 + 0.15,
        color: ['rgba(0, 240, 255,', 'rgba(168, 85, 247,', 'rgba(255, 183, 3,'][Math.floor(Math.random() * 3)]
      });
    }

    // 2.4 ดาวตกสมจริง (Realistic Meteors / Shooting Stars)
    const meteors = [];

    function spawnMeteor() {
      if (meteors.length < 2 && Math.random() < 0.45) {
        meteors.push({
          x: Math.random() * (width * 0.85) + width * 0.1,
          y: Math.random() * (height * 0.35),
          length: Math.random() * 110 + 80,
          speed: Math.random() * 12 + 14,
          angle: (Math.PI / 4) + ((Math.random() - 0.5) * 0.22),
          opacity: 1,
          decay: Math.random() * 0.02 + 0.014,
          color: ['#ffffff', '#00f0ff', '#ffe600', '#38bdf8'][Math.floor(Math.random() * 4)]
        });
      }
      setTimeout(spawnMeteor, Math.random() * 2200 + 1200);
    }
    setTimeout(spawnMeteor, 800);

    // Animation Loop
    function renderSpace() {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse easing for parallax
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;
      const offsetX = (mouseX - width / 2) * 0.025;
      const offsetY = (mouseY - height / 2) * 0.025;

      // 1. วาดเนบิวลา
      nebulae.forEach(n => {
        n.pulse += 0.01;
        const currentRadius = n.radius + Math.sin(n.pulse) * 15;
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, currentRadius);
        grad.addColorStop(0, n.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. วาดดวงดาวพร้อม Parallax Depth
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.phase += star.speed;
        const currentAlpha = Math.max(0.1, Math.min(1, star.baseAlpha + Math.sin(star.phase) * 0.35));

        // Parallax offset ตามระดับความลึก
        const px = star.x + offsetX * star.depth;
        const py = star.y + offsetY * star.depth;

        ctx.beginPath();
        ctx.arc(px, py, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = currentAlpha;
        ctx.fill();

        // ประกายกากบาทแสงสำหรับดาวดวงใหญ่
        if (star.radius > 1.4 && currentAlpha > 0.75) {
          ctx.strokeStyle = star.color;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(px - star.radius * 2.5, py);
          ctx.lineTo(px + star.radius * 2.5, py);
          ctx.moveTo(px, py - star.radius * 2.5);
          ctx.lineTo(px, py + star.radius * 2.5);
          ctx.stroke();
        }
      }

      // 3. วาดละอองสะเก็ดดาว
      for (let i = 0; i < cosmicSparks.length; i++) {
        const p = cosmicSparks[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${p.alpha})`;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color + ' 0.8)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 4. วาดดาวตก (Shooting Stars)
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        const tailX = m.x - Math.cos(m.angle) * m.length;
        const tailY = m.y - Math.sin(m.angle) * m.length;

        const gradient = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.8, m.color);
        gradient.addColorStop(1, '#ffffff');

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2.4;
        ctx.globalAlpha = Math.max(0, m.opacity);
        ctx.shadowBlur = 14;
        ctx.shadowColor = m.color;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // วาดประกายไฟตรงหัวดาวตก
        ctx.beginPath();
        ctx.arc(m.x, m.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed;
        m.opacity -= m.decay;

        if (m.opacity <= 0 || m.x > width || m.y > height) {
          meteors.splice(i, 1);
        }
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(renderSpace);
    }
    renderSpace();
  }

  /* ============================================================
     3. 3D Tilt Interaction on Planet Cards (มุมมอง 3 มิติตามเมาส์)
     ============================================================ */
  const planetCards = document.querySelectorAll('.planet-card');

  planetCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -12; // เอียงขึ้นลง
      const rotateY = ((x - centerX) / centerX) * 12;  // เอียงซ้ายขวา

      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });

    card.addEventListener('mouseenter', () => {
      playHoverSound();
    });
  });

  /* ============================================================
     4. Dynamic Rotation Speed Switcher (1x, 2x, 5x)
     ============================================================ */
  const speedButtons = document.querySelectorAll('.speed-btn');
  speedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      speedButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const speed = btn.getAttribute('data-speed');
      document.documentElement.style.setProperty('--rot-mult', speed);
      playHoverSound();
    });
  });

  /* ============================================================
     5. Navbar & Dropdown Controller
     ============================================================ */
  const quizDropdown = document.getElementById('quizDropdown');
  const dropdownTrigger = document.getElementById('dropdownTrigger');
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  // Universal Dropdown Controller (รองรับคลิกและแตะสัมผัสทุกหน้าจอ รวมถึง iOS / iPadOS)
  if (dropdownTrigger && quizDropdown) {
    const handleTriggerToggle = (e) => {
      if (typeof window.toggleQuizDropdown === 'function') {
        window.toggleQuizDropdown(e);
      } else {
        if (e && e.cancelable) e.preventDefault();
        e.stopPropagation();
        const isOpen = quizDropdown.classList.toggle('open');
        dropdownTrigger.setAttribute('aria-expanded', isOpen);
      }
      playHoverSound();
    };
    dropdownTrigger.addEventListener('click', handleTriggerToggle);
    dropdownTrigger.addEventListener('touchend', (e) => {
      if (e.cancelable) e.preventDefault();
      handleTriggerToggle(e);
    }, { passive: false });
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('#dropdownTrigger, .dropdown-trigger')) return;

    if (!e.target.closest('#quizDropdown, #dropdownMenu, .nav-item.dropdown, .dropdown, .dropdown-menu')) {
      if (typeof window.closeQuizDropdown === 'function') {
        window.closeQuizDropdown();
      } else {
        document.querySelectorAll('#quizDropdown.open, .dropdown.open').forEach(d => {
          d.classList.remove('open');
          const t = d.querySelector('#dropdownTrigger, .dropdown-trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
        });
      }
    }
  });

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
      }
      playHoverSound();
    });
  }

  // Smooth scroll เมนูนำทาง
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function() {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      playHoverSound();
      if (navMenu && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        if (mobileToggle) {
          const icon = mobileToggle.querySelector('i');
          if (icon) {
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-xmark');
          }
        }
      }
    });
  });

  /* ============================================================
     6. Planets Track Horizontal Scrolling
     ============================================================ */
  const planetsTrack = document.getElementById('planetsTrack');
  const scrollLeftBtn = document.getElementById('scrollLeftBtn');
  const scrollRightBtn = document.getElementById('scrollRightBtn');

  if (planetsTrack) {
    if (scrollLeftBtn) {
      scrollLeftBtn.addEventListener('click', () => {
        planetsTrack.scrollBy({ left: -320, behavior: 'smooth' });
        playHoverSound();
      });
    }
    if (scrollRightBtn) {
      scrollRightBtn.addEventListener('click', () => {
        planetsTrack.scrollBy({ left: 320, behavior: 'smooth' });
        playHoverSound();
      });
    }
  }

  /* ============================================================
     7. Planet Search & Highlighting
     ============================================================ */
  const searchInput = document.getElementById('planetSearchInput');
  const searchBtn = document.getElementById('searchBtn');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const quickTags = document.querySelectorAll('.quick-tag');

  function performSearch(query) {
    const q = query.trim().toLowerCase();
    
    if (clearSearchBtn) {
      clearSearchBtn.style.display = q ? 'block' : 'none';
    }

    let firstMatch = null;

    planetCards.forEach(card => {
      const nameData = card.getAttribute('data-name').toLowerCase();
      card.classList.remove('search-highlight');

      if (!q || q === 'ทั้งหมด') {
        card.style.opacity = '1';
        card.style.filter = 'none';
      } else if (nameData.includes(q)) {
        card.style.opacity = '1';
        card.style.filter = 'none';
        card.classList.add('search-highlight');
        if (!firstMatch) firstMatch = card;
      } else {
        card.style.opacity = '0.3';
        card.style.filter = 'grayscale(70%)';
      }
    });

    if (firstMatch && planetsTrack) {
      playWarpSound();
      firstMatch.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      performSearch(e.target.value);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        performSearch(searchInput.value);
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      if (searchInput) performSearch(searchInput.value);
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        performSearch('');
        searchInput.focus();
        playHoverSound();
      }
    });
  }

  quickTags.forEach(tag => {
    tag.addEventListener('click', () => {
      const tagText = tag.getAttribute('data-search');
      if (searchInput) {
        searchInput.value = tagText === 'ทั้งหมด' ? '' : tagText;
        performSearch(tagText);
      }
    });
  });

  /* ============================================================
     8. Planet Scientific Data Dictionary (9 วัตถุอวกาศหลัก)
     ============================================================ */
  const planetsData = {
    sun: {
      nameTh: 'ดวงอาทิตย์',
      nameEn: 'The Sun',
      type: 'ดาวฤกษ์ศูนย์กลาง (G2V Yellow Dwarf)',
      diameter: '1,392,700 กม. (109 เท่าของโลก)',
      distance: '0.00 AU • ศูนย์กลางระบบสุริยะ',
      rotation: '~25 - 35 วัน (ตามละติจูด)',
      orbit: '~230 ล้านปี (รอบใจกลางกาแล็กซีทางช้างเผือก)',
      temp: '5,500 °C (พื้นผิว) / 15,000,000 °C (แกนกลาง)',
      moons: 'บริวาร: ดาวเคราะห์ 8 ดวง + ดาวเคราะห์แคระนับล้าน',
      bullets: [
        'เป็น ดาวฤกษ์เพียงดวงเดียวในระบบสุริยะ',
        'ประเภท G2V สีเหลือง–ส้ม',
        'อุณหภูมิพื้นผิวประมาณ 5,500°C',
        'มีมวลประมาณ 99% ของมวลทั้งหมดในระบบสุริยะ',
        'พลังงานเกิดจาก ปฏิกิริยานิวเคลียร์ฟิวชัน เปลี่ยนไฮโดรเจนเป็นฮีเลียม',
        'ชั้นสำคัญ ได้แก่ โฟโตสเฟียร์ โครโมสเฟียร์ และโคโรนา',
        'มีปรากฏการณ์ เช่น จุดบนดวงอาทิตย์ พวยแก๊ส การลุกจ้า และลมสุริยะ',
        'มีวัฏจักรสุริยะประมาณ 11 ปี'
      ],
      youtubeUrl: 'https://youtu.be/zEgmdmP2Www?si=mxiVgFGGmvT9SWl3',
      desc: 'ดวงอาทิตย์คือหัวใจสำคัญและแหล่งกำเนิดพลังงานทั้งหมดในระบบสุริยะ มีมวลคิดเป็น 99.86% ของระบบสุริยะทั้งหมด พลังงานมหาศาลเกิดขึ้นจากปฏิกิริยานิวเคลียร์ฟิวชันที่แกนกลาง หลอมไฮโดรเจน 600 ล้านตันให้เป็นฮีเลียมในทุกๆ วินาที และเปล่งแสงสว่างหล่อเลี้ยงสิ่งมีชีวิตบนโลกมานานกว่า 4,600 ล้านปี',
      renderHtml: '<div class="planet-body planet-sun" style="width:130px;height:130px;"><div class="sun-corona-outer"></div></div>',
      wikiUrl: 'https://th.wikipedia.org/wiki/ดวงอาทิตย์'
    },
    mercury: {
      nameTh: 'ดาวพุธ',
      nameEn: 'Mercury',
      type: 'ดาวเคราะห์หิน (Terrestrial Planet)',
      diameter: '4,879 กม. (เล็กที่สุดในบรรดาดาวเคราะห์)',
      distance: '0.39 AU • 57.9 ล้านกม.',
      rotation: '58.6 วันบนโลก',
      orbit: '88 วันบนโลก (โคจรเร็วที่สุดในระบบสุริยะ)',
      temp: '-180 °C (กลางคืน) ถึง 430 °C (กลางวัน)',
      moons: '0 ดวง',
      bullets: [
        'ดาวเคราะห์ลำดับที่ 1 และอยู่ใกล้ดวงอาทิตย์ที่สุด',
        'เป็นดาวเคราะห์หินที่ เล็กที่สุด',
        'พื้นผิวเต็มไปด้วยหลุมอุกกาบาต',
        'เรียกว่า “เตาไฟแช่แข็ง” เพราะกลางวันร้อนมาก ส่วนกลางคืนหนาวจัด',
        'โคจรรอบดวงอาทิตย์เร็วที่สุด ใช้เวลาเพียง 88 วัน',
        'ไม่มีดาวบริวาร',
        'มีแก่นกลางเหล็กขนาดใหญ่',
        'มีบรรยากาศเบาบางมาก และพบ น้ำแข็งบริเวณขั้วดาว',
        'การเคลื่อนที่ของวงโคจรดาวพุธเป็นหลักฐานสำคัญที่ช่วยยืนยัน ทฤษฎีสัมพัทธภาพทั่วไปของไอน์สไตน์'
      ],
      youtubeUrl: 'https://youtu.be/e-sblFSnxiA?si=IMTo7qYDmeFZzCjd',
      desc: 'ดาวเคราะห์ที่อยู่ใกล้ดวงอาทิตย์ที่สุด ไม่มีชั้นบรรยากาศหนาแน่นคอยเก็บกักความร้อน ส่งผลให้ความแตกต่างของอุณหภูมิระหว่างกลางวันกับกลางคืนต่างกันมากที่สุดในระบบสุริยะ (มากกว่า 600 องศาเซลเซียส) จนได้รับฉายาว่า "เตาไฟแช่แข็ง" พื้นผิวเต็มไปด้วยหลุมอุกกาบาตขนาดใหญ่มากมาย',
      renderHtml: '<div class="planet-body planet-mercury" style="width:95px;height:95px;"><div class="mercury-texture"></div></div>',
      wikiUrl: 'https://th.wikipedia.org/wiki/ดาวพุธ'
    },
    venus: {
      nameTh: 'ดาวศุกร์',
      nameEn: 'Venus',
      type: 'ดาวเคราะห์หิน (Terrestrial Planet)',
      diameter: '12,104 กม. (ขนาดใกล้เคียงกับโลก)',
      distance: '0.72 AU • 108.2 ล้านกม.',
      rotation: '243 วัน (หมุนย้อนทางตามเข็มนาฬิกา)',
      orbit: '225 วันบนโลก',
      temp: '~464 °C (ดาวเคราะห์ที่ร้อนที่สุด)',
      moons: '0 ดวง',
      bullets: [
        'ดาวเคราะห์ลำดับที่ 2',
        'มีขนาด มวล ความหนาแน่น และแรงโน้มถ่วงใกล้เคียงโลก จึงเรียกว่า “ฝาแฝดของโลก”',
        'หมุนรอบตัวเองช้ามาก ใช้เวลา 243 วัน',
        'หมุนสวนทางกับดาวเคราะห์ส่วนใหญ่ ทำให้ดวงอาทิตย์ขึ้นทางตะวันตกและตกทางตะวันออก',
        'มีอุณหภูมิพื้นผิวเฉลี่ยประมาณ 464°C',
        'บรรยากาศมี คาร์บอนไดออกไซด์ประมาณ 96.5%',
        'เกิด ปรากฏการณ์เรือนกระจกแบบกู่ไม่กลับ (Runaway Greenhouse Effect) ทำให้เป็นดาวเคราะห์ที่ร้อนที่สุด',
        'ไม่มีดาวบริวาร'
      ],
      youtubeUrl: 'https://youtu.be/2HC9345Ura4?si=Gch8JxARCBkrQ1bN',
      desc: 'ดาวศุกร์สว่างเป็นอันดับสองบนท้องฟ้ารองจากดวงจันทร์ รู้จักกันในชื่อ "ดาวประกายพรึก" (รุ่งเช้า) หรือ "ดาวประจำเมือง" (หัวค่ำ) บรรยากาศหนาแน่นไปด้วยก๊าซคาร์บอนไดออกไซด์และเมฆกรดกำมะถัน ก่อให้เกิดปรากฏการณ์เรือนกระจกขั้นรุนแรงจนมีอุณหภูมิร้อนพอจะหลอมละลายตะกั่วได้',
      renderHtml: '<div class="planet-body planet-venus" style="width:105px;height:105px;"><div class="venus-texture"></div></div>',
      wikiUrl: 'https://th.wikipedia.org/wiki/ดาวศุกร์'
    },
    earth: {
      nameTh: 'โลก',
      nameEn: 'Earth',
      type: 'ดาวเคราะห์หิน (The Living Blue Planet)',
      diameter: '12,742 กม.',
      distance: '1.00 AU • 149.6 ล้านกม.',
      rotation: '23 ชั่วโมง 56 นาที 4 วินาที',
      orbit: '365.25 วัน (1 ปีสุริยคติ)',
      temp: 'เฉลี่ย 15 °C (-89 °C ถึง 58 °C)',
      moons: '1 ดวง (ดวงจันทร์ / The Moon)',
      bullets: [
        'ดาวเคราะห์ลำดับที่ 3',
        'เป็นดาวเคราะห์เพียงดวงเดียวในระบบสุริยะที่พบสิ่งมีชีวิตหลากหลาย',
        'มีน้ำในสถานะของเหลว',
        'หมุนรอบตัวเองประมาณ 24 ชั่วโมง',
        'โคจรรอบดวงอาทิตย์ประมาณ 365.25 วัน',
        'แกนโลกเอียง 23.44° ทำให้เกิดฤดูกาล',
        'พื้นผิวประมาณ 70% เป็นมหาสมุทร',
        'มีดาวบริวาร 1 ดวง คือ ดวงจันทร์',
        'สนามแม่เหล็กโลกช่วยป้องกันอนุภาคจากลมสุริยะ',
        'บรรยากาศประกอบด้วยไนโตรเจนประมาณ 78% และออกซิเจน 21%'
      ],
      youtubeUrl: 'https://youtu.be/nv3_a3kus8k?si=lgf8_-KJujl-Fwtz',
      desc: 'อัญมณีสีน้ำเงินแห่งจักรวาลและบ้านเพียงหลังเดียวที่ทราบว่ามีสิ่งมีชีวิตอาศัยอยู่ พื้นผิวปกคลุมด้วยมหาสมุทรน้ำในสถานะของเหลวถึง 71% มีชั้นบรรยากาศที่มีออกซิเจนและโอโซนคอยปกป้องจากรังสีอันตราย พร้อมสนามแม่เหล็กโลกที่ป้องกันพายุสุริยะได้อย่างสมบูรณ์แบบ',
      renderHtml: '<div class="planet-body planet-earth" style="width:110px;height:110px;"><div class="earth-continents"></div><div class="earth-clouds-dynamic cloud-layer-1"></div></div>',
      wikiUrl: 'https://th.wikipedia.org/wiki/โลก_(ดาวเคราะห์)'
    },
    mars: {
      nameTh: 'ดาวอังคาร',
      nameEn: 'Mars',
      type: 'ดาวเคราะห์หิน (The Red Planet)',
      diameter: '6,779 กม. (ประมาณครึ่งหนึ่งของโลก)',
      distance: '1.52 AU • 227.9 ล้านกม.',
      rotation: '24 ชั่วโมง 37 นาที',
      orbit: '687 วันบนโลก (~1.9 ปี)',
      temp: '-125 °C ถึง 20 °C (เฉลี่ย -60 °C)',
      moons: '2 ดวง (โฟบอส และ ไดมอส)',
      bullets: [
        'ดาวเคราะห์ลำดับที่ 4',
        'เป็นดาวเคราะห์หิน มีขนาดประมาณครึ่งหนึ่งของโลก',
        'มีสีแดงจาก ฝุ่นสนิมเหล็ก',
        'มีน้ำแข็งบริเวณขั้ว',
        'เป็นหนึ่งในดาวเคราะห์ที่มีความเป็นไปได้ในการค้นหาสิ่งมีชีวิต',
        'มีดาวบริวาร 2 ดวง คือ โฟบอส (Phobos) และ ไดมอส (Deimos)',
        'มีภูเขาไฟ โอลิมปัส มอนส์ ซึ่งสูงประมาณ 22 กม.',
        'มีหุบเขาขนาดใหญ่ วัลเลส มาริเนอริส',
        'หลักฐานทางภูมิประเทศแสดงว่าในอดีตอาจเคยมีน้ำจำนวนมาก',
        'ปัจจุบันน้ำส่วนใหญ่พบในรูป น้ำแข็ง'
      ],
      youtubeUrl: 'https://youtu.be/Lty8nmdfxik?si=Jts9bPmY-YH84EnF',
      desc: 'ดาวเคราะห์สีแดงที่เต็มไปด้วยหุบเหวและทะเลทรายสนิมเหล็ก มีภูเขาไฟโอลิมปัส (Olympus Mons) ซึ่งสูงกว่า 21 กิโลเมตร (สูงที่สุดในระบบสุริยะ) และหุบเหวลึก Valles Marineris ที่ยาวข้ามทวีป ปัจจุบันเป็นเป้าหมายหลักของการส่งยานสำรวจและแผนการตั้งถิ่นฐานแห่งอนาคตของมนุษยชาติ',
      renderHtml: '<div class="planet-body planet-mars" style="width:98px;height:98px;"><div class="mars-texture"></div><div class="mars-polar-cap"></div></div>',
      wikiUrl: 'https://th.wikipedia.org/wiki/ดาวอังคาร'
    },
    jupiter: {
      nameTh: 'ดาวพฤหัสบดี',
      nameEn: 'Jupiter',
      type: 'ดาวยักษ์แก๊ส (Gas Giant - จอมราชันย์)',
      diameter: '139,820 กม. (ดาวเคราะห์ใหญ่ที่สุด)',
      distance: '5.20 AU • 778.5 ล้านกม.',
      rotation: '9 ชั่วโมง 55 นาที (หมุนเร็วที่สุดในระบบสุริยะ)',
      orbit: '11.86 ปีบนโลก',
      temp: '-110 °C (ระดับชั้นบรรยากาศบน)',
      moons: '95 ดวง (เช่น แกนีมีด, ยูโรปา, ไอโอ, คัลลิสโต)',
      bullets: [
        'ดาวเคราะห์ลำดับที่ 5',
        'เป็น ดาวเคราะห์แก๊สยักษ์ที่ใหญ่ที่สุด',
        'มีขนาดประมาณ 11 เท่าของโลก',
        'หมุนรอบตัวเองเร็วมาก ประมาณ 10 ชั่วโมง',
        'มีแถบเมฆสีขาวและส้ม',
        'มี จุดแดงใหญ่ ซึ่งเป็นพายุขนาดมหึมา',
        'มีดาวบริวารสำคัญ 4 ดวง เรียกว่า ดวงจันทร์กาลิเลียน (ไอโอ, ยูโรปา, แกนีมีด, คัลลิสโต)',
        'มีวงแหวนจาง ๆ',
        'มีสนามแม่เหล็กที่รุนแรงมาก'
      ],
      youtubeUrl: 'https://youtu.be/wITO8tBO8JE?si=WZBuapYqrzRqpg9O',
      desc: 'ดาวเคราะห์ที่มีขนาดและมวลมหาศาลที่สุด หากนำดาวเคราะห์ดวงอื่นทั้งหมดมารวมกัน ดาวพฤหัสบดีก็ยังมีมวลมากกว่าถึง 2.5 เท่า ประกอบด้วยไฮโดรเจนและฮีเลียม จุดเด่นคือ "จุดแดงใหญ่" (Great Red Spot) พายุหมุนขนาดยักษ์ที่มีขนาดใหญ่กว่าโลกทั้งใบและโหมกระหน่ำมานานหลายร้อยปี',
      renderHtml: '<div class="planet-body planet-jupiter" style="width:130px;height:130px;"><div class="jupiter-clouds-bands"></div><div class="jupiter-great-red-spot" style="bottom:32px;right:28px;"></div></div>',
      wikiUrl: 'https://th.wikipedia.org/wiki/ดาวพฤหัสบดี'
    },
    saturn: {
      nameTh: 'ดาวเสาร์',
      nameEn: 'Saturn',
      type: 'ดาวยักษ์แก๊ส (The Ringed Jewel)',
      diameter: '116,460 กม.',
      distance: '9.58 AU • 1.43 พันล้านกม.',
      rotation: '10 ชั่วโมง 33 นาที',
      orbit: '29.45 ปีบนโลก',
      temp: '-140 °C',
      moons: '146 ดวง (ตามเอกสารยืนยันแล้ว 82+ ดวง)',
      bullets: [
        'ดาวเคราะห์ลำดับที่ 6',
        'เป็นดาวเคราะห์แก๊สยักษ์ที่มีขนาดใหญ่เป็นอันดับ 2',
        'จุดเด่นที่สุดคือ วงแหวนขนาดใหญ่',
        'วงแหวนประกอบด้วยน้ำแข็ง หิน และฝุ่นจำนวนมาก',
        'มีดวงจันทร์ที่ยืนยันแล้ว 82 ดวง ตามข้อมูลในเอกสาร',
        'ดวงจันทร์ที่น่าสนใจ ได้แก่ ไททัน และเอนเซลาดัส',
        'เป็นดาวเคราะห์ที่มีความหนาแน่นเฉลี่ย น้อยกว่าน้ำ',
        'มีพายุรูปหกเหลี่ยมบริเวณขั้วเหนือ'
      ],
      youtubeUrl: 'https://youtu.be/mvgPT4yy2NI?si=zap7qUvnFWYXwtZc',
      desc: 'ดาวเคราะห์ที่มีระบบวงแหวนอันงดงามและสลับซับซ้อนที่สุด วงแหวนกว้างหลายแสนกิโลเมตรแต่หนาเพียงไม่กี่สิบเมตร ประกอบด้วยอนุภาคน้ำแข็ง หิน และฝุ่นอวกาศ ดาวเสาร์มีความหนาแน่นเฉลี่ยต่ำที่สุด (น้อยกว่าน้ำ) และมีดวงจันทร์ "ไททัน" ที่มีทะเลมีเทนเหลวและชั้นบรรยากาศหนาแน่น',
      renderHtml: '<div class="saturn-wrapper" style="position:relative;display:inline-block;"><div class="saturn-ring-system ring-back-layer" style="width:200px;height:60px;"><div class="ring-a"></div><div class="ring-cassini"></div><div class="ring-b"></div></div><div class="planet-body planet-saturn" style="width:110px;height:110px;"><div class="saturn-cloud-bands"></div></div><div class="saturn-ring-system ring-front-layer" style="width:200px;height:60px;"><div class="ring-a"></div><div class="ring-cassini"></div><div class="ring-b"></div></div></div>',
      wikiUrl: 'https://th.wikipedia.org/wiki/ดาวเสาร์'
    },
    uranus: {
      nameTh: 'ดาวยูเรนัส',
      nameEn: 'Uranus',
      type: 'ดาวยักษ์น้ำแข็ง (Ice Giant - แกนเอียง 98°)',
      diameter: '50,724 กม.',
      distance: '19.2 AU • 2.87 พันล้านกม.',
      rotation: '17 ชั่วโมง 14 นาที (หมุนตะแคงข้าง)',
      orbit: '84 ปีบนโลก',
      temp: '-195 °C (ลดต่ำสุดถึง -224 °C)',
      moons: '28 ดวง (ตามเอกสาร 27 ดวง)',
      bullets: [
        'ดาวเคราะห์ลำดับที่ 7',
        'มีขนาดใหญ่เป็นอันดับ 3',
        'มีสีฟ้าอมเขียวจากแก๊ส มีเทน',
        'เป็นดาวเคราะห์ที่มีแกนเอียงมากถึง 97.8°',
        'จึงดูคล้าย ลูกบอลที่กำลังกลิ้งรอบดวงอาทิตย์',
        'มีฤดูกาลที่รุนแรงมาก',
        'มีวงแหวนหลายวงและมีดวงจันทร์ 27 ดวง',
        'ลมในชั้นบรรยากาศมีความเร็วสูงถึงประมาณ 900 กม./ชม.',
        'ยาน Voyager 2 เป็นยานเพียงลำเดียวที่บินเฉียดดาวยูเรนัส'
      ],
      youtubeUrl: 'https://youtu.be/H6exbHGSd5E?si=FbOhH0V7fP8XTxNS',
      desc: 'ดาวเคราะห์ก๊าซสีฟ้าอมเขียวจากก๊าซมีเทน มีความพิเศษคือแกนหมุนที่เอียงถึง 98 องศาจนเกือบขนานกับระนาบวงโคจร ทำให้เหมือนกลิ้งไปรอบดวงอาทิตย์ ส่งผลให้ขั้วเหนือและขั้วใต้ต้องเผชิญกับกลางวันและกลางคืนยาวนานขั้วละถึง 42 ปีบนโลก',
      renderHtml: '<div class="planet-body planet-uranus" style="width:105px;height:105px;"><div class="uranus-vertical-ring" style="width:130px;height:130px;"></div></div>',
      wikiUrl: 'https://th.wikipedia.org/wiki/ดาวยูเรนัส'
    },
    neptune: {
      nameTh: 'ดาวเนปจูน',
      nameEn: 'Neptune',
      type: 'ดาวยักษ์น้ำแข็ง (The Windy Giant)',
      diameter: '49,244 กม.',
      distance: '30.1 AU • 4.50 พันล้านกม.',
      rotation: '16 ชั่วโมง 6 นาที',
      orbit: '164.8 ปีบนโลก (ไกลที่สุด)',
      temp: '-200 °C (เฉลี่ยประมาณ -218 °C)',
      moons: '16 ดวง (ตามเอกสาร 14 ดวง)',
      bullets: [
        'ดาวเคราะห์ลำดับที่ 8 และอยู่ไกลดวงอาทิตย์ที่สุด',
        'เป็นดาวเคราะห์แก๊สยักษ์ที่มีขนาดเล็กที่สุดในกลุ่มแก๊สยักษ์',
        'มีสีน้ำเงินเข้ม',
        'หนาวเย็นมาก อุณหภูมิเฉลี่ยประมาณ -218°C',
        'มีลมแรงที่สุดในระบบสุริยะ ความเร็วสูงถึงประมาณ 2,100 กม./ชม.',
        'มี จุดมืดใหญ่ (Great Dark Spot) ซึ่งเป็นพายุขนาดใหญ่',
        'มีวงแหวนบาง ๆ',
        'มีดวงจันทร์ 14 ดวง โดย ไทรทัน (Triton) เป็นดวงใหญ่ที่สุด',
        'ค้นพบในปี ค.ศ. 1846 จากการคำนวณตำแหน่งก่อนการสังเกตจริง'
      ],
      youtubeUrl: 'https://youtu.be/AOaQgRfxIEc?si=hkQ9FFizVM9F1i_r',
      desc: 'ดาวเคราะห์ดวงสุดท้ายที่อยู่ไกลที่สุด มีสีน้ำเงินครามเข้มสวยงาม เป็นดาวที่มีกระแสลมพายุพัดรวดเร็วและรุนแรงที่สุดในระบบสุริยะ ความเร็วลมพุ่งสูงถึงกว่า 2,100 กิโลเมตรต่อชั่วโมง มีดวงจันทร์บริวารดวงใหญ่ชื่อ "ไทรทัน" (Triton) ซึ่งมีภูเขาไฟน้ำแข็งพ่นก๊าซไนโตรเจนเหลวขึ้นสู่อวกาศ',
      renderHtml: '<div class="planet-body planet-neptune" style="width:105px;height:105px;"><div class="neptune-white-cirrus"></div><div class="neptune-dark-spot"></div></div>',
      wikiUrl: 'https://th.wikipedia.org/wiki/ดาวเนปจูน'
    }
  };

  /* ============================================================
     9. Holographic Planet Detail Modal & 3D Interactive Showcase
     ============================================================ */
  const planetModal = document.getElementById('planetModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalPlanetCanvas = document.getElementById('modalPlanetCanvas');
  const modalPlanetNameTh = document.getElementById('modalPlanetNameTh');
  const modalPlanetNameEn = document.getElementById('modalPlanetNameEn');
  const modalPlanetType = document.getElementById('modalPlanetType');
  const statDiameter = document.getElementById('statDiameter');
  const statDistance = document.getElementById('statDistance');
  const statRotation = document.getElementById('statRotation');
  const statOrbit = document.getElementById('statOrbit');
  const statTemp = document.getElementById('statTemp');
  const statMoons = document.getElementById('statMoons');
  const modalDescription = document.getElementById('modalDescription');
  const modalExploreMore = document.getElementById('modalExploreMore');
  const modalBulletsList = document.getElementById('modalBulletsList');
  const modalYoutubeBtn = document.getElementById('modalYoutubeBtn');

  let currentWikiUrl = '#';
  let activeModalPlanetId = null;

  /* Three.js 3D WebGL Engine for Planet Modal */
  let modalScene, modalCamera, modalRenderer;
  let modalPlanetGroup, modalCloudsMesh, modalCoronaMesh;
  let isDraggingModalPlanet = false;
  let prevModalPointerX = 0, prevModalPointerY = 0;

  function initModalThreeScene() {
    if (!modalPlanetCanvas || typeof THREE === 'undefined') return;
    modalScene = new THREE.Scene();

    const box = modalPlanetCanvas.parentElement;
    const w = (box && box.clientWidth > 0) ? box.clientWidth : 240;
    const h = (box && box.clientHeight > 0) ? box.clientHeight : 240;

    modalCamera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    modalCamera.position.set(0, 0, 7.2);
    modalCamera.lookAt(0, 0, 0);

    modalRenderer = new THREE.WebGLRenderer({
      canvas: modalPlanetCanvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    modalRenderer.setSize(w, h);
    modalRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Studio 3-point Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.75);
    modalScene.add(amb);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.8);
    dirLight.position.set(6, 4, 6);
    modalScene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x00f0ff, 0.85);
    rimLight.position.set(-6, -2, -4);
    modalScene.add(rimLight);

    modalPlanetGroup = new THREE.Group();
    modalScene.add(modalPlanetGroup);

    // Interactive pointer drag rotation
    modalPlanetCanvas.addEventListener('pointerdown', (e) => {
      isDraggingModalPlanet = true;
      prevModalPointerX = e.clientX;
      prevModalPointerY = e.clientY;
      modalPlanetCanvas.setPointerCapture(e.pointerId);
    });

    modalPlanetCanvas.addEventListener('pointermove', (e) => {
      if (!isDraggingModalPlanet || !modalPlanetGroup) return;
      const dx = e.clientX - prevModalPointerX;
      const dy = e.clientY - prevModalPointerY;
      modalPlanetGroup.rotation.y += dx * 0.016;
      modalPlanetGroup.rotation.x += dy * 0.014;
      modalPlanetGroup.rotation.x = Math.max(-1.1, Math.min(1.1, modalPlanetGroup.rotation.x));
      prevModalPointerX = e.clientX;
      prevModalPointerY = e.clientY;
    });

    modalPlanetCanvas.addEventListener('pointerup', (e) => {
      isDraggingModalPlanet = false;
      try { modalPlanetCanvas.releasePointerCapture(e.pointerId); } catch(err) {}
    });

    modalPlanetCanvas.addEventListener('pointercancel', () => {
      isDraggingModalPlanet = false;
    });

    function animModal() {
      requestAnimationFrame(animModal);
      if (planetModal && planetModal.classList.contains('active') && modalPlanetGroup) {
        if (!isDraggingModalPlanet) {
          modalPlanetGroup.rotation.y += 0.007;
        }
        if (modalCloudsMesh) modalCloudsMesh.rotation.y += 0.004;
        if (modalCoronaMesh) {
          const t = performance.now() * 0.003;
          modalCoronaMesh.scale.setScalar(1 + Math.sin(t) * 0.035);
        }
        modalRenderer.render(modalScene, modalCamera);
      }
    }
    animModal();
  }

  // Procedural 3D Textures for Modal
  function createModalPlanetTexture(planetId) {
    const cvs = document.createElement('canvas');
    cvs.width = 512; cvs.height = 256;
    const ctx = cvs.getContext('2d');

    if (planetId === 'sun') {
      const grad = ctx.createRadialGradient(256, 128, 10, 256, 128, 256);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.2, '#ffea75');
      grad.addColorStop(0.6, '#f97316');
      grad.addColorStop(1, '#9a3412');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.25)' : 'rgba(124,45,18,0.35)';
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 256, 3 + Math.random() * 12, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (planetId === 'mercury') {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 90; i++) {
        ctx.fillStyle = Math.random() > 0.4 ? '#475569' : '#94a3b8';
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 256, 2 + Math.random() * 14, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (planetId === 'venus') {
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#eab308');
      grad.addColorStop(0.5, '#f59e0b');
      grad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
      for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        ctx.ellipse(Math.random() * 512, Math.random() * 256, 30 + Math.random() * 50, 4 + Math.random() * 8, 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (planetId === 'earth') {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = '#15803d';
      // Continents blobs
      const continents = [
        [120, 80, 55, 30], [280, 90, 65, 35], [380, 80, 50, 25],
        [150, 170, 45, 55], [310, 160, 55, 60], [420, 180, 40, 30]
      ];
      continents.forEach(([cx, cy, rw, rh]) => {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rw, rh, 0.2, 0, Math.PI * 2);
        ctx.fill();
      });
      // Polar caps
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 512, 18);
      ctx.fillRect(0, 238, 512, 18);
    } else if (planetId === 'mars') {
      ctx.fillStyle = '#c2410c';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = '#7c2d12';
      for (let i = 0; i < 30; i++) {
        ctx.beginPath();
        ctx.ellipse(Math.random() * 512, Math.random() * 256, 20 + Math.random() * 35, 6 + Math.random() * 12, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Polar caps
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 512, 14);
      ctx.fillRect(0, 242, 512, 14);
    } else if (planetId === 'jupiter') {
      const bands = ['#78350f', '#d97706', '#fef3c7', '#92400e', '#b45309', '#eddcd2', '#c88b3a'];
      let y = 0;
      for (let i = 0; i < 14; i++) {
        const h = 16 + (Math.sin(i) * 5 + 4);
        ctx.fillStyle = bands[i % bands.length];
        ctx.fillRect(0, y, 512, h);
        y += h;
      }
      // Great Red Spot
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.ellipse(360, 160, 32, 18, -0.05, 0, Math.PI * 2);
      ctx.fill();
    } else if (planetId === 'saturn') {
      const bands = ['#a16207', '#ca8a04', '#fef08a', '#854d0e', '#eab308'];
      let y = 0;
      for (let i = 0; i < 14; i++) {
        ctx.fillStyle = bands[i % bands.length];
        ctx.fillRect(0, y, 512, 20);
        y += 18;
      }
    } else if (planetId === 'uranus') {
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#67e8f9');
      grad.addColorStop(0.5, '#a5f3fc');
      grad.addColorStop(1, '#0891b2');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 256);
    } else if (planetId === 'neptune') {
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.5, '#1e40af');
      grad.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 256);
      // Dark Spot
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(320, 140, 28, 14, -0.1, 0, Math.PI * 2);
      ctx.fill();
      // Cirrus
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(290, 126, 60, 3);
    }
    return new THREE.CanvasTexture(cvs);
  }

  function createModalCloudsTexture() {
    const cvs = document.createElement('canvas');
    cvs.width = 512; cvs.height = 256;
    const ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, 512, 256);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      ctx.ellipse(Math.random() * 512, 30 + Math.random() * 196, 20 + Math.random() * 40, 5 + Math.random() * 10, Math.random() * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    return new THREE.CanvasTexture(cvs);
  }

  function updateModalThreePlanet(planetId) {
    if (!modalPlanetGroup) initModalThreeScene();
    if (!modalPlanetGroup) return;

    activeModalPlanetId = planetId;

    while (modalPlanetGroup.children.length > 0) {
      modalPlanetGroup.remove(modalPlanetGroup.children[0]);
    }
    modalCloudsMesh = null;
    modalCoronaMesh = null;
    modalPlanetGroup.rotation.set(0, 0, 0);

    const texture = createModalPlanetTexture(planetId);

    if (planetId === 'sun') {
      const geo = new THREE.SphereGeometry(1.3, 64, 64);
      const mat = new THREE.MeshBasicMaterial({ map: texture });
      modalPlanetGroup.add(new THREE.Mesh(geo, mat));

      const cGeo = new THREE.SphereGeometry(1.65, 48, 48);
      const cMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
      });
      modalCoronaMesh = new THREE.Mesh(cGeo, cMat);
      modalPlanetGroup.add(modalCoronaMesh);
    } else {
      const rad = (planetId === 'saturn') ? 1.1 : 1.3;
      const geo = new THREE.SphereGeometry(rad, 64, 64);
      const mat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: (planetId === 'jupiter' || planetId === 'saturn') ? 0.42 : 0.65,
        metalness: 0.05
      });
      modalPlanetGroup.add(new THREE.Mesh(geo, mat));

      if (planetId === 'earth') {
        const cGeo = new THREE.SphereGeometry(1.33, 56, 56);
        const cMat = new THREE.MeshStandardMaterial({
          map: createModalCloudsTexture(),
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        modalCloudsMesh = new THREE.Mesh(cGeo, cMat);
        modalPlanetGroup.add(modalCloudsMesh);

        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(1.5, 36, 36),
          new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, side: THREE.BackSide })
        );
        modalPlanetGroup.add(halo);
        modalPlanetGroup.rotation.z = 0.41;
      }

      if (planetId === 'saturn') {
        const rGeo = new THREE.RingGeometry(1.42, 2.58, 96);
        rGeo.rotateX(Math.PI / 2);
        const rMat = new THREE.MeshBasicMaterial({
          color: 0xfef08a,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9
        });
        modalPlanetGroup.add(new THREE.Mesh(rGeo, rMat));
        modalPlanetGroup.rotation.z = 0.466;
        modalPlanetGroup.rotation.x = 0.16;
      }

      if (planetId === 'uranus') {
        const uRing = new THREE.RingGeometry(1.68, 2.15, 80);
        uRing.rotateY(Math.PI / 2);
        modalPlanetGroup.add(new THREE.Mesh(uRing, new THREE.MeshBasicMaterial({ color: 0xa5f3fc, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })));
        modalPlanetGroup.rotation.z = 1.71;
      }

      // Atmospheric halos
      const haloColors = {
        venus: 0xfbbf24,
        mars: 0xf97316,
        jupiter: 0xf59e0b,
        neptune: 0x38bdf8,
        mercury: 0x94a3b8
      };
      if (haloColors[planetId]) {
        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(1.46, 32, 32),
          new THREE.MeshBasicMaterial({ color: haloColors[planetId], transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, side: THREE.BackSide })
        );
        modalPlanetGroup.add(halo);
      }
    }
  }

  /* ============================================================
     Real Voice Narration Audio Player & Synthesizer
     ============================================================ */
  let modalAudio = null;
  let modalTtsMode = 'idle'; // 'idle' | 'playing' | 'paused'
  let modalTtsRate = 1.0;
  const modalTtsRates = [1.0, 1.25, 1.5, 0.8];
  let modalTtsRateIdx = 0;
  const modalSynth = ('speechSynthesis' in window) ? window.speechSynthesis : null;

  function setModalTtsUiState(state, statusText) {
    const playBtn = document.getElementById('modalTtsPlayBtn');
    const playIcon = document.getElementById('modalTtsPlayIcon');
    const playText = document.getElementById('modalTtsPlayText');
    const wave = document.getElementById('modalTtsWave');
    const status = document.getElementById('modalTtsStatus');

    if (!playBtn) return;

    if (state === 'speaking') {
      playBtn.classList.add('playing');
      if (playIcon) playIcon.className = 'fa-solid fa-pause';
      if (playText) playText.textContent = 'หยุดชั่วคราว';
      if (wave) wave.classList.add('speaking');
      if (status) status.textContent = statusText || 'กำลังเปิดเสียงบรรยาย...';
    } else if (state === 'paused') {
      playBtn.classList.remove('playing');
      if (playIcon) playIcon.className = 'fa-solid fa-play';
      if (playText) playText.textContent = 'เล่นต่อ';
      if (wave) wave.classList.remove('speaking');
      if (status) status.textContent = statusText || 'หยุดเสียงชั่วคราว';
    } else {
      playBtn.classList.remove('playing');
      if (playIcon) playIcon.className = 'fa-solid fa-volume-high';
      if (playText) playText.textContent = 'ฟังคำบรรยาย';
      if (wave) wave.classList.remove('speaking');
      if (status) status.textContent = statusText || 'พร้อมเปิดเสียงบรรยาย';
    }
  }

  function stopModalTTS() {
    modalTtsMode = 'idle';
    if (modalAudio) {
      try {
        modalAudio.pause();
        modalAudio.currentTime = 0;
        modalAudio.onended = null;
        modalAudio.onerror = null;
        modalAudio.ontimeupdate = null;
      } catch(e){}
      modalAudio = null;
    }
    if (modalSynth) {
      try { modalSynth.cancel(); } catch(e){}
    }
    setModalTtsUiState('idle');
    const subtitle = document.getElementById('modalTtsSubtitle');
    if (subtitle) {
      subtitle.classList.remove('active');
      subtitle.textContent = '';
    }
  }

  function pauseModalTTS() {
    if (modalTtsMode !== 'playing') return;
    modalTtsMode = 'paused';
    if (modalAudio && !modalAudio.paused) {
      try { modalAudio.pause(); } catch(e){}
    }
    if (modalSynth && modalSynth.speaking) {
      try { modalSynth.pause(); } catch(e){}
    }
    setModalTtsUiState('paused');
  }

  function resumeModalTTS() {
    if (modalTtsMode !== 'paused') return;
    modalTtsMode = 'playing';
    setModalTtsUiState('speaking');
    if (modalAudio && modalAudio.paused) {
      modalAudio.playbackRate = modalTtsRate;
      const p = modalAudio.play();
      if (p && p.catch) p.catch(() => {});
    } else if (modalSynth && modalSynth.paused) {
      modalSynth.resume();
    }
  }

  function startModalTTS(planetId) {
    stopModalTTS();
    const data = planetsData[planetId];
    if (!data) return;

    if (!isSoundEnabled) {
      isSoundEnabled = true;
      if (audioToggleBtn) audioToggleBtn.classList.remove('muted');
      if (audioIcon) audioIcon.className = 'fa-solid fa-volume-high';
    }

    modalTtsMode = 'playing';
    setModalTtsUiState('speaking', `กำลังบรรยายเสียง "${data.nameTh}"...`);

    const subtitle = document.getElementById('modalTtsSubtitle');
    if (subtitle) {
      subtitle.classList.add('active');
      subtitle.textContent = `🪐 ${data.nameTh} (${data.nameEn}) — ${data.type}`;
    }

    // 1. ดึง Audio Element จาก DOM เพื่อความเข้ากันได้สูงสุดทุกเบราว์เซอร์
    let audio = document.getElementById('sharedPlanetAudio');
    if (!audio) {
      audio = new Audio();
    }
    audio.volume = 1.0;
    audio.playbackRate = modalTtsRate;

    // 2. ใช้ Base64 Audio Data จาก audioData.js เป็นอันดับแรก (เสถียร 100% ไม่มีปัญหา path หรือเน็ตเวิร์ก)
    const b64Data = (typeof planetsAudioBase64 !== 'undefined' && planetsAudioBase64 && planetsAudioBase64[planetId])
      ? planetsAudioBase64[planetId]
      : `audio/${planetId}.mp3`;

    audio.src = b64Data;
    modalAudio = audio;

    // 3. อัปเดต Subtitle ตามช่วงเวลาเสียงพูดจริง
    audio.ontimeupdate = () => {
      if (!subtitle || !audio.duration || audio.duration === 0) return;
      const pct = audio.currentTime / audio.duration;
      if (pct < 0.28) {
        subtitle.textContent = `🪐 ${data.nameTh} (${data.nameEn}) — ${data.type}`;
      } else if (pct < 0.65) {
        subtitle.textContent = `📊 ข้อมูลกายภาพ: เส้นผ่านศูนย์กลาง ${data.diameter} • ระยะห่าง ${data.distance}`;
      } else if (pct < 0.88) {
        subtitle.textContent = `✨ จุดเด่นสำคัญ: ${data.bullets && data.bullets[0] ? data.bullets[0] : (data.desc ? data.desc.substring(0, 60) : '')}`;
      } else {
        subtitle.textContent = `🚀 สาระน่ารู้: ${data.desc ? data.desc.substring(0, 80) : ''}...`;
      }
    };

    audio.onended = () => {
      modalTtsMode = 'idle';
      setModalTtsUiState('idle', 'บรรยายเสียงจบสมบูรณ์ 🚀✨');
      if (subtitle) {
        subtitle.textContent = `✅ บรรยายเสียง "${data.nameTh}" จบสมบูรณ์แล้ว`;
      }
    };

    audio.onerror = (e) => {
      console.warn(`Audio playback error for ${planetId}:`, e);
      if (modalSynth) {
        try {
          modalSynth.cancel();
          const speechText = `${data.nameTh} ${data.nameEn} ${data.type}. ${data.desc}`;
          const utt = new SpeechSynthesisUtterance(speechText);
          utt.lang = 'th-TH';
          utt.rate = modalTtsRate;
          utt.onend = () => {
            modalTtsMode = 'idle';
            setModalTtsUiState('idle', 'บรรยายเสียงจบแล้ว');
          };
          modalSynth.speak(utt);
        } catch(err){}
      }
    };

    const p = audio.play();
    if (p && p.catch) {
      p.catch(err => {
        console.warn('Audio play was prevented by browser:', err);
        setModalTtsUiState('paused', 'คลิกปุ่มนี้เพื่อเริ่มฟังเสียง');
      });
    }
  }

  // Modal TTS Listeners
  const modalTtsPlayBtn = document.getElementById('modalTtsPlayBtn');
  const modalTtsStopBtn = document.getElementById('modalTtsStopBtn');
  const modalTtsRateBtn = document.getElementById('modalTtsRateBtn');
  const modalTtsRateText = document.getElementById('modalTtsRateText');

  if (modalTtsPlayBtn) {
    modalTtsPlayBtn.addEventListener('click', () => {
      playClickSound();
      if (modalTtsMode === 'playing') {
        pauseModalTTS();
      } else if (modalTtsMode === 'paused') {
        resumeModalTTS();
      } else {
        if (activeModalPlanetId) {
          startModalTTS(activeModalPlanetId);
        }
      }
    });
  }

  if (modalTtsStopBtn) {
    modalTtsStopBtn.addEventListener('click', () => {
      playClickSound();
      stopModalTTS();
    });
  }

  if (modalTtsRateBtn) {
    modalTtsRateBtn.addEventListener('click', () => {
      playClickSound();
      modalTtsRateIdx = (modalTtsRateIdx + 1) % modalTtsRates.length;
      modalTtsRate = modalTtsRates[modalTtsRateIdx];
      if (modalTtsRateText) {
        modalTtsRateText.textContent = modalTtsRate.toFixed(modalTtsRate % 1 === 0 ? 1 : 2) + 'x';
      }
      if (modalAudio) {
        modalAudio.playbackRate = modalTtsRate;
      }
    });
  }

  function openPlanetModal(planetId) {
    const data = planetsData[planetId];
    const modalEl = document.getElementById('planetModal');
    if (!data || !modalEl) return;

    activeModalPlanetId = planetId;

    // 1. เปิดหน้าต่างโมดอลทันที (เปิดก่อนเสมอ เพื่อให้แสดงผล 100% แม้ 3D หรือเสียงจะโหลดช้า)
    modalEl.classList.add('active');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // 2. บันทึกและแสดงผลข้อมูลดาราศาสตร์ ข้อเท็จจริงสำคัญ และบทความ
    try {
      const nameThEl = document.getElementById('modalPlanetNameTh');
      if (nameThEl) nameThEl.textContent = data.nameTh;

      const nameEnEl = document.getElementById('modalPlanetNameEn');
      if (nameEnEl) nameEnEl.textContent = data.nameEn;

      const typeEl = document.getElementById('modalPlanetType');
      if (typeEl) typeEl.textContent = data.type;

      const diamEl = document.getElementById('statDiameter');
      if (diamEl) diamEl.textContent = data.diameter;

      const distEl = document.getElementById('statDistance');
      if (distEl) distEl.textContent = data.distance;

      const rotEl = document.getElementById('statRotation');
      if (rotEl) rotEl.textContent = data.rotation;

      const orbEl = document.getElementById('statOrbit');
      if (orbEl) orbEl.textContent = data.orbit;

      const tempEl = document.getElementById('statTemp');
      if (tempEl) tempEl.textContent = data.temp;

      const moonsEl = document.getElementById('statMoons');
      if (moonsEl) moonsEl.textContent = data.moons;

      const descEl = document.getElementById('modalDescription');
      if (descEl) descEl.textContent = data.desc;

      currentWikiUrl = data.wikiUrl;

      const modalTtsStatus = document.getElementById('modalTtsStatus');
      if (modalTtsStatus) modalTtsStatus.textContent = `พร้อมเปิดเสียงบรรยาย "${data.nameTh}"`;

      // แสดงรายการจุดเด่นและข้อเท็จจริงสำคัญ (Bullet Points)
      const bulletsListEl = document.getElementById('modalBulletsList');
      if (bulletsListEl && data.bullets) {
        bulletsListEl.innerHTML = data.bullets.map(b => `
          <li class="modal-bullet-item">
            <i class="fa-solid fa-circle-dot"></i>
            <span>${b}</span>
          </li>
        `).join('');
      }

      // แสดงปุ่ม YouTube ลิงก์ตรงของดวงดาว
      const ytBtnEl = document.getElementById('modalYoutubeBtn');
      if (ytBtnEl) {
        if (data.youtubeUrl) {
          ytBtnEl.href = data.youtubeUrl;
          ytBtnEl.style.display = 'inline-flex';
        } else {
          ytBtnEl.style.display = 'none';
        }
      }
    } catch (err) {
      console.warn('Error setting modal content:', err);
    }

    // 3. ควบคุมเสียงประกอบ
    try {
      stopModalTTS();
      playWarpSound();
    } catch (err) {}

    // 4. แสดงผลโมเดล 3D แบบหมุนรอบตัว
    try {
      updateModalThreePlanet(planetId);
    } catch (err) {
      console.warn('WebGL 3D update error:', err);
    }

    requestAnimationFrame(() => {
      try {
        if (modalPlanetCanvas && modalRenderer && modalCamera) {
          const box = modalPlanetCanvas.parentElement;
          const w = (box && box.clientWidth > 0) ? box.clientWidth : 240;
          const h = (box && box.clientHeight > 0) ? box.clientHeight : 240;
          modalCamera.aspect = w / h;
          modalCamera.updateProjectionMatrix();
          modalRenderer.setSize(w, h);
        }
      } catch (err) {}
    });
  }

  function closePlanetModal() {
    try { stopModalTTS(); } catch(e){}
    const modalEl = document.getElementById('planetModal');
    if (modalEl) {
      modalEl.classList.remove('active');
      modalEl.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      try { playHoverSound(); } catch(e){}
    }
  }

  // ส่งออกฟังก์ชันสู่ระดับโกลบอล (Global Scope) เพื่อให้เรียกใช้งานได้ทุกที่ทั้งแบบ inline onclick และจากปุ่มต่างๆ
  window.openPlanetModal = openPlanetModal;
  window.closePlanetModal = closePlanetModal;
  window.planetsData = planetsData;

  // ระบบคลิกเปิดดูข้อมูลดวงดาวฉบับสมบูรณ์ (Direct Card Click & Keydown)
  planetCards.forEach(card => {
    card.addEventListener('click', (e) => {
      const id = card.getAttribute('data-id');
      if (id && planetsData[id]) {
        openPlanetModal(id);
      }
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = card.getAttribute('data-id');
        if (id && planetsData[id]) {
          openPlanetModal(id);
        }
      }
    });
  });

  // Event Delegation ระดับ Document การันตีว่าคลิกส่วนไหนของการ์ดดาวหรือปุ่มในตัวการ์ดก็เปิดข้อมูลได้ 100%
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.planet-card');
    if (card) {
      const id = card.getAttribute('data-id');
      if (id && planetsData[id]) {
        openPlanetModal(id);
      }
    }
  });

  // ระบบ Touch Tap สำหรับโทรศัพท์มือถือและ iPad (เปิดข้อมูลทันทีเมื่อแตะการ์ดโดยไม่หน่วง)
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    const card = e.target.closest('.planet-card');
    if (!card) return;
    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const dx = Math.abs(touch.clientX - touchStartX);
      const dy = Math.abs(touch.clientY - touchStartY);
      const dt = Date.now() - touchStartTime;
      // หากแตะโดยเลื่อนนิ้วน้อยกว่า 15px และเวลาไม่เกิน 400ms ถือเป็นการแตะเลือกการ์ด
      if (dx < 15 && dy < 15 && dt < 450) {
        const id = card.getAttribute('data-id');
        if (id && planetsData[id]) {
          openPlanetModal(id);
        }
      }
    }
  }, { passive: true });

  // รองรับการกดปุ่ม ESC เพื่อปิดหน้าต่างโมดอล
  document.addEventListener('keydown', (e) => {
    const modalEl = document.getElementById('planetModal');
    if (e.key === 'Escape' && modalEl && modalEl.classList.contains('active')) {
      closePlanetModal();
    }
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closePlanetModal);
  }

  if (planetModal) {
    planetModal.addEventListener('click', (e) => {
      if (e.target === planetModal) closePlanetModal();
    });
  }

  if (modalExploreMore) {
    modalExploreMore.addEventListener('click', () => {
      if (currentWikiUrl) {
        window.open(currentWikiUrl, '_blank', 'noopener,noreferrer');
      }
    });
  }

  /* ============================================================
     10. Interactive Quiz & Activity Controller (4 ช่องทาง)
     ============================================================ */
  const quizModal = document.getElementById('quizModal');
  const quizModalCloseBtn = document.getElementById('quizModalCloseBtn');
  const quizBadge = document.getElementById('quizBadge');
  const quizTitle = document.getElementById('quizTitle');
  const quizDesc = document.getElementById('quizDesc');
  const quizQuestionsContainer = document.getElementById('quizQuestionsContainer');
  const quizSubmitBtn = document.getElementById('quizSubmitBtn');
  const quizScoreResult = document.getElementById('quizScoreResult');

  const quizDataBank = {
    pre: {
      badge: 'แบบทดสอบก่อนเรียน // PRE-ASSESSMENT',
      title: 'วัดความรู้พื้นฐานระบบสุริยะจักรวาล',
      desc: 'ทดสอบความรู้และมโนทัศน์เบื้องต้นก่อนเริ่มต้นการเดินทางสำรวจดาราศาสตร์',
      questions: [
        {
          q: '1. ศูนย์กลางของระบบสุริยะที่มีแรงโน้มถ่วงยึดเหนี่ยวทุกสิ่งคือวัตถุใด?',
          options: ['โลก (Earth)', 'ดวงอาทิตย์ (The Sun)', 'ดาวพฤหัสบดี (Jupiter)', 'หลุมดำใจกลางทางช้างเผือก'],
          answer: 1,
          explain: 'ดวงอาทิตย์เป็นดาวฤกษ์ดวงเดียวและเป็นศูนย์กลางของระบบสุริยะ มีมวล 99.86% ของทั้งระบบ'
        },
        {
          q: '2. ดาวเคราะห์ดวงใดในระบบสุริยะที่มีขนาดใหญ่ที่สุด?',
          options: ['ดาวเสาร์', 'ดาวอังคาร', 'ดาวพฤหัสบดี', 'ดาวยูเรนัส'],
          answer: 2,
          explain: 'ดาวพฤหัสบดีเป็นดาวยักษ์แก๊สที่มีขนาดใหญ่ที่สุด สามารถบรรจุโลกได้มากกว่า 1,300 ใบ'
        },
        {
          q: '3. ดาวเคราะห์ที่อยู่ใกล้ดวงอาทิตย์มากที่สุดในลำดับที่ 1 คือข้อใด?',
          options: ['ดาวพุธ', 'ดาวศุกร์', 'โลก', 'ดาวอังคาร'],
          answer: 0,
          explain: 'ดาวพุธเป็นดาวเคราะห์ลำดับแรก ห่างจากดวงอาทิตย์เฉลี่ยเพียง 57.9 ล้านกิโลเมตร'
        }
      ]
    },
    post: {
      badge: 'แบบทดสอบหลังเรียน // POST-ASSESSMENT',
      title: 'ประเมินผลสัมฤทธิ์การเรียนรู้ระบบสุริยะ',
      desc: 'วัดความรู้ความเข้าใจเชิงลึกหลังจากการสำรวจองค์ประกอบของระบบสุริยะ',
      questions: [
        {
          q: '1. ดาวเคราะห์ดวงใดมีอุณหภูมิเฉลี่ย "ร้อนที่สุด" ในระบบสุริยะ เพราะเหตุใด?',
          options: [
            'ดาวพุธ เพราะอยู่ใกล้ดวงอาทิตย์ที่สุด',
            'ดาวศุกร์ เพราะมีภาวะเรือนกระจกขั้นรุนแรงจากก๊าซ CO2',
            'ดาวอังคาร เพราะมีสีแดงดูดความร้อน',
            'ดาวพฤหัสบดี เพราะมีแรงโน้มถ่วงสูงมาก'
          ],
          answer: 1,
          explain: 'ดาวศุกร์ร้อนที่สุด (~465°C) จากปรากฏการณ์เรือนกระจกขั้นรุนแรง แม้จะอยู่ไกลกว่าดาวพุธก็ตาม'
        },
        {
          q: '2. ข้อใดจัดอยู่ในกลุ่ม "ดาวเคราะห์หิน" (Terrestrial Planets) ทั้งหมด?',
          options: [
            'ดาวพุธ, ดาวศุกร์, โลก, ดาวอังคาร',
            'ดาวพฤหัสบดี, ดาวเสาร์, ดาวยูเรนัส, ดาวเนปจูน',
            'โลก, ดาวอังคาร, ดาวพฤหัสบดี, ดาวเสาร์',
            'ดาวพุธ, โลก, ดาวเสาร์, ดาวเนปจูน'
          ],
          answer: 0,
          explain: 'ดาวเคราะห์หินคือดาวเคราะห์ชั้นใน 4 ดวงแรกที่มีพื้นผิวเป็นของแข็งและหิน'
        },
        {
          q: '3. ปรากฏการณ์ "จุดแดงใหญ่" (Great Red Spot) พบบนดาวเคราะห์ดวงใด?',
          options: ['ดาวอังคาร', 'ดาวเสาร์', 'ดาวพฤหัสบดี', 'ดาวยูเรนัส'],
          answer: 2,
          explain: 'จุดแดงใหญ่คือพายุแอนติไซโคลนขนาดยักษ์ในชั้นบรรยากาศของดาวพฤหัสบดี'
        }
      ]
    },
    act1: {
      badge: 'กิจกรรมการเรียนรู้ที่ 1 // MISSION ALPHA',
      title: 'ภารกิจ: สำรวจสถิติดาราศาสตร์และวงแหวน',
      desc: 'ฝึกจำแนกดาวเคราะห์ตามลักษณะเฉพาะทางกายภาพและโครงสร้างวงแหวน',
      questions: [
        {
          q: '1. ดาวเคราะห์ดวงใดมี "ระบบวงแหวนน้ำแข็ง" ที่กว้างใหญ่และมองเห็นชัดเจนที่สุด?',
          options: ['ดาวยูเรนัส', 'ดาวเนปจูน', 'ดาวเสาร์', 'ดาวพฤหัสบดี'],
          answer: 2,
          explain: 'ดาวเสาร์มีระบบวงแหวนที่สวยงามและกว้างใหญ่ที่สุด ประกอบด้วยก้อนน้ำแข็งและหิน'
        },
        {
          q: '2. วัตถุใดในระบบสุริยะที่มีจำนวนดวงจันทร์บริวารมากที่สุดในปัจจุบัน (>140 ดวง)?',
          options: ['โลก', 'ดาวพฤหัสบดี', 'ดาวเสาร์', 'ดาวเนปจูน'],
          answer: 2,
          explain: 'ดาวเสาร์มีดวงจันทร์ที่ค้นพบและยืนยันแล้วมากที่สุดถึง 146 ดวง'
        }
      ]
    },
    act2: {
      badge: 'กิจกรรมการเรียนรู้ที่ 2 // MISSION BETA',
      title: 'ภารกิจ: แกะรอยความลับของจักรวาล',
      desc: 'ทดสอบความรู้เชิงสำรวจเกี่ยวกับความมหัศจรรย์และสถิติสุดขั้วในอวกาศ',
      questions: [
        {
          q: '1. ดาวเคราะห์ดวงใดที่ "แกนหมุนเอียงถึง 98 องศา" จนดูเหมือนกลิ้งไปบนวงโคจร?',
          options: ['ดาวเนปจูน', 'ดาวอังคาร', 'ดาวยูเรนัส', 'ดาวศุกร์'],
          answer: 2,
          explain: 'ดาวยูเรนัสมีแกนหมุนเอียงตะแคงข้างเกือบขนานกับระนาบวงโคจรอย่างน่าอัศจรรย์'
        },
        {
          q: '2. "Olympus Mons" ภูเขาไฟที่สูงที่สุดในระบบสุริยะ (สูงกว่าเอเวอเรสต์เกือบ 3 เท่า) ตั้งอยู่บนดาวดวงใด?',
          options: ['โลก', 'ดาวอังคาร', 'ดวงจันทร์', 'ดาวศุกร์'],
          answer: 1,
          explain: 'ภูเขาไฟโอลิมปัสอยู่บนดาวอังคาร เป็นภูเขาไฟรูปโล่ที่สูงถึง 21.9 กิโลเมตร'
        }
      ]
    }
  };

  let currentQuizKey = null;

  function renderQuiz(quizKey) {
    const quiz = quizDataBank[quizKey];
    if (!quiz || !quizModal) return;

    playWarpSound();
    currentQuizKey = quizKey;
    quizBadge.textContent = quiz.badge;
    quizTitle.textContent = quiz.title;
    quizDesc.textContent = quiz.desc;
    quizScoreResult.style.display = 'none';
    quizSubmitBtn.style.display = 'flex';

    quizQuestionsContainer.innerHTML = quiz.questions.map((item, qIdx) => `
      <div class="quiz-q-card" data-qindex="${qIdx}">
        <p class="quiz-q-text">${item.q}</p>
        <div class="quiz-options">
          ${item.options.map((opt, oIdx) => `
            <label class="quiz-option-label" data-q="${qIdx}" data-oidx="${oIdx}">
              <input type="radio" name="question_${qIdx}" value="${oIdx}" data-q="${qIdx}" data-oidx="${oIdx}">
              <span>${opt}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `).join('');

    // จัดการเลือกตัวเลือกบน iOS / iPadOS / Android / Desktop ให้แตะติดทันที
    let lastModalTapTime = 0;
    const selectModalOption = (label) => {
      const now = Date.now();
      if (now - lastModalTapTime < 60) return;
      lastModalTapTime = now;

      const qCard = label.closest('.quiz-q-card');
      if (qCard) {
        qCard.querySelectorAll('.quiz-option-label').forEach(l => l.classList.remove('selected'));
      }
      label.classList.add('selected');
      const radio = label.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    };

    quizQuestionsContainer.querySelectorAll('.quiz-option-label').forEach(label => {
      label.addEventListener('click', () => selectModalOption(label));
      label.addEventListener('touchend', () => selectModalOption(label), { passive: true });
    });

    quizQuestionsContainer.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const label = radio.closest('.quiz-option-label');
        if (label) selectModalOption(label);
      });
    });

    quizModal.classList.add('active');
    quizModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeQuizModal() {
    if (quizModal) {
      quizModal.classList.remove('active');
      quizModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      playHoverSound();
    }
  }

  /* ============================================================
     Quiz Dropdown Items Navigation Controller
     ============================================================ */

  document.querySelectorAll('.dropdown-item').forEach(item => {
    const handleItemClick = (e) => {
      const href = item.getAttribute('href');
      const quizType = item.getAttribute('data-quiz');
      if (quizDropdown) {
        quizDropdown.classList.remove('open');
        if (dropdownTrigger) dropdownTrigger.setAttribute('aria-expanded', 'false');
      }
      playClickSound();

      if (href && href !== '#' && !href.startsWith('javascript:')) {
        window.location.href = href;
        return;
      }
      if (quizModal && quizType && quizDataBank[quizType]) {
        if (e.cancelable) e.preventDefault();
        renderQuiz(quizType);
      }
    };

    item.addEventListener('click', handleItemClick);
    item.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleItemClick(e);
    }, { passive: false });
  });

  if (quizModalCloseBtn) {
    quizModalCloseBtn.addEventListener('click', closeQuizModal);
  }

  if (quizModal) {
    quizModal.addEventListener('click', (e) => {
      if (e.target === quizModal) closeQuizModal();
    });
  }

  // ส่งคำตอบและตรวจผล
  if (quizSubmitBtn) {
    quizSubmitBtn.addEventListener('click', () => {
      if (!currentQuizKey) return;
      const quiz = quizDataBank[currentQuizKey];
      let score = 0;
      let allAnswered = true;

      quiz.questions.forEach((item, qIdx) => {
        const selected = document.querySelector(`input[name="question_${qIdx}"]:checked`);
        const qCard = document.querySelector(`.quiz-q-card[data-qindex="${qIdx}"]`);
        
        if (!selected) {
          allAnswered = false;
        } else {
          const userVal = parseInt(selected.value, 10);
          const labels = qCard.querySelectorAll('.quiz-option-label');
          
          labels.forEach((label, lIdx) => {
            label.classList.remove('correct', 'incorrect');
            if (lIdx === item.answer) {
              label.classList.add('correct');
            } else if (lIdx === userVal && userVal !== item.answer) {
              label.classList.add('incorrect');
            }
          });

          if (userVal === item.answer) {
            score++;
          }
        }
      });

      if (!allAnswered) {
        alert('กรุณาตอบคำถามให้ครบทุกข้อก่อนส่งคำตอบครับ 🚀✨');
        return;
      }

      playSuccessSound();

      quizScoreResult.style.display = 'block';
      const percentage = Math.round((score / quiz.questions.length) * 100);
      let feedback = '';
      if (percentage === 100) feedback = '🏆 ยอดเยี่ยมระดับผู้เชี่ยวชาญ! คุณมีความรู้ความเข้าใจในระดับยอดเยี่ยมสูงสุด 🚀✨';
      else if (percentage >= 60) feedback = '🌟 เก่งมากครับ! มีความรู้ความเข้าใจในระดับที่ดีมาก สามารถสำรวจต่อได้เลย 🛰️';
      else feedback = '🪐 ทำได้ดีครับ! ลองคลิกศึกษาข้อมูลดวงดาวในหน้าเว็บแล้วลองท้าทายใหม่อีกครั้งนะ';

      quizScoreResult.innerHTML = `
        <div>ผลคะแนนของคุณ: <strong>${score} / ${quiz.questions.length}</strong> (${percentage}%)</div>
        <div style="font-size: 0.98rem; margin-top: 0.5rem; color: #bae6fd; font-weight: 400;">${feedback}</div>
      `;

      quizSubmitBtn.style.display = 'none';
    });
  }

  // ปิดหน้าต่างด้วยปุ่ม Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePlanetModal();
      closeQuizModal();
    }
  });

  // ตรวจจับ Hash ใน URL เพื่อเชื่อมโยงการเปิดแบบทดสอบข้ามหน้า
  function checkUrlHashForQuiz() {
    const hash = window.location.hash;
    if (!hash) return;
    if (hash === '#quiz-pre') {
      window.location.href = '1.html';
    } else if (hash === '#quiz-post') {
      window.location.href = '2.html';
    } else if (hash === '#quiz-act1') {
      window.location.href = '3.html';
    } else if (hash === '#quiz-act2') {
      setTimeout(() => renderQuiz('act2'), 350);
    }
  }

  checkUrlHashForQuiz();
  window.addEventListener('hashchange', checkUrlHashForQuiz);

});
