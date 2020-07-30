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

socket.on('test', (msg) => console.log(msg));

socket.on('loginSuccess', () => {
    $("body").load("student.html");
});

socket.on('errorMsg', (errorMessage) => {
    showModal(errorMessage);
});

$("#enter-class").click((eventInfo) => {
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

$("#create-class").click((eventInfo) => {
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