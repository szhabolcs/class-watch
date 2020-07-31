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
let appOutput = [];

function isWindowsProcess(processName){
    switch (processName) {
        case "ApplicationFrameHost":
            return true;

        case "TextInputHost":
            return true;

        case "Video.UI":
            return true;

        case "WinStore.App":
            return true;

        case "SystemSettings":
            return true;

        default:
            return false;
    }
}

function getStudentInfo() {
    const {exec} = require('child_process');
    let temp = [];
    let tempString;
    exec(' gps | ? {$_.mainwindowtitle.length -ne 0} | Format-Table -HideTableHeaders  name, Description', {'shell': 'powershell.exe'}, (error, stdout, stderr) => {
        appOutput = stdout.split("\n");
        for (let i in appOutput) {
            temp = appOutput[i].split(' ');
            appOutput[i] = [];
            appOutput[i].push(temp[0]);
            delete temp[0];
            tempString = temp.filter(item => item !== "").join(" ");
            appOutput[i].push(tempString);
        }
        $('html').trigger('appLoadFinished', appOutput);
    });
}


function showModal(message) {
    let $modal = $("#warning-modal");
    $modal.find(".modal-body").text(message);
    $modal.modal("show");
}

/**
 *
 * @param {String} id The id of the student
 */
function fetchStudentInfo(id, className) {
    let studentInfo;
    socket.emit("fetchStudentInfo", {id: id, className: className});
}

/**
 * This function shows a modal with the student activity
 * @param {String} id The id of the student
 * @param {String} name The name of the student
 * @param {String} className The name of the class
 */
function showStudentInfo(id, name, className) {
    let $modal = $("#student-modal");
    $modal.modal("show");
    $("#student-modal-label").text("Info about " + name);
    let studentInfo = fetchStudentInfo(id, className);
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

    socket.on('teacherLeft', () => {
        $("body").load("main-menu.html", () => {
            showModal(MSG_TEACHER_LEFT);
        });
        disconnect();
    });

    socket.on('chatMessage', (eventInfo) => {
        const $message = $(" <span class='message-group'>" +
            "<span class='from'>" + eventInfo.username + "</span>: " +
            "<span id='message'>" + eventInfo.message + "</span>" +
            "</span>");
        if (eventInfo.hasOwnProperty('teacher'))
            $message.addClass('teacher');
        $('#chat').append($message);
        scrollChatIntoView();
    });

    socket.on('studentJoined', (eventInfo) => {
        $("#class-body").append(
            '<div class="student-row" id="' + eventInfo.id + '">' +
            '<span class="student-name">' + eventInfo.name + '</span>' +
            '<svg class="info-btn" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="info-circle" class="svg-inline--fa fa-info-circle fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z"></path></svg></span>' +
            '<span class="ping-btn row-btn bg-info">PING</span>' +
            '</div>'
        );
    });

    socket.on('studentLeft', (eventInfo) => {
        $("#" + eventInfo.id).remove();
    });

    socket.on('fetchStudentInfo', (eventInfo) => {
        getStudentInfo();
    })


    socket.on("appInfoReceived", (eventInfo) => {
        let emptyString = appOutput[0][0];
        $("#used-apps").empty();
        for(let i = 0; i < appOutput.length-1; i++){
            if(appOutput[i][0] !== emptyString && !isWindowsProcess(appOutput[i][0])){
                if(appOutput[i][1] !== emptyString){
                    $("#used-apps").append(
                        '<div class="app-row">'+appOutput[i][1]+'</div>'
                    );
                }
                else{
                    $("#used-apps").append(
                        '<div class="app-row">'+appOutput[i][0]+'</div>'
                    );
                }

            }
        }
    });
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

$("html").on("click", '#send-message-btn', (eventInfo) => {
    eventInfo.preventDefault();
    const $chatInput = $('#chat-input');
    if ($chatInput.val() !== "") {
        socket.emit("chatMessage", {
            className: session.class,
            username: session.name,
            message: $chatInput.val()
        });
        $chatInput.val('');
    }
});

//Send on enter press
$("html").on("keydown", '#chat-input', (eventInfo) => {
    if (eventInfo.which == 13) {
        eventInfo.preventDefault();
        const $chatInput = $('#chat-input');
        if ($chatInput.val() !== "") {
            socket.emit("chatMessage", {
                className: session.class,
                username: session.name,
                message: $chatInput.val()
            });
            $chatInput.val('');
        }
        return false;
    }
});

$("html").on("click", '.info-btn', (eventInfo) => {
    /*let id = $(eventInfo.currentTarget).attr('id');
    let name = $(eventInfo.currentTarget.parentElement).children(".student-name").text();*/
    const id = $(eventInfo.currentTarget.parentElement).attr('id');
    const name = session.name;
    const className = session.class;
    showStudentInfo(id, name, className);
});

$('html').on("appLoadFinished", (eventInfo) => {


    appOutput['class'] = session.class;
    socket.emit('appInfoReceived', appOutput);
});