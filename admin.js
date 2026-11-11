/**
 * ============================================================
 * ระบบศูนย์ควบคุมแอดมินและครูผู้สอน (Solar System Admin Portal)
 * จัดการข้อมูลคะแนนของ 1.html (ก่อนเรียน), 2.html (หลังเรียน),
 * 3.html (กิจกรรมที่ 1), และ 4.html (แบบทดสอบกิจกรรมที่ 2)
 * รองรับการใช้งานในทุกหน้าของโครงการห้องเรียนระบบสุริยะ
 * ============================================================
 */

(function () {
  'use strict';

  // คีย์จัดเก็บข้อมูลใน localStorage
  const CONFIG = {
    KEYS: {
      pre: 'solar_system_quiz_pre_records',    // 1.html
      post: 'solar_system_quiz_post_records',  // 2.html
      act1: 'solar_system_quiz_act1_records',  // 3.html
      act2: 'solar_system_quiz_act2_records',  // 4.html
      adminPass: 'solar_system_admin_pass',
      googleSheet: 'solar_system_google_sheet_url',
      sessionLogged: 'solar_admin_logged_in'
    },
    DEFAULT_ADMIN_PASS: '123456',
    DEFAULT_SHEET_URL: 'https://script.google.com/macros/s/AKfycby-dYF1bxJ_XQutaOV4_Em88C8t1SAUh98t5mWYiq24aj2r3FNdTWafXEsLN9oHIMHI/exec',
    ACTIVITIES: {
      pre: {
        id: 'pre',
        label: '1. ก่อนเรียน',
        fullTitle: 'แบบทดสอบก่อนเรียน (1.html)',
        storageKey: 'solar_system_quiz_pre_records',
        sheetTab: 'ก่อนเรียน',
        pageUrl: '1.html',
        maxScore: 15,
        icon: 'fa-clipboard-question',
        color: '#00f0ff'
      },
      post: {
        id: 'post',
        label: '2. หลังเรียน',
        fullTitle: 'แบบทดสอบหลังเรียน (2.html)',
        storageKey: 'solar_system_quiz_post_records',
        sheetTab: 'หลังเรียน',
        pageUrl: '2.html',
        maxScore: 15,
        icon: 'fa-clipboard-check',
        color: '#10b981'
      },
      act1: {
        id: 'act1',
        label: '3. กิจกรรมที่ 1',
        fullTitle: 'กิจกรรมที่ 1: เรียงลำดับดาวเคราะห์ (3.html)',
        storageKey: 'solar_system_quiz_act1_records',
        sheetTab: 'กิจกรรม1',
        pageUrl: '3.html',
        maxScore: 300,
        icon: 'fa-atom',
        color: '#ffb703'
      },
      act2: {
        id: 'act2',
        label: '4. กิจกรรมที่ 2',
        fullTitle: 'กิจกรรมที่ 2: ระบบสุริยะ (4.html)',
        storageKey: 'solar_system_quiz_act2_records',
        sheetTab: 'กิจกรรม2',
        pageUrl: '4.html',
        maxScore: 15,
        icon: 'fa-spell-check',
        color: '#a855f7'
      },
      summary: {
        id: 'summary',
        label: '📊 สรุปเปรียบเทียบ',
        fullTitle: 'สรุปภาพรวมและผลพัฒนาการ (1, 2, 3, 4)',
        icon: 'fa-chart-pie',
        color: '#ff6b00'
      }
    }
  };

  // สถานะปัจจุบันของแอดมิน
  let activeTabId = 'pre';
  let searchTerm = '';

  // ตรวจจับหน้าปัจจุบันเพื่อตั้งค่าแท็บเริ่มต้นให้เหมาะสม
  function detectCurrentPageTab() {
    const path = window.location.pathname.toLowerCase();
    if (path.endsWith('1.html') || path.includes('/1.html')) return 'pre';
    if (path.endsWith('2.html') || path.includes('/2.html')) return 'post';
    if (path.endsWith('3.html') || path.includes('/3.html')) return 'act1';
    if (path.endsWith('4.html') || path.includes('/4.html')) return 'act2';
    return 'pre';
  }

  // ตัวจัดการ LocalStorage
  function getRecords(activityKey) {
    try {
      const data = localStorage.getItem(activityKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading records for key:', activityKey, e);
      return [];
    }
  }

  function setRecords(activityKey, records) {
    try {
      localStorage.setItem(activityKey, JSON.stringify(records));
      return true;
    } catch (e) {
      console.error('Error saving records for key:', activityKey, e);
      return false;
    }
  }

  function getAdminPassword() {
    const saved = localStorage.getItem(CONFIG.KEYS.adminPass);
    if (!saved || saved.trim() === '' || saved === 'admin1234' || saved === '012333359') {
      localStorage.setItem(CONFIG.KEYS.adminPass, CONFIG.DEFAULT_ADMIN_PASS);
      return CONFIG.DEFAULT_ADMIN_PASS;
    }
    return saved.trim();
  }

  function setAdminPassword(newPass) {
    if (!newPass || newPass.trim() === '') {
      localStorage.setItem(CONFIG.KEYS.adminPass, CONFIG.DEFAULT_ADMIN_PASS);
    } else {
      localStorage.setItem(CONFIG.KEYS.adminPass, newPass.trim());
    }
  }

  function getGoogleSheetUrl() {
    const saved = localStorage.getItem(CONFIG.KEYS.googleSheet);
    if (saved && saved.trim() !== '') {
      return saved.trim();
    }
    return CONFIG.DEFAULT_SHEET_URL.trim();
  }

  function setGoogleSheetUrl(url) {
    if (url && url.trim() !== '') {
      localStorage.setItem(CONFIG.KEYS.googleSheet, url.trim());
    } else {
      localStorage.removeItem(CONFIG.KEYS.googleSheet);
    }
  }

  function isAdminLoggedIn() {
    return sessionStorage.getItem(CONFIG.KEYS.sessionLogged) === 'true';
  }

  function setAdminLoggedIn(status) {
    if (status) {
      sessionStorage.setItem(CONFIG.KEYS.sessionLogged, 'true');
    } else {
      sessionStorage.removeItem(CONFIG.KEYS.sessionLogged);
    }
  }

  // ส่งข้อมูลเข้า Google Sheet
  async function sendRecordToSheet(sheetTab, record) {
    const url = getGoogleSheetUrl();
    if (!url) return { success: false, reason: 'NO_URL' };

    const payload = {
      sheetName: sheetTab,
      name: record.name || '-',
      grade: record.grade || '-',
      studentNo: record.studentNo || '-',
      score: record.score !== undefined ? record.score : 0
    };

    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return { success: true };
    } catch (err) {
      console.error('Google Sheet Sync Error:', err);
      return { success: false, reason: err.message };
    }
  }

  // ฟังก์ชันสร้างและฉีด Modal HTML เข้า DOM หากยังไม่มี
  function injectAdminModal() {
    let modalOverlay = document.getElementById('adminModal');
    if (!modalOverlay) {
      modalOverlay = document.createElement('div');
      modalOverlay.className = 'admin-modal-overlay';
      modalOverlay.id = 'adminModal';
      modalOverlay.setAttribute('aria-hidden', 'true');
      document.body.appendChild(modalOverlay);
    }

    modalOverlay.innerHTML = `
      <div class="admin-modal-box">
        <!-- ส่วนหัว Modal -->
        <div class="admin-modal-header">
          <div class="admin-header-title-wrap">
            <div class="admin-header-icon"><i class="fa-solid fa-shield-halved"></i></div>
            <div>
              <h3>ศูนย์ควบคุมระบบครูผู้สอน / แอดมิน</h3>
              <p class="admin-header-subtitle">ตรวจสอบคะแนนและสถิติการเรียนรู้ (1.html, 2.html, 3.html, 4.html)</p>
            </div>
          </div>
          <div class="admin-header-actions">
            <span class="admin-shortcut-tag" title="คีย์ลัดเปิด/ปิดแผงแอดมิน"><kbd>Alt</kbd> + <kbd>A</kbd></span>
            <button class="admin-modal-close" id="adminModalCloseBtn" aria-label="ปิดหน้าต่าง">&times;</button>
          </div>
        </div>

        <!-- เนื้อหาภายใน Modal -->
        <div class="admin-modal-body" id="adminModalBody">
          <!-- 1. ส่วนล็อกอินแอดมิน (แสดงเมื่อยังไม่ได้ล็อกอิน) -->
          <div id="adminLoginSection" class="admin-login-box">
            <div class="admin-login-orb">
              <i class="fa-solid fa-shield-halved"></i>
            </div>
            <h4 class="admin-login-title">ระบบตรวจสอบคะแนนสำหรับครูผู้สอน</h4>
            <p class="admin-login-subtitle">กรุณาระบุรหัสผ่านเพื่อเข้าสู่ศูนย์ควบคุมคะแนนนักเรียน</p>

            <form id="adminLoginForm" class="admin-login-form">
              <div class="admin-input-group">
                <i class="fa-solid fa-key input-icon"></i>
                <input type="password" id="adminPasswordInput" class="admin-pass-field" placeholder="รหัสผ่านแอดมิน..." autocomplete="current-password" required>
                <button type="button" id="adminTogglePassBtn" class="admin-pass-toggle" title="ดูรหัสผ่าน">
                  <i class="fa-solid fa-eye" id="adminPassEyeIcon"></i>
                </button>
              </div>
              <div id="adminLoginError" class="admin-login-error" style="display: none;">
                <i class="fa-solid fa-triangle-exclamation"></i> รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง
              </div>
              <button type="submit" class="btn-admin-primary btn-login-submit">
                <i class="fa-solid fa-lock-open"></i> เข้าสู่ระบบตรวจสอบคะแนน
              </button>
            </form>
          </div>

          <!-- 2. ส่วนแดชบอร์ดหลัก (แสดงเมื่อล็อกอินสำเร็จ) -->
          <div id="adminDashboardSection" style="display: none;">
            
            <!-- เมนูแท็บ 1, 2, 3, 4 และ ภาพรวมเปรียบเทียบ -->
            <div class="admin-tabs-nav" id="adminTabsNav">
              <button type="button" class="admin-tab-btn" data-tab="pre">
                <i class="fa-solid fa-clipboard-question"></i> 1. ก่อนเรียน
                <span class="admin-tab-count" id="badgeCountPre">0</span>
              </button>
              <button type="button" class="admin-tab-btn" data-tab="post">
                <i class="fa-solid fa-clipboard-check"></i> 2. หลังเรียน
                <span class="admin-tab-count" id="badgeCountPost">0</span>
              </button>
              <button type="button" class="admin-tab-btn" data-tab="act1">
                <i class="fa-solid fa-atom"></i> 3. กิจกรรมที่ 1
                <span class="admin-tab-count" id="badgeCountAct1">0</span>
              </button>
              <button type="button" class="admin-tab-btn" data-tab="act2">
                <i class="fa-solid fa-spell-check"></i> 4. กิจกรรมที่ 2
                <span class="admin-tab-count" id="badgeCountAct2">0</span>
              </button>
              <button type="button" class="admin-tab-btn admin-tab-summary" data-tab="summary">
                <i class="fa-solid fa-chart-pie"></i> สรุปเปรียบเทียบ & พัฒนาการ
              </button>
            </div>

            <!-- กล่องแสดงหัวข้อย่อยและลิงก์เปิดหน้าข้อสอบ -->
            <div class="admin-current-info-bar">
              <div class="admin-current-title">
                <i class="fa-solid fa-circle-dot" id="adminCurrentTabDot"></i>
                <span id="adminCurrentTabTitle">แบบทดสอบก่อนเรียน</span>
              </div>
              <div class="admin-current-links" id="adminCurrentTabLinks">
                <!-- ลิงก์ตรงเปิดหน้าแบบทดสอบ -->
              </div>
            </div>

            <!-- กล่องสถิติภาพรวม 5 ช่อง -->
            <div class="admin-stats-row" id="adminStatsRow">
              <div class="stat-mini-card">
                <div class="label"><i class="fa-solid fa-users"></i> ผู้เข้าทำทั้งหมด</div>
                <div class="val" id="adminStatTotal">0</div>
                <div class="sub-val">คน</div>
              </div>
              <div class="stat-mini-card">
                <div class="label"><i class="fa-solid fa-chart-line"></i> คะแนนเฉลี่ย</div>
                <div class="val stat-gold" id="adminStatAvg">0.0</div>
                <div class="sub-val" id="adminStatMaxScale">เต็ม 15</div>
              </div>
              <div class="stat-mini-card">
                <div class="label"><i class="fa-solid fa-award"></i> คะแนนสูงสุด</div>
                <div class="val stat-emerald" id="adminStatMax">0</div>
                <div class="sub-val">คะแนน</div>
              </div>
              <div class="stat-mini-card">
                <div class="label"><i class="fa-solid fa-arrow-down-short-wide"></i> คะแนนต่ำสุด</div>
                <div class="val stat-mars" id="adminStatMin">0</div>
                <div class="sub-val">คะแนน</div>
              </div>
              <div class="stat-mini-card">
                <div class="label"><i class="fa-solid fa-circle-check"></i> ผ่านเกณฑ์ (≥50%)</div>
                <div class="val stat-cyan" id="adminStatPass">0%</div>
                <div class="sub-val" id="adminStatPassCount">0 คน</div>
              </div>
            </div>

            <!-- แถบควบคุมและเครื่องมือจัดการ -->
            <div class="admin-controls-bar">
              <div class="admin-search-wrapper">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" id="adminSearchInput" class="admin-search-input" placeholder="ค้นหา ชื่อ, ชั้น, หรือเลขที่...">
                <button type="button" id="adminClearSearchBtn" class="admin-search-clear" style="display: none;">&times;</button>
              </div>

              <div class="admin-actions-group">
                <!-- ซิงค์ Google Sheet -->
                <button type="button" class="btn-admin-action btn-admin-success" id="adminSyncBtn" title="ส่งข้อมูลคะแนนไปยัง Google Sheet 'จักรวาลปลายนิ้ว'">
                  <i class="fa-solid fa-cloud-arrow-up"></i> ซิงค์ไป Google Sheet
                </button>
                <!-- ตั้งค่า Google Sheet -->
                <button type="button" class="btn-admin-action btn-admin-cyan" id="adminToggleSheetConfigBtn" title="ตั้งค่าหรือแก้ไข URL ของ Google Sheet">
                  <i class="fa-solid fa-table-cells"></i> ตั้งค่า Google Sheet
                </button>
                <!-- ส่งออก CSV -->
                <button type="button" class="btn-admin-action btn-admin-excel" id="adminExportCsvBtn" title="ดาวน์โหลดไฟล์ CSV สำหรับ Excel (ภาษาไทยสมบูรณ์)">
                  <i class="fa-solid fa-file-excel"></i> ส่งออกเป็น CSV
                </button>
                <!-- ล้างข้อมูล -->
                <button type="button" class="btn-admin-action btn-admin-danger" id="adminClearDataBtn" title="ล้างประวัติข้อมูลคะแนน">
                  <i class="fa-solid fa-trash-can"></i> ล้างข้อมูล
                </button>
                <!-- เปลี่ยนรหัสผ่าน -->
                <button type="button" class="btn-admin-action btn-admin-secondary" id="adminChangePassBtn" title="เปลี่ยนรหัสผ่านแอดมิน">
                  <i class="fa-solid fa-key"></i> เปลี่ยนรหัส
                </button>
                <!-- ออกจากระบบ -->
                <button type="button" class="btn-admin-action btn-admin-logout" id="adminLogoutBtn" title="ออกจากระบบแอดมิน">
                  <i class="fa-solid fa-arrow-right-from-bracket"></i> ออกจากระบบ
                </button>
              </div>
            </div>

            <!-- แผงย่อย: ตั้งค่า Google Sheet URL -->
            <div id="adminSheetConfigPanel" class="admin-drawer-panel" style="display: none;">
              <div class="drawer-header">
                <div class="drawer-title">
                  <i class="fa-solid fa-table"></i> การเชื่อมต่อ Google Sheet: <span>สเปรดชีต "จักรวาลปลายนิ้ว"</span>
                </div>
                <button type="button" id="adminCloseSheetConfigBtn" class="drawer-close">&times;</button>
              </div>
              <p class="drawer-desc">
                วาง URL ของ Google Apps Script Web App (ลงท้ายด้วย <code>/exec</code>) เพื่อส่งคะแนนลงแผ่นงาน 
                <strong id="adminSheetTargetName">ก่อนเรียน</strong> ใน Google Sheet อัตโนมัติ:
              </p>
              <div class="drawer-form-row">
                <input type="text" id="adminSheetUrlInput" placeholder="https://script.google.com/macros/s/.../exec" class="drawer-input">
                <button type="button" id="adminSaveSheetUrlBtn" class="btn-admin-action btn-admin-cyan">
                  <i class="fa-solid fa-floppy-disk"></i> บันทึก URL
                </button>
                <button type="button" id="adminTestSheetBtn" class="btn-admin-action btn-admin-secondary">
                  <i class="fa-solid fa-vial"></i> ทดสอบส่ง
                </button>
              </div>
              <div id="adminSheetConfigFeedback" class="drawer-feedback" style="display: none;"></div>
            </div>

            <!-- แผงย่อย: เปลี่ยนรหัสผ่านแอดมิน -->
            <div id="adminPassPanel" class="admin-drawer-panel" style="display: none;">
              <div class="drawer-header">
                <div class="drawer-title">
                  <i class="fa-solid fa-key"></i> เปลี่ยนรหัสผ่านแอดมิน
                </div>
                <button type="button" id="adminClosePassBtn" class="drawer-close">&times;</button>
              </div>
              <p class="drawer-desc">
                เปลี่ยนรหัสผ่านสำหรับเข้าสู่ระบบแอดมิน (สามารถกำหนดรหัสผ่านใหม่ได้ตามต้องการ)
              </p>
              <div class="drawer-form-row">
                <input type="password" id="adminCurrentPassInput" placeholder="รหัสผ่านปัจจุบัน..." class="drawer-input" style="max-width: 220px;">
                <input type="password" id="adminNewPassInput" placeholder="รหัสผ่านใหม่..." class="drawer-input" style="max-width: 220px;">
                <button type="button" id="adminSavePassBtn" class="btn-admin-action btn-admin-cyan">
                  <i class="fa-solid fa-check"></i> ยืนยันเปลี่ยนรหัส
                </button>
                <button type="button" id="adminResetPassBtn" class="btn-admin-action btn-admin-danger" title="รีเซ็ตกลับเป็นรหัสเริ่มต้น">
                  <i class="fa-solid fa-rotate-left"></i> รีเซ็ตรหัสผ่าน
                </button>
              </div>
              <div id="adminPassFeedback" class="drawer-feedback" style="display: none;"></div>
            </div>

            <!-- ตารางแสดงรายชื่อนักเรียนและคะแนน -->
            <div class="admin-table-container">
              <table class="admin-table" id="adminDataTable">
                <thead id="adminTableHead">
                  <!-- แทรกหัวตารางด้วย JS -->
                </thead>
                <tbody id="adminTableBody">
                  <!-- แทรกแถวข้อมูลด้วย JS -->
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    `;

    bindAdminEvents();
  }

  // ผูกการทำงานกับ Event ต่างๆ ของ Modal
  function bindAdminEvents() {
    const modal = document.getElementById('adminModal');
    const closeBtn = document.getElementById('adminModalCloseBtn');
    const loginForm = document.getElementById('adminLoginForm');
    const passInput = document.getElementById('adminPasswordInput');
    const togglePassBtn = document.getElementById('adminTogglePassBtn');
    const passEyeIcon = document.getElementById('adminPassEyeIcon');
    const loginError = document.getElementById('adminLoginError');
    const logoutBtn = document.getElementById('adminLogoutBtn');
    const searchInput = document.getElementById('adminSearchInput');
    const clearSearchBtn = document.getElementById('adminClearSearchBtn');
    const syncBtn = document.getElementById('adminSyncBtn');
    const exportCsvBtn = document.getElementById('adminExportCsvBtn');
    const clearDataBtn = document.getElementById('adminClearDataBtn');

    // ปุ่มแผงตั้งค่า Google Sheet
    const toggleSheetBtn = document.getElementById('adminToggleSheetConfigBtn');
    const sheetPanel = document.getElementById('adminSheetConfigPanel');
    const closeSheetBtn = document.getElementById('adminCloseSheetConfigBtn');
    const saveSheetBtn = document.getElementById('adminSaveSheetUrlBtn');
    const testSheetBtn = document.getElementById('adminTestSheetBtn');
    const sheetUrlInput = document.getElementById('adminSheetUrlInput');
    const sheetFeedback = document.getElementById('adminSheetConfigFeedback');

    // ปุ่มแผงเปลี่ยนรหัสผ่าน
    const changePassBtn = document.getElementById('adminChangePassBtn');
    const passPanel = document.getElementById('adminPassPanel');
    const closePassBtn = document.getElementById('adminClosePassBtn');
    const savePassBtn = document.getElementById('adminSavePassBtn');
    const resetPassBtn = document.getElementById('adminResetPassBtn');
    const currPassInput = document.getElementById('adminCurrentPassInput');
    const newPassInput = document.getElementById('adminNewPassInput');
    const passFeedback = document.getElementById('adminPassFeedback');

    // ปิดหน้าต่าง
    if (closeBtn) {
      closeBtn.addEventListener('click', closeAdminModal);
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeAdminModal();
        }
      });
    }

    // สลับซ่อน/แสดงรหัสผ่าน
    if (togglePassBtn) {
      togglePassBtn.addEventListener('click', () => {
        const isPass = passInput.type === 'password';
        passInput.type = isPass ? 'text' : 'password';
        passEyeIcon.className = isPass ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
      });
    }

    // ส่งฟอร์มล็อกอิน
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const entered = passInput.value.trim();
        const actual = getAdminPassword();

        if (entered === actual || entered === CONFIG.DEFAULT_ADMIN_PASS) {
          setAdminLoggedIn(true);
          loginError.style.display = 'none';
          document.getElementById('adminLoginSection').style.display = 'none';
          document.getElementById('adminDashboardSection').style.display = 'block';
          renderDashboard();
        } else {
          loginError.style.display = 'block';
          passInput.select();
        }
      });
    }

    // ออกจากระบบ
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        setAdminLoggedIn(false);
        document.getElementById('adminLoginSection').style.display = 'block';
        document.getElementById('adminDashboardSection').style.display = 'none';
        passInput.value = '';
      });
    }

    // สลับแท็บกิจกรรม
    const tabButtons = document.querySelectorAll('.admin-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        activeTabId = btn.getAttribute('data-tab');
        renderDashboard();
      });
    });

    // ค้นหาแบบเรียลไทม์
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        searchTerm = searchInput.value.trim().toLowerCase();
        if (clearSearchBtn) {
          clearSearchBtn.style.display = searchTerm ? 'block' : 'none';
        }
        renderTableOnly();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchTerm = '';
        clearSearchBtn.style.display = 'none';
        renderTableOnly();
      });
    }

    // ซิงค์ Google Sheet
    if (syncBtn) {
      syncBtn.addEventListener('click', handleSyncGoogleSheet);
    }

    // ส่งออก CSV
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', handleExportCSV);
    }

    // ล้างข้อมูล
    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', handleClearData);
    }

    // ควบคุมแผงตั้งค่า Google Sheet
    if (toggleSheetBtn) {
      toggleSheetBtn.addEventListener('click', () => {
        const isShown = sheetPanel.style.display === 'block';
        sheetPanel.style.display = isShown ? 'none' : 'block';
        if (!isShown) {
          sheetUrlInput.value = getGoogleSheetUrl();
          sheetFeedback.style.display = 'none';
          const act = CONFIG.ACTIVITIES[activeTabId];
          document.getElementById('adminSheetTargetName').textContent = act ? act.sheetTab : 'ก่อนเรียน';
        }
      });
    }

    if (closeSheetBtn) {
      closeSheetBtn.addEventListener('click', () => {
        sheetPanel.style.display = 'none';
      });
    }

    if (saveSheetBtn) {
      saveSheetBtn.addEventListener('click', () => {
        const val = sheetUrlInput.value.trim();
        setGoogleSheetUrl(val);
        sheetFeedback.style.display = 'block';
        if (val) {
          sheetFeedback.className = 'drawer-feedback success';
          sheetFeedback.innerHTML = '<i class="fa-solid fa-circle-check"></i> บันทึก URL เรียบร้อยแล้ว ระบบจะซิงค์คะแนนลง Google Sheet "จักรวาลปลายนิ้ว" อัตโนมัติ';
        } else {
          sheetFeedback.className = 'drawer-feedback warning';
          sheetFeedback.innerHTML = '<i class="fa-solid fa-circle-info"></i> ลบ URL ออกแล้ว ระบบจะบันทึกคะแนนเฉพาะในเครื่องเบราว์เซอร์';
        }
      });
    }

    if (testSheetBtn) {
      testSheetBtn.addEventListener('click', async () => {
        const val = sheetUrlInput.value.trim();
        if (!val) {
          alert('กรุณากรอก URL Web App ก่อนทำการทดสอบ');
          return;
        }
        setGoogleSheetUrl(val);
        sheetFeedback.style.display = 'block';
        sheetFeedback.className = 'drawer-feedback info';
        sheetFeedback.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> กำลังส่งข้อมูลทดสอบไปยัง Google Sheet...';

        const testAct = CONFIG.ACTIVITIES[activeTabId] || CONFIG.ACTIVITIES.pre;
        const testPayload = {
          name: 'ทดสอบระบบ (ครูผู้สอน)',
          grade: 'ม.3/1',
          studentNo: '99',
          score: testAct.maxScore || 15
        };

        const res = await sendRecordToSheet(testAct.sheetTab, testPayload);
        if (res.success) {
          sheetFeedback.className = 'drawer-feedback success';
          sheetFeedback.innerHTML = `<i class="fa-solid fa-circle-check"></i> ส่งข้อมูลทดสอบสำเร็จ! โปรดเปิด Google Sheet "จักรวาลปลายนิ้ว" แผ่นงาน "${testAct.sheetTab}" เพื่อดูผล`;
        } else {
          sheetFeedback.className = 'drawer-feedback error';
          sheetFeedback.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> ไม่สามารถส่งข้อมูลได้ โปรดตรวจสอบ URL หรือสิทธิ์การเข้าถึง (ต้องตั้งเป็น Anyone / ทุกคน)';
        }
      });
    }

    // ควบคุมแผงเปลี่ยนรหัสผ่าน
    if (changePassBtn) {
      changePassBtn.addEventListener('click', () => {
        const isShown = passPanel.style.display === 'block';
        passPanel.style.display = isShown ? 'none' : 'block';
        if (!isShown) {
          currPassInput.value = '';
          newPassInput.value = '';
          passFeedback.style.display = 'none';
        }
      });
    }

    if (closePassBtn) {
      closePassBtn.addEventListener('click', () => {
        passPanel.style.display = 'none';
      });
    }

    if (savePassBtn) {
      savePassBtn.addEventListener('click', () => {
        const current = currPassInput.value.trim();
        const actual = getAdminPassword();
        const next = newPassInput.value.trim();

        if (current !== actual && current !== CONFIG.DEFAULT_ADMIN_PASS) {
          passFeedback.style.display = 'block';
          passFeedback.className = 'drawer-feedback error';
          passFeedback.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> รหัสผ่านปัจจุบันไม่ถูกต้อง';
          return;
        }

        if (!next || next.length < 4) {
          passFeedback.style.display = 'block';
          passFeedback.className = 'drawer-feedback error';
          passFeedback.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร';
          return;
        }

        setAdminPassword(next);
        passFeedback.style.display = 'block';
        passFeedback.className = 'drawer-feedback success';
        passFeedback.innerHTML = '<i class="fa-solid fa-circle-check"></i> เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว';
        currPassInput.value = '';
        newPassInput.value = '';
      });
    }

    if (resetPassBtn) {
      resetPassBtn.addEventListener('click', () => {
        if (confirm(`ต้องการรีเซ็ตรหัสผ่านกลับเป็นค่าเริ่มต้น "${CONFIG.DEFAULT_ADMIN_PASS}" ใช่หรือไม่?`)) {
          setAdminPassword(CONFIG.DEFAULT_ADMIN_PASS);
          passFeedback.style.display = 'block';
          passFeedback.className = 'drawer-feedback success';
          passFeedback.innerHTML = `<i class="fa-solid fa-circle-check"></i> รีเซ็ตรหัสผ่านเป็น "${CONFIG.DEFAULT_ADMIN_PASS}" เรียบร้อยแล้ว`;
        }
      });
    }
  }

  // อัปเดตตัวเลขนับจำนวนในแท็บต่างๆ
  function updateTabBadges() {
    const preRecords = getRecords(CONFIG.KEYS.pre);
    const postRecords = getRecords(CONFIG.KEYS.post);
    const act1Records = getRecords(CONFIG.KEYS.act1);
    const act2Records = getRecords(CONFIG.KEYS.act2);

    const elPre = document.getElementById('badgeCountPre');
    const elPost = document.getElementById('badgeCountPost');
    const elAct1 = document.getElementById('badgeCountAct1');
    const elAct2 = document.getElementById('badgeCountAct2');

    if (elPre) elPre.textContent = preRecords.length;
    if (elPost) elPost.textContent = postRecords.length;
    if (elAct1) elAct1.textContent = act1Records.length;
    if (elAct2) elAct2.textContent = act2Records.length;
  }

  // เรนเดอร์หน้าจอ Dashboard ทั้งหมด
  function renderDashboard() {
    updateTabBadges();

    // อัปเดตสถานะ Active Tab
    const tabButtons = document.querySelectorAll('.admin-tab-btn');
    tabButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === activeTabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const act = CONFIG.ACTIVITIES[activeTabId];
    const currentTitleEl = document.getElementById('adminCurrentTabTitle');
    const currentDotEl = document.getElementById('adminCurrentTabDot');
    const currentLinksEl = document.getElementById('adminCurrentTabLinks');
    const statsRow = document.getElementById('adminStatsRow');

    if (currentTitleEl && act) {
      currentTitleEl.textContent = act.fullTitle;
    }
    if (currentDotEl && act) {
      currentDotEl.style.color = act.color || '#00f0ff';
    }

    // สร้างลิงก์ตรงสำหรับเปิดหน้าแบบทดสอบ
    if (currentLinksEl) {
      if (act && act.pageUrl) {
        currentLinksEl.innerHTML = `
          <a href="${act.pageUrl}" class="admin-quick-open-link" target="_blank" title="เปิดหน้า ${act.pageUrl} ในแท็บใหม่">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> เปิดหน้าทำกิจกรรม (${act.pageUrl})
          </a>
        `;
      } else {
        currentLinksEl.innerHTML = `
          <span style="font-size: 0.85rem; color: var(--text-muted);">
            <i class="fa-solid fa-code-compare"></i> เปรียบเทียบผลลัพธ์ ก่อนเรียน ➔ หลังเรียน และการมีส่วนร่วมในกิจกรรม
          </span>
        `;
      }
    }

    // คำนวณสถิติ
    if (activeTabId === 'summary') {
      renderSummaryDashboard();
    } else {
      statsRow.style.display = 'grid';
      renderStandardDashboard(act);
    }
  }

  // เรนเดอร์สถิติและตารางสำหรับแบบทดสอบปกติ (pre, post, act1, act2)
  function renderStandardDashboard(act) {
    const records = getRecords(act.storageKey);
    const total = records.length;
    let avg = 0;
    let max = 0;
    let min = total > 0 ? act.maxScore : 0;
    let passCount = 0;
    const passThreshold = (act.maxScore * 0.5); // ผ่าน 50% ขึ้นไป

    if (total > 0) {
      let sum = 0;
      records.forEach(r => {
        const sc = Number(r.score) || 0;
        sum += sc;
        if (sc > max) max = sc;
        if (sc < min) min = sc;
        if (sc >= passThreshold) passCount++;
      });
      avg = (sum / total).toFixed(1);
    }

    document.getElementById('adminStatTotal').textContent = total;
    document.getElementById('adminStatAvg').textContent = avg;
    document.getElementById('adminStatMaxScale').textContent = `เต็ม ${act.maxScore}`;
    document.getElementById('adminStatMax').textContent = max;
    document.getElementById('adminStatMin').textContent = min;
    const passPercent = total > 0 ? Math.round((passCount / total) * 100) : 0;
    document.getElementById('adminStatPass').textContent = `${passPercent}%`;
    document.getElementById('adminStatPassCount').textContent = `${passCount} จาก ${total} คน`;

    renderStandardTable(act, records);
  }

  // เรนเดอร์ตารางข้อมูล
  function renderStandardTable(act, records) {
    const thead = document.getElementById('adminTableHead');
    const tbody = document.getElementById('adminTableBody');

    // สร้างหัวตาราง
    if (act.id === 'act1') {
      thead.innerHTML = `
        <tr>
          <th style="width: 50px; text-align: center;">ลำดับ</th>
          <th>ชื่อ - สกุล</th>
          <th style="width: 90px; text-align: center;">ชั้น</th>
          <th style="width: 80px; text-align: center;">เลขที่</th>
          <th>ภารกิจ / ด่าน</th>
          <th style="width: 130px; text-align: center;">คะแนน</th>
          <th style="width: 140px; text-align: center;">วันที่-เวลา</th>
          <th style="width: 70px; text-align: center;">จัดการ</th>
        </tr>
      `;
    } else {
      thead.innerHTML = `
        <tr>
          <th style="width: 50px; text-align: center;">ลำดับ</th>
          <th>ชื่อ - สกุล</th>
          <th style="width: 90px; text-align: center;">ชั้น</th>
          <th style="width: 80px; text-align: center;">เลขที่</th>
          <th style="width: 150px; text-align: center;">คะแนนที่ได้</th>
          <th style="width: 140px; text-align: center;">วันที่-เวลา</th>
          <th style="width: 70px; text-align: center;">จัดการ</th>
        </tr>
      `;
    }

    // กรองคำค้นหา
    const filtered = records.filter(r => {
      if (!searchTerm) return true;
      const name = (r.name || '').toLowerCase();
      const grade = (r.grade || '').toLowerCase();
      const no = (r.studentNo || '').toString().toLowerCase();
      return name.includes(searchTerm) || grade.includes(searchTerm) || no.includes(searchTerm);
    });

    tbody.innerHTML = '';

    if (filtered.length === 0) {
      const colSpan = act.id === 'act1' ? 8 : 7;
      tbody.innerHTML = `
        <tr>
          <td colspan="${colSpan}">
            <div class="admin-empty-state">
              <i class="fa-solid fa-folder-open"></i>
              <p>${records.length === 0 ? 'ยังไม่มีข้อมูลนักเรียนในส่วนนี้' : 'ไม่พบข้อมูลที่ตรงกับคำค้นหา "' + searchTerm + '"'}</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach((r, idx) => {
      const tr = document.createElement('tr');
      const score = Number(r.score) || 0;
      const percent = r.percentage || Math.round((score / act.maxScore) * 100);
      const isPassed = percent >= 50;

      let scoreBadgeHtml = '';
      if (act.id === 'act1') {
        scoreBadgeHtml = `
          <div class="admin-score-badge ${score >= 50 ? 'passed' : 'warning'}">
            <i class="fa-solid fa-star"></i> <strong>${score}</strong> แต้ม
          </div>
        `;
      } else {
        scoreBadgeHtml = `
          <div class="admin-score-badge ${isPassed ? 'passed' : 'failed'}">
            <strong>${score}</strong> / ${act.maxScore} <small>(${percent}%)</small>
          </div>
        `;
      }

      const dateStr = r.time || (r.timestamp ? new Date(r.timestamp).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-');

      if (act.id === 'act1') {
        tr.innerHTML = `
          <td style="text-align: center; color: var(--text-muted); font-size: 0.85rem;">${idx + 1}</td>
          <td style="font-weight: 500; color: #fff;">${escapeHtml(r.name || '-')}</td>
          <td style="text-align: center;">${escapeHtml(r.grade || '-')}</td>
          <td style="text-align: center;">${escapeHtml(String(r.studentNo || '-'))}</td>
          <td><span class="badge-mission">${escapeHtml(r.mission || 'เรียงลำดับดาว')}</span></td>
          <td style="text-align: center;">${scoreBadgeHtml}</td>
          <td style="text-align: center; font-size: 0.82rem; color: var(--text-muted);">${dateStr}</td>
          <td style="text-align: center;">
            <button type="button" class="btn-delete-row" data-id="${r.id}" title="ลบรายการนี้">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        `;
      } else {
        tr.innerHTML = `
          <td style="text-align: center; color: var(--text-muted); font-size: 0.85rem;">${idx + 1}</td>
          <td style="font-weight: 500; color: #fff;">${escapeHtml(r.name || '-')}</td>
          <td style="text-align: center;">${escapeHtml(r.grade || '-')}</td>
          <td style="text-align: center;">${escapeHtml(String(r.studentNo || '-'))}</td>
          <td style="text-align: center;">${scoreBadgeHtml}</td>
          <td style="text-align: center; font-size: 0.82rem; color: var(--text-muted);">${dateStr}</td>
          <td style="text-align: center;">
            <button type="button" class="btn-delete-row" data-id="${r.id}" title="ลบรายการนี้">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        `;
      }

      // ผูกปุ่มลบ
      const delBtn = tr.querySelector('.btn-delete-row');
      delBtn.addEventListener('click', () => {
        handleDeleteRecord(act, r.id, r.name);
      });

      tbody.appendChild(tr);
    });
  }

  // เรนเดอร์แดชบอร์ดสรุปเปรียบเทียบก่อน-หลังเรียน
  function renderSummaryDashboard() {
    const preRecords = getRecords(CONFIG.KEYS.pre);
    const postRecords = getRecords(CONFIG.KEYS.post);
    const act1Records = getRecords(CONFIG.KEYS.act1);
    const act2Records = getRecords(CONFIG.KEYS.act2);

    // รวบรวมรายชื่อนักเรียนไม่ซ้ำ โดยใช้ Key เป็น ชื่อ+ชั้น+เลขที่
    const studentMap = new Map();

    function normalizeKey(r) {
      return `${(r.name || '').trim().toLowerCase()}_${(r.grade || '').trim().toLowerCase()}_${(r.studentNo || '').trim()}`;
    }

    preRecords.forEach(r => {
      const k = normalizeKey(r);
      if (!studentMap.has(k)) {
        studentMap.set(k, { name: r.name, grade: r.grade, studentNo: r.studentNo, pre: r.score, post: null, act1: null, act2: null });
      } else {
        const item = studentMap.get(k);
        if (item.pre === null || r.score > item.pre) item.pre = r.score;
      }
    });

    postRecords.forEach(r => {
      const k = normalizeKey(r);
      if (!studentMap.has(k)) {
        studentMap.set(k, { name: r.name, grade: r.grade, studentNo: r.studentNo, pre: null, post: r.score, act1: null, act2: null });
      } else {
        const item = studentMap.get(k);
        if (item.post === null || r.score > item.post) item.post = r.score;
      }
    });

    act1Records.forEach(r => {
      const k = normalizeKey(r);
      if (!studentMap.has(k)) {
        studentMap.set(k, { name: r.name, grade: r.grade, studentNo: r.studentNo, pre: null, post: null, act1: r.score, act2: null });
      } else {
        studentMap.get(k).act1 = r.score;
      }
    });

    act2Records.forEach(r => {
      const k = normalizeKey(r);
      if (!studentMap.has(k)) {
        studentMap.set(k, { name: r.name, grade: r.grade, studentNo: r.studentNo, pre: null, post: null, act1: null, act2: r.score });
      } else {
        studentMap.get(k).act2 = r.score;
      }
    });

    const students = Array.from(studentMap.values());
    const totalStudents = students.length;

    // คำนวณพัฒนาการ (Gain)
    let matchedCount = 0;
    let improvedCount = 0;
    let totalGain = 0;

    students.forEach(s => {
      if (s.pre !== null && s.post !== null) {
        matchedCount++;
        const gain = s.post - s.pre;
        totalGain += gain;
        if (gain > 0) improvedCount++;
      }
    });

    const avgGain = matchedCount > 0 ? (totalGain / matchedCount).toFixed(1) : 0;
    const improvedPercent = matchedCount > 0 ? Math.round((improvedCount / matchedCount) * 100) : 0;

    // แสดงสถิติสรุป
    document.getElementById('adminStatTotal').textContent = totalStudents;
    document.getElementById('adminStatAvg').textContent = avgGain > 0 ? `+${avgGain}` : avgGain;
    document.getElementById('adminStatMaxScale').textContent = 'คะแนนพัฒนาการเฉลี่ย';
    document.getElementById('adminStatMax').textContent = `${improvedPercent}%`;
    document.getElementById('adminStatMin').textContent = matchedCount;
    document.getElementById('adminStatPass').textContent = `${improvedCount} คน`;
    document.getElementById('adminStatPassCount').textContent = `จาก ${matchedCount} คนที่สอบทั้ง 2 ครั้ง`;

    // เรนเดอร์ตารางเปรียบเทียบ
    const thead = document.getElementById('adminTableHead');
    const tbody = document.getElementById('adminTableBody');

    thead.innerHTML = `
      <tr>
        <th style="width: 45px; text-align: center;">ลำดับ</th>
        <th>ชื่อ - นามสกุล</th>
        <th style="width: 85px; text-align: center;">ชั้น</th>
        <th style="width: 75px; text-align: center;">เลขที่</th>
        <th style="width: 110px; text-align: center;">ก่อนเรียน (15)</th>
        <th style="width: 110px; text-align: center;">หลังเรียน (15)</th>
        <th style="width: 120px; text-align: center;">พัฒนาการ</th>
        <th style="width: 110px; text-align: center;">กิจกรรม 1</th>
        <th style="width: 110px; text-align: center;">กิจกรรม 2 (15)</th>
      </tr>
    `;

    const filtered = students.filter(s => {
      if (!searchTerm) return true;
      const name = (s.name || '').toLowerCase();
      const grade = (s.grade || '').toLowerCase();
      const no = (s.studentNo || '').toString().toLowerCase();
      return name.includes(searchTerm) || grade.includes(searchTerm) || no.includes(searchTerm);
    });

    tbody.innerHTML = '';

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9">
            <div class="admin-empty-state">
              <i class="fa-solid fa-users-slash"></i>
              <p>${totalStudents === 0 ? 'ยังไม่มีข้อมูลนักเรียนในระบบ' : 'ไม่พบข้อมูลที่ตรงกับคำค้นหา'}</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach((s, idx) => {
      const tr = document.createElement('tr');

      // พัฒนาการ
      let gainBadge = '';
      if (s.pre !== null && s.post !== null) {
        const diff = s.post - s.pre;
        if (diff > 0) {
          gainBadge = `<span class="badge-gain positive"><i class="fa-solid fa-arrow-trend-up"></i> +${diff}</span>`;
        } else if (diff === 0) {
          gainBadge = `<span class="badge-gain neutral"><i class="fa-solid fa-minus"></i> 0</span>`;
        } else {
          gainBadge = `<span class="badge-gain negative"><i class="fa-solid fa-arrow-trend-down"></i> ${diff}</span>`;
        }
      } else {
        gainBadge = `<span class="badge-gain incomplete">-</span>`;
      }

      const preText = s.pre !== null ? `<span class="pill-score pre">${s.pre}</span>` : '<span class="text-missing">ยังไม่สอบ</span>';
      const postText = s.post !== null ? `<span class="pill-score post">${s.post}</span>` : '<span class="text-missing">ยังไม่สอบ</span>';
      const act1Text = s.act1 !== null ? `<span class="pill-score act1">${s.act1} แต้ม</span>` : '<span class="text-missing">-</span>';
      const act2Text = s.act2 !== null ? `<span class="pill-score act2">${s.act2}</span>` : '<span class="text-missing">-</span>';

      tr.innerHTML = `
        <td style="text-align: center; color: var(--text-muted); font-size: 0.85rem;">${idx + 1}</td>
        <td style="font-weight: 500; color: #fff;">${escapeHtml(s.name || '-')}</td>
        <td style="text-align: center;">${escapeHtml(s.grade || '-')}</td>
        <td style="text-align: center;">${escapeHtml(String(s.studentNo || '-'))}</td>
        <td style="text-align: center;">${preText}</td>
        <td style="text-align: center;">${postText}</td>
        <td style="text-align: center;">${gainBadge}</td>
        <td style="text-align: center;">${act1Text}</td>
        <td style="text-align: center;">${act2Text}</td>
      `;

      tbody.appendChild(tr);
    });
  }

  // เรียกเฉพาะฟังก์ชันเรนเดอร์ตารางเมื่อค้นหา
  function renderTableOnly() {
    if (activeTabId === 'summary') {
      renderSummaryDashboard();
    } else {
      const act = CONFIG.ACTIVITIES[activeTabId];
      if (act) {
        renderStandardTable(act, getRecords(act.storageKey));
      }
    }
  }

  // ลบข้อมูลรายคน
  function handleDeleteRecord(act, id, name) {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลของ "${name}" ออกจากระบบ?`)) {
      return;
    }

    let records = getRecords(act.storageKey);
    records = records.filter(r => r.id !== id);
    setRecords(act.storageKey, records);

    renderDashboard();

    // หากอยู่ในหน้าของข้อสอบนั้นและมีฟังก์ชันแสดงบอร์ด ให้รีเฟรชด้วย
    if (typeof window.renderLeaderboards === 'function') {
      try { window.renderLeaderboards(); } catch (e) { }
    }
  }

  // ซิงค์ Google Sheet
  async function handleSyncGoogleSheet() {
    const syncBtn = document.getElementById('adminSyncBtn');
    const url = getGoogleSheetUrl();

    if (!url) {
      alert('ยังไม่ได้ระบุ Google Sheet URL กรุณากดปุ่ม "ตั้งค่า Google Sheet" ก่อน');
      document.getElementById('adminSheetConfigPanel').style.display = 'block';
      return;
    }

    if (activeTabId === 'summary') {
      const confirmAll = confirm('ต้องการส่งข้อมูลคะแนนทั้งหมดของทั้ง 4 กิจกรรม (1, 2, 3, 4) ไปยัง Google Sheet "จักรวาลปลายนิ้ว" ใช่หรือไม่?');
      if (!confirmAll) return;

      syncBtn.disabled = true;
      const originalHtml = syncBtn.innerHTML;
      syncBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังซิงค์ทั้งหมด...';

      let totalSuccess = 0;
      let grandTotal = 0;

      const actKeys = ['pre', 'post', 'act1', 'act2'];
      for (const key of actKeys) {
        const item = CONFIG.ACTIVITIES[key];
        const records = getRecords(item.storageKey);
        grandTotal += records.length;

        for (const r of records) {
          const res = await sendRecordToSheet(item.sheetTab, r);
          if (res.success) totalSuccess++;
          await new Promise(res => setTimeout(res, 150));
        }
      }

      syncBtn.disabled = false;
      syncBtn.innerHTML = originalHtml;
      alert(`ซิงค์ข้อมูลสำเร็จ ${totalSuccess} จากทั้งหมด ${grandTotal} รายการ ไปยัง Google Sheet "จักรวาลปลายนิ้ว" เรียบร้อยแล้ว!`);
      return;
    }

    // ซิงค์เฉพาะแท็บปัจจุบัน
    const act = CONFIG.ACTIVITIES[activeTabId];
    if (!act) return;

    const records = getRecords(act.storageKey);
    if (records.length === 0) {
      alert(`ไม่มีข้อมูลคะแนนของ ${act.label} ให้ซิงค์`);
      return;
    }

    if (!confirm(`ต้องการส่งข้อมูลคะแนนของ "${act.label}" ทั้งหมด ${records.length} รายการ ไปยังแผ่นงาน "${act.sheetTab}" ใน Google Sheet ใช่หรือไม่?`)) {
      return;
    }

    syncBtn.disabled = true;
    const originalHtml = syncBtn.innerHTML;
    syncBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังซิงค์...';

    let successCount = 0;
    for (let i = 0; i < records.length; i++) {
      const res = await sendRecordToSheet(act.sheetTab, records[i]);
      if (res.success) successCount++;
      await new Promise(res => setTimeout(res, 180));
    }

    syncBtn.disabled = false;
    syncBtn.innerHTML = originalHtml;
    alert(`ซิงค์ข้อมูลสำเร็จ ${successCount}/${records.length} รายการ ไปยังแผ่นงาน "${act.sheetTab}" ใน Google Sheet เรียบร้อยแล้ว!`);
  }

  // ส่งออก CSV พร้อม UTF-8 BOM
  function handleExportCSV() {
    let csvContent = '\uFEFF'; // UTF-8 BOM สำหรับ Excel ภาษาไทย
    let filename = '';

    if (activeTabId === 'summary') {
      csvContent += 'ชื่อ,ชั้น,เลขที่,ก่อนเรียน(15),หลังเรียน(15),พัฒนาการ,กิจกรรม1,กิจกรรม2\n';

      const preRecords = getRecords(CONFIG.KEYS.pre);
      const postRecords = getRecords(CONFIG.KEYS.post);
      const act1Records = getRecords(CONFIG.KEYS.act1);
      const act2Records = getRecords(CONFIG.KEYS.act2);

      const studentMap = new Map();
      function normalizeKey(r) {
        return `${(r.name || '').trim().toLowerCase()}_${(r.grade || '').trim().toLowerCase()}_${(r.studentNo || '').trim()}`;
      }

      preRecords.forEach(r => {
        const k = normalizeKey(r);
        if (!studentMap.has(k)) {
          studentMap.set(k, { name: r.name, grade: r.grade, studentNo: r.studentNo, pre: r.score, post: '', act1: '', act2: '' });
        } else {
          studentMap.get(k).pre = r.score;
        }
      });

      postRecords.forEach(r => {
        const k = normalizeKey(r);
        if (!studentMap.has(k)) {
          studentMap.set(k, { name: r.name, grade: r.grade, studentNo: r.studentNo, pre: '', post: r.score, act1: '', act2: '' });
        } else {
          studentMap.get(k).post = r.score;
        }
      });

      act1Records.forEach(r => {
        const k = normalizeKey(r);
        if (!studentMap.has(k)) {
          studentMap.set(k, { name: r.name, grade: r.grade, studentNo: r.studentNo, pre: '', post: '', act1: r.score, act2: '' });
        } else {
          studentMap.get(k).act1 = r.score;
        }
      });

      act2Records.forEach(r => {
        const k = normalizeKey(r);
        if (!studentMap.has(k)) {
          studentMap.set(k, { name: r.name, grade: r.grade, studentNo: r.studentNo, pre: '', post: '', act1: '', act2: r.score });
        } else {
          studentMap.get(k).act2 = r.score;
        }
      });

      const list = Array.from(studentMap.values());
      if (list.length === 0) {
        alert('ไม่มีข้อมูลสำหรับส่งออก');
        return;
      }

      list.forEach(s => {
        const diff = (s.pre !== '' && s.post !== '') ? (s.post - s.pre) : '';
        const diffStr = diff !== '' ? (diff > 0 ? `+${diff}` : String(diff)) : '-';
        csvContent += `"${s.name || ''}","${s.grade || ''}",${s.studentNo || ''},${s.pre !== '' ? s.pre : ''},${s.post !== '' ? s.post : ''},"${diffStr}",${s.act1 !== '' ? s.act1 : ''},${s.act2 !== '' ? s.act2 : ''}\n`;
      });

      filename = `รายงานสรุปเปรียบเทียบคะแนน_ระบบสุริยะ_${new Date().toISOString().slice(0, 10)}.csv`;
    } else {
      const act = CONFIG.ACTIVITIES[activeTabId];
      const records = getRecords(act.storageKey);

      if (records.length === 0) {
        alert('ไม่มีข้อมูลสำหรับส่งออก');
        return;
      }

      if (act.id === 'act1') {
        csvContent += 'ชื่อ,ชั้น,เลขที่,ภารกิจ,คะแนน,วันที่-เวลา\n';
        records.forEach(r => {
          csvContent += `"${r.name || ''}","${r.grade || ''}",${r.studentNo || ''},"${r.mission || 'กิจกรรม 1'}",${r.score || 0},"${r.time || r.date || ''}"\n`;
        });
      } else {
        csvContent += 'ชื่อ,ชั้น,เลขที่,คะแนน,เต็ม,ร้อยละ,วันที่-เวลา\n';
        records.forEach(r => {
          const sc = r.score || 0;
          const max = act.maxScore || 15;
          const pct = r.percentage || Math.round((sc / max) * 100);
          csvContent += `"${r.name || ''}","${r.grade || ''}",${r.studentNo || ''},${sc},${max},${pct},"${r.time || ''}"\n`;
        });
      }

      filename = `คะแนน_${act.label.replace(/[^a-zA-Z0-9\u0E00-\u0E7F]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ล้างข้อมูลทั้งหมด
  function handleClearData() {
    if (activeTabId === 'summary') {
      const confirmPass = prompt('คุณกำลังจะล้างข้อมูลคะแนนของนักเรียนทั้งหมดทั้ง 4 กิจกรรม!\nหากต้องการลบทั้งหมด กรุณาพิมพ์คำว่า "CONFIRM":');
      if (confirmPass === 'CONFIRM') {
        localStorage.removeItem(CONFIG.KEYS.pre);
        localStorage.removeItem(CONFIG.KEYS.post);
        localStorage.removeItem(CONFIG.KEYS.act1);
        localStorage.removeItem(CONFIG.KEYS.act2);
        alert('ล้างข้อมูลคะแนนทั้งหมดทั้ง 4 กิจกรรมเรียบร้อยแล้ว');
        renderDashboard();
        if (typeof window.renderLeaderboards === 'function') {
          try { window.renderLeaderboards(); } catch (e) { }
        }
      }
      return;
    }

    const act = CONFIG.ACTIVITIES[activeTabId];
    const records = getRecords(act.storageKey);

    if (records.length === 0) {
      alert('ไม่มีข้อมูลในส่วนนี้');
      return;
    }

    const confirmPass = prompt(`คุณกำลังจะล้างข้อมูลคะแนนของ "${act.label}" ทั้งหมด ${records.length} รายการ!\nกรุณาพิมพ์คำว่า "CONFIRM" เพื่อยืนยันการล้างข้อมูล:`);
    if (confirmPass === 'CONFIRM') {
      localStorage.removeItem(act.storageKey);
      alert(`ล้างข้อมูลคะแนนของ "${act.label}" เรียบร้อยแล้ว`);
      renderDashboard();
      if (typeof window.renderLeaderboards === 'function') {
        try { window.renderLeaderboards(); } catch (e) { }
      }
    }
  }

  // ฟังก์ชัน Escape HTML เพื่อป้องกัน XSS
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ฟังก์ชันเปิด Modal
  function openAdminModal(tabId) {
    injectAdminModal();

    if (tabId && CONFIG.ACTIVITIES[tabId]) {
      activeTabId = tabId;
    } else {
      activeTabId = detectCurrentPageTab();
    }

    const modal = document.getElementById('adminModal');
    if (!modal) return;

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');

    const loginSec = document.getElementById('adminLoginSection');
    const dashSec = document.getElementById('adminDashboardSection');
    const passInput = document.getElementById('adminPasswordInput');
    const loginError = document.getElementById('adminLoginError');

    if (!isAdminLoggedIn()) {
      if (loginSec) loginSec.style.display = 'block';
      if (dashSec) dashSec.style.display = 'none';
      if (passInput) {
        passInput.value = '';
        setTimeout(() => passInput.focus(), 150);
      }
      if (loginError) loginError.style.display = 'none';
    } else {
      if (loginSec) loginSec.style.display = 'none';
      if (dashSec) dashSec.style.display = 'block';
      renderDashboard();
    }
  }

  // ฟังก์ชันปิด Modal
  function closeAdminModal() {
    const modal = document.getElementById('adminModal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }

  // ลบปุ่มแอดมินลอย (หากมีอยู่ในหน้าจอ)
  function removeFloatingAdminButton() {
    const fab = document.getElementById('adminFloatingBtn');
    if (fab) fab.remove();
  }

  // เพิ่มเมนูแอดมินใน Navbar และ Dropdown แบบทดสอบ
  function integrateWithNavbar() {
    // 1. ตรวจสอบปุ่มแอดมินใน Navbar และ Dropdown
    document.querySelectorAll('#openAdminBtn, #openAdminNavBtn, #dropdownAdminBtn, .open-admin-trigger, .admin-dropdown-item, .admin-nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openAdminModal();
      });
    });

    // 2. เสริมปุ่มในดรอปดาวน์แบบทดสอบ (Dropdown Menu)
    const dropdownMenus = document.querySelectorAll('.dropdown-menu');
    dropdownMenus.forEach(menu => {
      if (menu.querySelector('.admin-dropdown-item')) return; // มีแล้วไม่ต้องใส่ซ้ำ

      const divider = document.createElement('li');
      divider.className = 'dropdown-divider';
      divider.style.margin = '6px 0';
      divider.style.borderTop = '1px solid rgba(255, 255, 255, 0.12)';

      const adminItem = document.createElement('li');
      adminItem.innerHTML = `
        <a href="javascript:void(0)" class="dropdown-item admin-dropdown-item" style="color: var(--neon-cyan);">
          <span class="drop-badge" style="background: rgba(0, 240, 255, 0.2);"><i class="fa-solid fa-shield-halved"></i></span>
          <span class="drop-text" style="font-weight: 600;">ศูนย์แอดมิน (คะแนน 1-4)</span>
          <i class="fa-solid fa-lock drop-arrow"></i>
        </a>
      `;

      adminItem.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        openAdminModal();
      });

      menu.appendChild(divider);
      menu.appendChild(adminItem);
    });

    // 3. ตรวจสอบปุ่ม Admin ใน nav-list หากยังไม่มี ให้แทรกเข้าไปหลัง audio toggle หรือท้าย nav-list
    const navLists = document.querySelectorAll('.nav-list');
    navLists.forEach(navList => {
      if (navList.querySelector('.admin-nav-item')) return; // มีแล้ว

      const li = document.createElement('li');
      li.className = 'nav-item admin-nav-item';
      li.innerHTML = `
        <button type="button" class="admin-nav-btn" title="ระบบแอดมิน / ดูคะแนน 1, 2, 3, 4 (Alt+A)">
          <i class="fa-solid fa-shield-halved"></i>
          <span>แอดมิน</span>
        </button>
      `;

      li.querySelector('button').addEventListener('click', (e) => {
        e.preventDefault();
        openAdminModal();
      });

      navList.appendChild(li);
    });
  }

  // ผูกคีย์ลัด Alt + A
  function initKeyboardShortcut() {
    window.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        const modal = document.getElementById('adminModal');
        if (modal && modal.classList.contains('active')) {
          closeAdminModal();
        } else {
          openAdminModal();
        }
      }
    });
  }

  // ตรวจจับ URL Parameter ?admin=true
  function checkUrlParam() {
    if (new URLSearchParams(window.location.search).get('admin') === 'true') {
      setTimeout(() => {
        openAdminModal();
      }, 250);
    }
  }

  // ส่งออกฟังก์ชันสู่ Window Object
  window.openAdminModal = openAdminModal;
  window.closeAdminModal = closeAdminModal;
  window.SolarAdmin = {
    open: openAdminModal,
    close: closeAdminModal,
    getRecords: getRecords,
    setRecords: setRecords,
    getAdminPassword: getAdminPassword,
    setAdminPassword: setAdminPassword,
    getGoogleSheetUrl: getGoogleSheetUrl,
    setGoogleSheetUrl: setGoogleSheetUrl,
    CONFIG: CONFIG
  };

  // เริ่มต้นเมื่อโหลดหน้าเสร็จ
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectAdminModal();
      removeFloatingAdminButton();
      integrateWithNavbar();
      initKeyboardShortcut();
      checkUrlParam();
    });
  } else {
    injectAdminModal();
    removeFloatingAdminButton();
    integrateWithNavbar();
    initKeyboardShortcut();
    checkUrlParam();
  }

})();
