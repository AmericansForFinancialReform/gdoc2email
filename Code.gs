function mailer(title, body){
  //var docbody = exportAsHTML();
  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: title,
    htmlBody:  body  });
}

function exportAsHTML(){
  var forDriveScope = DriveApp.getStorageUsed(); //needed to get Drive Scope requested
  var docID = DocumentApp.getActiveDocument().getId();
  var url = "https://docs.google.com/feeds/download/documents/export/Export?id="+docID+"&exportFormat=html";
  var param = {
    method      : "get",
    headers     : {"Authorization": "Bearer " + ScriptApp.getOAuthToken()},
    muteHttpExceptions:true,
  };
  var html = UrlFetchApp.fetch(url,param).getContentText();  
  return html;
  
}

function sendMailFromDocHTML() {
  try {
    
    // Not currently using this Email Template; need to figure out how to insert the image 
    // into the right place
    
    // note: only createTemplateFromFile lets you use <?= ?>, createHtmlOutputFromFile does NOT
    // var htmlBody = HtmlService.createTemplateFromFile('mail_template').evaluate();
    // var html_str = htmlBody.getContent();
    
    var title = DocumentApp.getActiveDocument().getName();
    var html = exportAsHTML();
      
    // documentation: https://sites.google.com/site/scriptsexamples/learn-by-example/parsing-html
    //
    // the XmlService is throwing the following error: Exception: Error on line 1: The element type "meta" must be terminated 
    // by the matching end-tag "</meta>".
    //var doc = XmlService.parse(html);
    //var html_doc = doc.getRootElement();
    //var body = getElementsByTagName(html_doc, 'body')[0];
    
    mailer(title, html);
    
  }
  catch (e) {
    logErrors(e.toString());
  }
}


function getHTMLFromURL() {
  var id = DocumentApp.getActiveDocument().getId();
  var url = "https://docs.google.com/feeds/download/documents/export/Export?id=" + id + "&exportFormat=html";
  var html = UrlFetchApp.fetch(url).getContentText();
  /*  var param = {
  method: "get",
  headers: {"Authorization": "Bearer " + ScriptApp.getOAuthToken() },
  muteHttpExceptions: true };
  var html = UrlFetchApp.fetch(url, param).getContentText(); */
  
  return html;
}

function logErrors(e) {
  var logId = PropertiesService.getScriptProperties().getProperty('LogSheetId');
  var errorSheet = SpreadsheetApp.openById(logId)
  .getSheetByName("errors");
  var cell = errorSheet.getRange('A1').offset(errorSheet.getLastRow(),0);
  cell.setValue(new Date() + " : " + e);  
}

/**
* Creates a menu entry in the Google Docs UI when the document is opened.
* This method is only used by the regular add-on, and is never called by
* the mobile add-on version.
*
* @param {object} e The event parameter for a simple onOpen trigger. To
*     determine which authorization mode (ScriptApp.AuthMode) the trigger is
*     running in, inspect e.authMode.
*/
function onOpen() {
  DocumentApp.getUi().createAddonMenu()
  .addItem( 'Open', 'showSidebar' )
  .addToUi();
}

// include is a wrapper that lets us pull files, allowing for separation of css files, etc
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
  .getContent();
}

/**
* Opens a sidebar in the document containing the add-on's user interface.
* This method is only used by the regular add-on, and is never called by
* the mobile add-on version.
*/
function showSidebar() {
  //  note: only createTemplateFromFile lets you use <?= ?>, createHtmlOutputFromFile does NOT
  const page = HtmlService.createTemplateFromFile( 'sidebar' ).evaluate();
  
  page.setTitle( 'Publish Statement to...' );
  DocumentApp.getUi().showSidebar( page );
}



/**
* Gets the text the user has selected. If there is no selection,
* this function displays an error message.
*
* @return {Array.<string>} The selected text.
*/
function getSelectedText() {
  var selection = DocumentApp.getActiveDocument().getSelection();
  if (selection) {
    var text = [];
    var elements = selection.getSelectedElements();
    for (var i = 0; i < elements.length; i++) {
      if (elements[i].isPartial()) {
        var element = elements[i].getElement().asText();
        var startIndex = elements[i].getStartOffset();
        var endIndex = elements[i].getEndOffsetInclusive();
        
        text.push(element.getText().substring(startIndex, endIndex + 1));
      } else {
        var element = elements[i].getElement();
        // Only translate elements that can be edited as text; skip images and
        // other non-text elements.
        if (element.editAsText) {
          var elementText = element.asText().getText();
          // This check is necessary to exclude images, which return a blank
          // text element.
          if (elementText != '') {
            text.push(elementText);
          }
        }
      }
    }
    if (text.length == 0) {
      throw 'Please select some text.';
    }
    return text;
  } else {
    throw 'Please select some text.';
  }
}

