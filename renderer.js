// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const io = require("socket.io-client"); 

const socket = io("http://gpcnet.go.ro:3000/");

  const { exec } = require('child_process');
  exec('gps | where {$_.MainWindowHandle -ne 0 } | select Description', {'shell':'powershell.exe'}, (error, stdout, stderr)=> {
    //console.log(stdout.split("\n"));
  });

  function showModal(message){
    $(".modal-body").text(message);
    $("#warning-modal").modal("show");
  }

  /**
   * Check wether the inputs are empty or not
   * @param {function} callback callback function
   */
  function checkInputs(callback){
    if($("#class-name").val() !== "" && $("#user-name").val() !== ""){
      callback();
    }
    else{
      showModal("Please fill in all the fields.");
    }
  }

  /**
   * Scrolls the chat into view
   */
  function scrollChatIntoView(){
    $("#chat").animate({ scrollTop: $('#chat').prop("scrollHeight")}, 1000);
  }

  //Event listeners

$("html").on("click","#enter-class",()=>{
    checkInputs(()=>{
      $("body").load("student.html");
      //TODO: enter class
    });
});

$("html").on("click","#create-class",()=>{
    //TODO: new class
});

$("html").on("click","#leave-class",()=>{
  showModal("Are you sure you want to leave?");
});

$("html").on("click","#leave-class-approve-btn",()=>{
  $("body").load("main-menu.html");
});