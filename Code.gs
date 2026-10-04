/**
 * Google Apps Script Web App for Quiz Submission Integration
 * 
 * Target Sheet Name: "Results"
 * 
 * Columns (A to N):
 * A: Attempt ID
 * B: Student Name
 * C: Register Number
 * D: Date/Time
 * E: Total Questions
 * F: Attempted
 * G: Skipped
 * H: Correct
 * I: Wrong
 * J: Score
 * K: Percentage
 * L: Time Taken
 * M: Tab Switches
 * N: Submission Type
 */

var SHEET_NAME = "Results";

var HEADERS = [
  "Attempt ID",
  "Student Name",
  "Register Number",
  "Date/Time",
  "Total Questions",
  "Attempted",
  "Skipped",
  "Correct",
  "Wrong",
  "Score",
  "Percentage",
  "Time Taken",
  "Tab Switches",
  "Submission Type"
];

/**
 * Handles incoming POST requests from the Next.js API route (/api/submit)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  
  // Try to acquire the script lock for up to 30 seconds to prevent concurrent writes
  var hasLock = false;
  try {
    hasLock = lock.tryLock(30000);
  } catch (lockError) {
    hasLock = false;
  }

  if (!hasLock) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: "Server is busy. Please try again."
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: "No post data received"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseError) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: "Invalid JSON format"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var attemptId = (data.attemptId || "").toString().trim();
    if (!attemptId) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: "Attempt ID is required"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Access the active spreadsheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    // If "Results" sheet doesn't exist, create it and add headers
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    } else if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    }

    // Check whether the Attempt ID already exists in Column A
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var idRange = sheet.getRange(2, 1, lastRow - 1, 1);
      var idValues = idRange.getValues();
      for (var i = 0; i < idValues.length; i++) {
        if (idValues[i][0] && String(idValues[i][0]).trim() === attemptId) {
          return ContentService
            .createTextOutput(JSON.stringify({
              success: true,
              duplicate: true,
              message: "This quiz attempt has already been submitted."
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    // Format current Date/Time
    var timeZone = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone() || "GMT";
    var formattedDateTime = Utilities.formatDate(new Date(), timeZone, "yyyy-MM-dd HH:mm:ss");

    // Construct the row matching columns A to N exactly
    var newRow = [
      attemptId,                                     // A: Attempt ID
      (data.studentName || "").toString().trim(),     // B: Student Name
      (data.registerNumber || "").toString().trim(), // C: Register Number
      formattedDateTime,                             // D: Date/Time
      Number(data.totalQuestions) || 0,              // E: Total Questions
      Number(data.attempted) || 0,                   // F: Attempted
      Number(data.skipped) || 0,                     // G: Skipped
      Number(data.correct) || 0,                     // H: Correct
      Number(data.wrong) || 0,                       // I: Wrong
      Number(data.score) || 0,                       // J: Score
      Number(data.percentage) || 0,                  // K: Percentage
      (data.timeTaken || "00:00").toString().trim(), // L: Time Taken
      Number(data.tabSwitches) || 0,                 // M: Tab Switches
      (data.submissionType || "manual").toString().trim() // N: Submission Type
    ];

    // Append result row to the sheet
    sheet.appendRow(newRow);

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: "Quiz submitted successfully"
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: "Unable to submit quiz"
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    // Release the script lock
    lock.releaseLock();
  }
}

/**
 * Handles incoming GET requests (for deployment verification)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "active",
      message: "Google Apps Script Quiz Web App is running."
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper function: Can be manually run once in Apps Script editor
 * to ensure the "Results" tab and header row exist.
 */
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  Logger.log("Results sheet initialized with headers.");
}
