/** This file is required by the index.html file and will
 * be executed in the renderer process for that window.
 * No Node.js APIs are available in this process because
 * `nodeIntegration` is turned off. Use `preload.js` to
 * selectively enable features needed in the rendering
 * process.
 **/
const io = require("socket.io-client");
let socket;
let session;

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
function scrollChatIntoView() {
    $("#chat").animate({scrollTop: $('#chat').prop("scrollHeight")}, 1000);
}

/**
 * Connects to the server
 */
function connect() {
    socket = io("http://gpcnet.go.ro:3000/");
    bindSocketListeners(socket);
    return socket;
}

/**
 * Disconnects from the server
 */
function disconnect() {
    socket.disconnect();
}

/**
 * Binds the event listeners needed for the communication
 */
function bindSocketListeners(socket) {
    //todo remove when finished
    socket.on('test', (msg) => console.log(msg));

    socket.on('joinSuccess', (eventInfo) => {
        session.joined = true;
        $("body").load("student.html", () => {
            $("#name").text(eventInfo.name);
            $("#class-name").text(eventInfo.className);
        });
    });

    socket.on('createSuccess', (eventInfo) => {
        session.joined = true;
        console.log("Class created!");
        $("body").load("teacher.html", () => {
            $("#name").text(eventInfo.name);
            $("#class-name").text(eventInfo.className);
        });
    });

    socket.on('errorMsg', (errorMessage) => {
        disconnect();
        showModal(errorMessage);
    });

    socket.on('teacherLeft', ()=>{
        $("body").load("main-menu.html", ()=>{
            showModal(MSG_TEACHER_LEFT);
        });
        disconnect();

    })
}

//Event listeners

$("html").on("click", "#enter-class", (eventInfo) => {
    eventInfo.preventDefault();
    checkInputs(() => {
        const studentName = $("#user-name").val();
        const className = $("#class-name").val();
        session = {
            name: studentName,
            class: className,
            joined: false
        }
        socket = connect();
        socket.emit('joinClass', {
            studentName: studentName,
            className: className
        });
    });
});

$("html").on("click", "#create-class", (eventInfo) => {
    eventInfo.preventDefault();
    checkInputs(() => {
        const teacherName = $("#user-name").val();
        const className = $("#class-name").val();
        session = {
            name: teacherName,
            class: className,
            joined: false
        }
        socket = connect();
        socket.emit('createClass', {
            teacherName: teacherName,
            className: className
        });
    });
});

$("html").on("click", "#leave-class", () => {
    showModal(MSG_LEAVE);
});

$("html").on("click", "#leave-class-approve-btn", () => {
    $("body").load("main-menu.html");
    disconnect();
});