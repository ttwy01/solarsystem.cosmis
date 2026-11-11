/**
 * Universal Navigation Ribbon Scroller & Portal Dropdown (navScroll.js)
 * ทำให้แถบนำทาง (Navbar Ribbon) เลื่อนได้บนทุกอุปกรณ์และทุกหน้าจอ
 * และแก้ปัญหาระบบ iOS Safari ไม่แสดงตัวเลือกแบบทดสอบ (Portal Dropdown Controller):
 * 1. หมุนล้อเมาส์ (Mouse Wheel) เลื่อนแถบนำทางซ้าย-ขวาได้ทันที
 * 2. คลิกและลากเมาส์ (Mouse Drag to Scroll) บนจอคอมพิวเตอร์และโน้ตบุ๊ก
 * 3. เลื่อนหมวดหมู่ที่กำลังใช้งาน (Active Item) ให้อยู่กึ่งกลางสายตาโดยอัตโนมัติ
 * 4. ย้ายเมนูดรอปดาวน์ "แบบทดสอบ" ไปยัง <body> (Portal Pattern) เพื่อไม่ให้ถูก
 *    overflow: hidden / -webkit-overflow-scrolling บน iOS Safari ตัดขาด
 * 5. ตัวเลือก "ก่อนเรียน", "หลังเรียน", "กิจกรรม 1", "กิจกรรม 2", "ศูนย์แอดมิน" แสดงชัดเจนและแตะเลือกได้ 100%
 */
