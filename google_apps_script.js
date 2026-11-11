/**
 * ============================================================
 * สคริปต์เชื่อมต่อฐานข้อมูล Google Sheets
 * โครงการ: ห้องเรียนระบบสุริยะ (จักรวาลปลายนิ้ว)
 * สเปรดชีตเป้าหมาย: จักรวาลปลายนิ้ว
 * Spreadsheet ID: 1Djr3luVP2gRxsjImrGTXxvFrJdBQQz-ESBEieDFl1kc
 * แผ่นงานเป้าหมาย: ก่อนเรียน (Pre-test)
 * ตารางมีแค่ 4 ช่อง: ชื่อ | ชั้น | เลขที่ | คะแนน
 * ============================================================
 * 
 * วิธีอัปเดตใน Google Sheet:
 * 1. เปิด Google Sheet ของคุณ:
 *    https://docs.google.com/spreadsheets/d/1Djr3luVP2gRxsjImrGTXxvFrJdBQQz-ESBEieDFl1kc/edit
 * 2. ไปที่เมนู "ส่วนขยาย" (Extensions) > "Apps Script"
 * 3. วางโค้ดชุดใหม่นี้ทับโค้ดเดิมทั้งหมด
 * 4. กดปุ่ม "บันทึก" (Save 💾)
 * 5. กดปุ่มสีน้ำเงิน "ทำให้ใช้งานได้" (Deploy) > "จัดการการทำให้ใช้งานได้" (Manage deployments)
 *    - กดไอคอนดินสอ (Edit) ที่รายการเดิม
 *    - ในช่อง "เวอร์ชัน" (Version) ให้เลือก "เวอร์ชันใหม่" (New version)
 *    - กด "ทำให้ใช้งานได้" (Deploy)
 */

var SPREADSHEET_ID = '1Djr3luVP2gRxsjImrGTXxvFrJdBQQz-ESBEieDFl1kc';

function getTargetSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== '') {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (err) {
      console.warn("ไม่สามารถเปิดด้วย ID ได้ จะใช้ Active Spreadsheet แทน:", err);
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var ss = getTargetSpreadsheet();
    if (!ss) {
      throw new Error("ไม่พบสเปรดชีต ID: " + SPREADSHEET_ID);
    }
    
    // ดึงข้อมูล JSON จากหน้าเว็บ
    var contents = e.postData.contents;
    var data = JSON.parse(contents);

    var targetSheetName = data.sheetName || 'ก่อนเรียน';
    var sheet = ss.getSheetByName(targetSheetName);

    if (!sheet) {
      sheet = ss.insertSheet(targetSheetName);
    }

    // ตรวจสอบหัวตาราง: หากมีหัวตารางแบบเดิม (เช่น มีคำว่า 'ลำดับ') หรือชีตว่าง ให้สร้างหัวตาราง 4 ช่องใหม่
    var firstCell = sheet.getLastRow() > 0 ? sheet.getRange(1, 1).getValue() : '';
    if (sheet.getLastRow() === 0 || firstCell === 'ลำดับ' || sheet.getLastColumn() > 4) {
      // ล้างข้อมูลและหัวตารางเดิมออกเพื่อให้มีแค่ 4 ช่อง
      if (firstCell === 'ลำดับ' || sheet.getLastColumn() > 4) {
        sheet.clear();
      }

      var headers = ['ชื่อ', 'ชั้น', 'เลขที่', 'คะแนน'];
      sheet.appendRow(headers);

      var headerRange = sheet.getRange(1, 1, 1, 4);
      headerRange.setBackground('#0b132b');
      headerRange.setFontColor('#00f0ff');
      headerRange.setFontWeight('bold');
      headerRange.setFontSize(11);
      headerRange.setHorizontalAlignment('center');
      headerRange.setVerticalAlignment('middle');
      sheet.setRowHeight(1, 36);
      sheet.setFrozenRows(1);
    }

    // แถวข้อมูล 4 ช่องเท่านั้น: ชื่อ, ชั้น, เลขที่, คะแนน
    var rowData = [
      data.name || '-',
      data.grade || '-',
      data.studentNo || '-',
      data.score !== undefined ? data.score : 0
    ];

    sheet.appendRow(rowData);

    var lastRow = sheet.getLastRow();
    sheet.setRowHeight(lastRow, 30);

    // จัดตำแหน่งข้อความ
    sheet.getRange(lastRow, 1).setHorizontalAlignment('left');   // ชื่อ
    sheet.getRange(lastRow, 2).setHorizontalAlignment('center'); // ชั้น
    sheet.getRange(lastRow, 3).setHorizontalAlignment('center'); // เลขที่
    sheet.getRange(lastRow, 4).setHorizontalAlignment('center'); // คะแนน

    sheet.autoResizeColumns(1, 4);

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'บันทึกคะแนนเข้าสู่ชีต ' + targetSheetName + ' (4 ช่อง: ชื่อ ชั้น เลขที่ คะแนน) เรียบร้อยแล้ว',
        row: lastRow
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// ฟังก์ชันสำหรับอ่านข้อมูล 5 อันดับแรก หรือข้อมูลทั้งหมดจาก Google Sheet (รองรับการดึงจากทุกเครื่อง)
function doGet(e) {
  try {
    var ss = getTargetSpreadsheet();
    if (!ss) {
      throw new Error("ไม่พบสเปรดชีต ID: " + SPREADSHEET_ID);
    }

    // ระบุชื่อแท็บที่ต้องการ เช่น ก่อนเรียน, หลังเรียน, กิจกรรม1, กิจกรรม2
    var targetSheetName = (e && e.parameter && (e.parameter.sheetName || e.parameter.tab || e.parameter.sheet)) || 'ก่อนเรียน';
    var sheet = ss.getSheetByName(targetSheetName);

    // ถ้ายังไม่มีชีตนี้ ให้สร้างและกำหนดหัวตาราง 4 ช่อง
    if (!sheet) {
      sheet = ss.insertSheet(targetSheetName);
      var initHeaders = ['ชื่อ', 'ชั้น', 'เลขที่', 'คะแนน'];
      sheet.appendRow(initHeaders);
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          service: 'Solar System Database API',
          sheetName: targetSheetName,
          total: 0,
          top5: [],
          data: []
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          service: 'Solar System Database API',
          sheetName: targetSheetName,
          total: 0,
          top5: [],
          data: []
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var lastCol = Math.max(sheet.getLastColumn(), 4);
    var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();

    // ค้นหาตำแหน่งคอลัมน์ชื่อและคะแนนจากหัวตารางแถวแรก
    var headerRow = values[0];
    var nameIdx = 0;   // ค่าเริ่มต้น: คอลัมน์ที่ 1 (A)
    var scoreIdx = 3;  // ค่าเริ่มต้น: คอลัมน์ที่ 4 (D)

    for (var c = 0; c < headerRow.length; c++) {
      var h = String(headerRow[c] || '').trim().toLowerCase();
      if (h === 'ชื่อ' || h === 'ชื่อ - นามสกุล' || h === 'name' || h === 'student') {
        nameIdx = c;
      } else if (h === 'คะแนน' || h === 'คะแนนที่ได้' || h === 'score' || h === 'points') {
        scoreIdx = c;
      }
    }

    var records = [];
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var nameVal = String(row[nameIdx] !== undefined && row[nameIdx] !== null ? row[nameIdx] : '').trim();
      var rawScore = row[scoreIdx];

      // ข้ามแถวที่ชื่อว่างเปล่า หรือเป็นขีดละไว้
      if (!nameVal || nameVal === '-' || nameVal === '') continue;

      var numScore = typeof rawScore === 'number' ? rawScore : parseFloat(String(rawScore).replace(/[^0-9.-]/g, ''));
      if (isNaN(numScore)) numScore = 0;

      records.push({
        name: nameVal,
        score: numScore,
        rowNumber: r + 1
      });
    }

    // จัดเรียงคะแนนสูงสุดก่อน (DESC) หากคะแนนเท่ากันเรียงตามลำดับแถว
    records.sort(function(a, b) {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.rowNumber - b.rowNumber;
    });

    var top5 = records.slice(0, 5);

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        service: 'Solar System Database API',
        sheetName: targetSheetName,
        total: records.length,
        top5: top5,
        data: top5
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        service: 'Solar System Database API',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ฟังก์ชันสำหรับสั่งจัดหน้าชีตเป็น 4 ช่องได้ทันทีจาก Apps Script editor
function setupCleanSheet() {
  var ss = getTargetSpreadsheet();
  var sheet = ss.getSheetByName('ก่อนเรียน');
  if (!sheet) sheet = ss.insertSheet('ก่อนเรียน');
  sheet.clear();
  var headers = ['ชื่อ', 'ชั้น', 'เลขที่', 'คะแนน'];
  sheet.appendRow(headers);

  var headerRange = sheet.getRange(1, 1, 1, 4);
  headerRange.setBackground('#0b132b');
  headerRange.setFontColor('#00f0ff');
  headerRange.setFontWeight('bold');
  headerRange.setFontSize(11);
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 36);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, 4);
}
