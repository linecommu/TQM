// รับคำสั่งแบบ POST (ใช้สำหรับบันทึกก้าวเดิน และ เช็คชื่อผู้ใช้)
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  // ตั้งค่า CORS Header ให้ GitHub สามารถเรียกใช้งานได้
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
  };

  if (action === 'checkUser') {
    const user = checkUser(data.uid);
    return ContentService.createTextOutput(JSON.stringify(user))
      .setMimeType(ContentService.MimeType.JSON);
  } 
  else if (action === 'recordSteps') {
    const result = recordSteps(data.uid, data.firstName, data.lastName, data.steps);
    return ContentService.createTextOutput(JSON.stringify({status: result}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// รับคำสั่งแบบ GET (ใช้ดึงข้อมูล Leaderboard)
function doGet(e) {
  if (e.parameter.action === 'getLeaderboard') {
    const data = getLeaderboardData();
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput("GAS API is running.");
}

// === ฟังก์ชันการทำงานหลัก (เหมือนเดิม) ===

function checkUser(uid) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === uid) {
      return { firstName: data[i][1], lastName: data[i][2] };
    }
  }
  return null;
}

function recordSteps(uid, firstName, lastName, steps) {
  if (Number(steps) < 7000) return "not_enough_steps"; 
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const userSheet = ss.getSheetByName("Users");
  const stepSheet = ss.getSheetByName("Data"); 
  
  let userExists = false;
  const userData = userSheet.getDataRange().getValues();
  
  for (let i = 1; i < userData.length; i++) {
    if (userData[i][0] === uid) {
      userExists = true;
      firstName = userData[i][1]; 
      lastName = userData[i][2];
      break;
    }
  }

  if (!userExists) {
    if (!firstName || !lastName) return "need_registration";
    userSheet.appendRow([uid, firstName, lastName]);
  }

  stepSheet.appendRow([new Date(), uid, firstName, lastName, steps]);
  return "success";
}

function getLeaderboardData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data");
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; 

  let records = [];
  for (let i = 1; i < data.length; i++) {
    records.push({
      rowOrder: i + 1, 
      firstName: data[i][2] || "ไม่ระบุ",
      lastName: data[i][3] || "",
      steps: Number(data[i][4]) || 0
    });
  }

  records.sort((a, b) => {
    if (b.steps !== a.steps) return b.steps - a.steps; 
    return a.rowOrder - b.rowOrder; 
  });

  return records.slice(0, 50);
}