(function () {
  'use strict';

  function initUniversalDropdown() {
    const quizDropdown = document.getElementById('quizDropdown') || document.querySelector('.nav-item.dropdown');
    const dropdownTrigger = document.getElementById('dropdownTrigger') || (quizDropdown ? quizDropdown.querySelector('.dropdown-trigger') : null);
    const dropdownMenu = document.getElementById('dropdownMenu') || (quizDropdown ? quizDropdown.querySelector('.dropdown-menu') : null);
    const navMenu = document.getElementById('navMenu') || document.querySelector('.nav-menu');

    if (!quizDropdown || !dropdownTrigger || !dropdownMenu) return;

    let isPortaled = false;

    // ย้าย dropdownMenu ไปยัง <body> เพื่อหลบเลี่ยงการถูก overflow หรือ backdrop-filter ตัดขาดบน iOS Safari
    function moveToBody() {
      if (!isPortaled && dropdownMenu.parentNode !== document.body) {
        document.body.appendChild(dropdownMenu);
        isPortaled = true;
        dropdownMenu.setAttribute('data-portaled', 'true');
      }
    }

    // คำนวณตำแหน่งพิกัดของเมนูดรอปดาวน์ให้แนบชิดใต้ปุ่ม trigger เสมอ
    function positionMenu() {
      if (!dropdownTrigger || !dropdownMenu) return;
      const rect = dropdownTrigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

      // อยู่ใต้ปุ่ม trigger ประมาณ 6px
      const top = Math.round(rect.bottom + 6);
      // จัดวางให้ชิดขอบขวาของปุ่ม พร้อมเว้นระยะขอบจออย่างน้อย 8px
      const right = Math.max(8, Math.round(viewportWidth - rect.right));
      const maxWidth = Math.min(280, viewportWidth - 16);

      dropdownMenu.style.setProperty('position', 'fixed', 'important');
      dropdownMenu.style.setProperty('top', top + 'px', 'important');
      dropdownMenu.style.setProperty('right', right + 'px', 'important');
      dropdownMenu.style.setProperty('left', 'auto', 'important');
      dropdownMenu.style.setProperty('bottom', 'auto', 'important');
      dropdownMenu.style.setProperty('max-width', maxWidth + 'px', 'important');
      dropdownMenu.style.setProperty('min-width', '190px', 'important');
      dropdownMenu.style.setProperty('width', 'max-content', 'important');
      dropdownMenu.style.setProperty('z-index', '2147483647', 'important');
      dropdownMenu.style.setProperty('margin', '0', 'important');
    }

    function showMenu() {
      moveToBody();
      positionMenu();
      quizDropdown.classList.add('open');
      dropdownTrigger.setAttribute('aria-expanded', 'true');
      if (navMenu) navMenu.classList.add('dropdown-open');

      dropdownMenu.classList.add('portal-open');
      dropdownMenu.classList.add('open');
      dropdownMenu.style.setProperty('display', 'flex', 'important');
      dropdownMenu.style.setProperty('visibility', 'visible', 'important');
      dropdownMenu.style.setProperty('opacity', '1', 'important');
      dropdownMenu.style.setProperty('pointer-events', 'auto', 'important');
      dropdownMenu.style.setProperty('transform', 'none', 'important');
      dropdownMenu.style.setProperty('animation', 'none', 'important');

      try {
        if (typeof playHoverSound === 'function') playHoverSound();
      } catch (err) {}
    }

    function hideMenu() {
      quizDropdown.classList.remove('open');
      dropdownTrigger.setAttribute('aria-expanded', 'false');
      if (navMenu) navMenu.classList.remove('dropdown-open');

      dropdownMenu.classList.remove('portal-open');
      dropdownMenu.classList.remove('open');
      dropdownMenu.style.setProperty('display', 'none', 'important');
      dropdownMenu.style.setProperty('visibility', 'hidden', 'important');
      dropdownMenu.style.setProperty('opacity', '0', 'important');
      dropdownMenu.style.setProperty('pointer-events', 'none', 'important');
    }

    function isMenuOpen() {
      return dropdownMenu.classList.contains('portal-open') || 
             dropdownMenu.classList.contains('open') || 
             quizDropdown.classList.contains('open') ||
             dropdownMenu.style.display === 'flex';
    }

    function toggleMenu(e) {
      if (e) {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      }
      if (isMenuOpen()) {
        hideMenu();
      } else {
        showMenu();
      }
    }

    // Expose methods globally for external handlers
    window.toggleQuizDropdown = toggleMenu;
    window.openQuizDropdown = showMenu;
    window.closeQuizDropdown = hideMenu;

    // Fast responsive tap/click handling with debounce
    let lastToggleTime = 0;
    function handleTriggerAction(e) {
      const now = Date.now();
      if (now - lastToggleTime < 250) {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        return;
      }
      lastToggleTime = now;
      toggleMenu(e);
    }

    // Use capture phase so this portal handler intercepts before any other listener
    dropdownTrigger.addEventListener('touchend', handleTriggerAction, { capture: true, passive: false });
    dropdownTrigger.addEventListener('click', handleTriggerAction, { capture: true });

    // ป้องกัน Event ภายในการแตะเมนูดรอปดาวน์ไม่ให้กระดอนไปโดน document listener
    ['touchstart', 'touchend', 'click'].forEach(function (evt) {
      dropdownMenu.addEventListener(evt, function (e) {
        e.stopPropagation();
      }, { passive: evt === 'touchstart' });
    });

    // ให้การแตะตัวเลือกลิงก์บน iOS นำทางไปยังหน้าแบบทดสอบได้ทันที
    dropdownMenu.querySelectorAll('.dropdown-item').forEach(function (item) {
      function handleItemTap(e) {
        const href = item.getAttribute('href');
        const onclickAttr = item.getAttribute('onclick');

        if (onclickAttr) {
          hideMenu();
          return;
        }

        if (href && href !== '#' && !href.startsWith('javascript:')) {
          if (e && e.cancelable) e.preventDefault();
          hideMenu();
          window.location.href = href;
        }
      }

      item.addEventListener('touchend', handleItemTap, { passive: false });
      item.addEventListener('click', handleItemTap);
    });

    // ปิดเมนูเมื่อแตะจุดอื่นบนหน้าจอ
    ['touchstart', 'click'].forEach(function (evt) {
      document.addEventListener(evt, function (e) {
        if (!isMenuOpen()) return;
        if (!e.target.closest('#quizDropdown, #dropdownTrigger, #dropdownMenu, .dropdown-menu')) {
          hideMenu();
        }
      }, { passive: true });
    });

    // ปิดเมนูเมื่อเลื่อนหน้าจอ
    window.addEventListener('scroll', function () {
      if (isMenuOpen()) hideMenu();
    }, { passive: true });

    // ปรับตำแหน่งเมื่อปรับขนาดหน้าจอหรือหมุนอุปกรณ์
    window.addEventListener('resize', function () {
      if (isMenuOpen()) positionMenu();
    }, { passive: true });

    window.addEventListener('orientationchange', function () {
      setTimeout(function () {
        if (isMenuOpen()) positionMenu();
      }, 100);
    });

    // หากแถบเมนูเลื่อนแนวนอน ให้ปิดดรอปดาวน์
    if (navMenu) {
      navMenu.addEventListener('scroll', function () {
        if (isMenuOpen()) hideMenu();
      }, { passive: true });
    }

    // รองรับการ Hover เมาส์บนจอ Desktop
    let hoverTimer = null;
    quizDropdown.addEventListener('mouseenter', function () {
      if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
        clearTimeout(hoverTimer);
        showMenu();
      }
    });
    quizDropdown.addEventListener('mouseleave', function () {
      if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
        hoverTimer = setTimeout(function () {
          if (!dropdownMenu.matches(':hover')) hideMenu();
        }, 150);
      }
    });
    dropdownMenu.addEventListener('mouseenter', function () {
      if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
        clearTimeout(hoverTimer);
      }
    });
    dropdownMenu.addEventListener('mouseleave', function () {
      if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
        hoverTimer = setTimeout(function () {
          hideMenu();
        }, 150);
      }
    });

    // ติดตั้ง MutationObserver ตรวจจับสถานะ class .open
    if (window.MutationObserver) {
      const observer = new MutationObserver(function () {
        const hasOpen = quizDropdown.classList.contains('open');
        if (hasOpen && !dropdownMenu.classList.contains('portal-open')) {
          showMenu();
        } else if (!hasOpen && dropdownMenu.classList.contains('portal-open')) {
          hideMenu();
        }
      });
      observer.observe(quizDropdown, { attributes: true, attributeFilter: ['class'] });
    }
  }

  function initNavScroll() {
    initUniversalDropdown();

    const navMenu = document.getElementById('navMenu') || document.querySelector('.nav-menu');
    if (!navMenu) return;

    // 1. หมุนล้อเมาส์ (Mouse Wheel) ให้เลื่อนแนวนอนได้อย่างลื่นไหล
    navMenu.addEventListener('wheel', function (e) {
      if (e.target.closest('#quizDropdown, .dropdown, .dropdown-menu, .dropdown-trigger')) return;
      if (navMenu.scrollWidth <= navMenu.clientWidth) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (delta !== 0) {
        e.preventDefault();
        navMenu.scrollLeft += delta * 0.9;
        closeOpenDropdowns();
      }
    }, { passive: false });

    // 2. คลิกและลากด้วยเมาส์ (Drag to Scroll)
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;
    let hasDragged = false;

    navMenu.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return; // เฉพาะคลิกซ้าย
      if (e.target.closest('#quizDropdown, .dropdown, .dropdown-menu, .dropdown-trigger')) {
        return; // ไม่เริ่มลากเลื่อนแถบเมื่อกำลังคลิกที่ปุ่มหรือเมนูดรอปดาวน์
      }
      isDown = true;
      hasDragged = false;
      startX = e.pageX - navMenu.offsetLeft;
      scrollStart = navMenu.scrollLeft;
      navMenu.style.cursor = 'grabbing';
      navMenu.style.userSelect = 'none';
    });

    window.addEventListener('mouseup', function () {
      if (!isDown) return;
      isDown = false;
      navMenu.style.cursor = '';
      navMenu.style.userSelect = '';
      setTimeout(function () {
        hasDragged = false;
      }, 50);
    });

    window.addEventListener('mousemove', function (e) {
      if (!isDown) return;
      const x = e.pageX - navMenu.offsetLeft;
      const walk = (x - startX) * 1.15;
      if (Math.abs(walk) > 4) {
        hasDragged = true;
        navMenu.scrollLeft = scrollStart - walk;
        closeOpenDropdowns();
      }
    });

    // ป้องกันการเผลอกดลิงก์ขณะลากเมาส์เลื่อนแถบ
    navMenu.addEventListener('click', function (e) {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    // ฟังก์ชันช่วยปิดดรอปดาวน์เมื่อผู้ใช้เลื่อนแถบ
    function closeOpenDropdowns() {
      if (window.closeQuizDropdown) {
        window.closeQuizDropdown();
      }
      document.querySelectorAll('#quizDropdown.open, .dropdown.open').forEach(function (d) {
        d.classList.remove('open');
        const trigger = d.querySelector('#dropdownTrigger, .dropdown-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    }

    // 3. ปรับตำแหน่งเมนูที่ Active ให้อยู่ในมุมมองที่เห็นชัดเจนทันทีเมื่อเปิดหน้า
    setTimeout(function () {
      const activeLink = navMenu.querySelector('.nav-link.active, .dropdown-item.active');
      if (activeLink) {
        try {
          activeLink.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        } catch (err) {
          const itemRect = activeLink.getBoundingClientRect();
          const menuRect = navMenu.getBoundingClientRect();
          if (itemRect.left < menuRect.left || itemRect.right > menuRect.right) {
            navMenu.scrollLeft = activeLink.offsetLeft - (navMenu.clientWidth / 2) + (activeLink.clientWidth / 2);
          }
        }
      }
    }, 250);
  }

  // เรียกทำงานเมื่อโหลดเอกสารเสร็จสมบูรณ์
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavScroll);
  } else {
    initNavScroll();
  }
})();
