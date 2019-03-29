let cred;
let blue = "#39c0ba";
let gray = "#5b6969";
let continuedWithoutSignIn = false;

function collpaseSignPanel() {
  $('#nav-collapse1').collapse('hide');
}

function switchToClonePanel(){
  console.log("switch to clone panel");
  hideAuthenticatePanel();
  hideFilePanel();
  hideGraphPanel();
  displayClonePanel();
}

function switchToMainPanel() {
  hideAuthenticatePanel();
  hideAddRepositoryPanel();
  displayFilePanel();
  displayGraphPanel();
}

function checkSignedIn() {
  if (continuedWithoutSignIn) {
    displayModal("You need to sign in");
    // Don't open the repo modal
    $('#repo-name').removeAttr("data-target");
  } else {
    // Ensure repo modal is connected
    $('#repo-name').attr("data-target", "#repo-modal");
  }
}

function switchToAddRepositoryPanelWhenNotSignedIn() {
  continuedWithoutSignIn = true;
  switchToAddRepositoryPanel();
}

function switchToAddRepositoryPanel() {
  console.log("Switching to add repo panel");
  hideAuthenticatePanel();
  hideFilePanel();
  hideGraphPanel();
  displayAddRepositoryPanel();
}

function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
}

function displayClonePanel(){
  document.getElementById("add-repository-panel").style.zIndex = "10";
  $("#open-local-repository").hide();
}

function displayFilePanel() {
  document.getElementById("file-panel").style.zIndex = "10";
}

function displayGraphPanel() {
  document.getElementById("graph-panel").style.zIndex = "10";
}

function displayAddRepositoryPanel() {
  document.getElementById("add-repository-panel").style.zIndex = "10";
  $("#open-local-repository").show();
}

function hideFilePanel() {
  document.getElementById("file-panel").style.zIndex = "-10";
}

function hideGraphPanel() {
  document.getElementById("graph-panel").style.zIndex = "-10";
}

function hideAddRepositoryPanel() {
  document.getElementById("add-repository-panel").style.zIndex = "-10";
}

function displayDiffPanel() {
  document.getElementById("graph-panel").style.width = "60%";
  document.getElementById("diff-panel").style.width = "40%";
  displayDiffPanelButtons();
}

function hideDiffPanel() {
  document.getElementById("diff-panel").style.width = "0";
  document.getElementById("graph-panel").style.width = "100%";
  disableDiffPanelEditOnHide();
  hideDiffPanelButtons();
}

function hideAuthenticatePanel() {
  document.getElementById("authenticate").style.zIndex = "-20";
}

function displayAuthenticatePanel() {
  document.getElementById("authenticate").style.zIndex = "20";
}

function displayDiffPanelButtons(){
  document.getElementById("save-button").style.visibility = "visible";
  document.getElementById("cancel-button").style.visibility = "visible";
}

function hideDiffPanelButtons(){
  document.getElementById("save-button").style.visibility = "hidden";
  document.getElementById("cancel-button").style.visibility = "hidden";
  disableSaveCancelButton();
  disableDiffPanelEditOnHide();
}

function disableSaveCancelButton() {
  let saveButton = document.getElementById("save-button");
  let cancelButton = document.getElementById("cancel-button");
  saveButton.disabled = true;
  saveButton.style.backgroundColor = gray;
  cancelButton.disabled = true;
  cancelButton.style.backgroundColor = gray;
}

function enableSaveCancelButton() {
  let saveButton = document.getElementById("save-button");
  let cancelButton = document.getElementById("cancel-button");
  saveButton.disabled = false;
  saveButton.style.backgroundColor = blue;
  cancelButton.disabled = false;
  cancelButton.style.backgroundColor = blue;
}

function disableDiffPanelEditOnHide(){
  let doc = document.getElementById("diff-panel-body");
  doc.contentEditable = "false";
} 

function useSaved() {
  console.log('button has been pressed: logging in with saved credentials');
  decrypt();
  loginWithSaved(switchToMainPanel);
}
