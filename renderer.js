// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const io = require("socket.io-client");

const socket = io("http://gpcnet.go.ro:3000/");

const {exec} = require('child_process');
exec('gps | where {$_.MainWindowHandle -ne 0 } | select Description', {'shell': 'powershell.exe'}, (error, stdout, stderr) => {
    //console.log(stdout.split("\n"));
});

function showModal(message) {
    $(".modal-body").text(message);
    $("#warning-modal").modal("show");
}

/**
 * Check wether the inputs are empty or not
 * @param {function} callback callback function
 */
function checkInputs(callback) {
    if ($("#class-name").val() !== "" && $("#user-name").val() !== "") {
        callback();
    } else {
        showModal(MSG_FILL_FIELDS);
    }
}

/**
   * Scrolls the chat into view
   */
function scrollChatIntoView(){
  $("#chat").animate({ scrollTop: $('#chat').prop("scrollHeight")}, 1000);
}

//todo remove when finished
socket.on('test', (msg) => console.log(msg));

socket.on('joinSuccess', () => {
    $("body").load("student.html");
});

socket.on('createSuccess', () => {
    //todo load teacher dashboard here
    //$("body").load("student.html");
});

socket.on('errorMsg', (errorMessage) => {
    showModal(errorMessage);
});

//Event listeners

$("html").on("click","#enter-class",(eventInfo)=>{
    eventInfo.preventDefault();
    checkInputs(() => {
        const studentName = $("#user-name").val();
        const className = $("#class-name").val();
        socket.emit('joinClass', {
            studentName: studentName,
            className: className
        });
    });
});

$("html").on("click","#create-class",(eventInfo)=>{
    eventInfo.preventDefault();
    checkInputs(()=> {
        const teacherName = $("#user-name").val();
        const className = $("#class-name").val();
        socket.emit('createClass', {
            teacherName: teacherName,
            className: className
        });
    });
});

$("html").on("click","#leave-class",()=>{
  showModal("Are you sure you want to leave?");
});

$("html").on("click","#leave-class-approve-btn",()=>{
  $("body").load("main-menu.html");
});