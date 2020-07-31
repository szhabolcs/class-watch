/** This file is required by the index.html file and will
 * be executed in the renderer process for that window.
 * No Node.js APIs are available in this process because
 * `nodeIntegration` is turned off. Use `preload.js` to
 * selectively enable features needed in the rendering
 * process.
 **/
const io = require("socket.io-client");
const fs = require('fs');
let socket;
let session;
let appOutput = [];
let studentId;
let hostsValue;

fs.copyFile(HOSTS_PATH, BACKUP_HOSTS_PATH, (err) => console.log(err));

function isWindowsProcess(processName) {
    if (processName.startsWith("WindowsInternal"))
        return true;
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

        case "dwm":
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
        $('html').trigger('appLoadFinished');
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
        fs.copyFile(BACKUP_HOSTS_PATH, HOSTS_PATH, (err) => {});
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
        let emptyString = eventInfo[0][0];
        $("#used-apps").empty();
        for (let i = 0; i < eventInfo.length - 1; i++) {
            if (eventInfo[i][0] !== emptyString && !isWindowsProcess(eventInfo[i][0])) {
                if (eventInfo[i][1] !== emptyString) {
                    $("#used-apps").append(
                        '<div class="app-row">' +
                        eventInfo[i][1] +
                        '<span id="app-close-btn" data-app-id = ' + eventInfo[i][0] + ' class="bg-danger row-btn">Close</span>' +
                        '</div>'
                    );
                } else {
                    $("#used-apps").append(
                        '<div class="app-row">' +
                        eventInfo[i][0] +
                        '<span id="app-close-btn" data-app-id = ' + eventInfo[i][0] + ' class="bg-danger row-btn">Close</span>' +
                        '</div>'
                    );
                }

            }
        }
    });

    socket.on('closeApp', (eventInfo) => {
        const {exec} = require('child_process');
        exec('taskkill /im ' + eventInfo.appName + '.exe', {'shell': 'powershell.exe'});
    });
    socket.on('blockWebsite', (eventInfo) => {
        const {exec} = require('child_process');
        fs.appendFile(HOSTS_PATH, eventInfo.domain, () => console.log("blocked"));
        fs.appendFile(HOSTS_PATH, "www." + eventInfo.domain, () => console.log("blocked"));
    });
    socket.on('allowWebsite', (eventInfo) => {
        const {exec} = require('child_process');
        fs.readFile(HOSTS_PATH, 'utf-8', (err, data) => {
            hostsValue = {
                data: data,
                website: eventInfo.domain
            };
            $('html').trigger('hostsLoaded');
        });
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
    fs.copyFile(BACKUP_HOSTS_PATH, HOSTS_PATH, (err) => {});
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
    const id = $(eventInfo.currentTarget.parentElement).attr('id');
    const name = $(eventInfo.currentTarget.parentElement).children(".student-name").text()
    const className = session.class;
    studentId = id;
    showStudentInfo(id, name, className);
});

$('html').on("appLoadFinished", (eventInfo) => {
    let data = {
        className: session.class,
        output: appOutput
    };
    socket.emit('appInfoReceived', data);
});

$('html').on("click", "#refresh", (eventInfo) => {

    const id = studentId;
    const name = session.name;
    const className = session.class;
    fetchStudentInfo(id, className);
})

$('html').on("click", "#app-close-btn", (eventInfo) => {
    const $appId = $(eventInfo.currentTarget).attr("data-app-id");
    socket.emit('closeApp', {id: studentId, appName: $appId});
    $(eventInfo.currentTarget.parentElement).remove();
});

$('html').on('hostsLoaded', () => {

});

$('html').on("click", "#site-block-btn", (eventInfo)=>{
    let $site = $("#site-input");
    socket.emit('blockWebsite', {
       domain: $site.val()
    });
    $("#blocked-sites-container").append(
        '<div class="site-row">'+
            $site.val()+
            '<span style="float: right;" data-site='+$site.val()+' class="row-btn  bg-danger blocked-site-remove">REMOVE</span>'+
        '</div>'
    );

    $site.val('');
});
//Send on enter press
$("html").on("keydown", '#site-input', (eventInfo) => {
    if (eventInfo.which == 13) {
        eventInfo.preventDefault();
        let $site = $("#site-input");
        socket.emit('blockWebsite', {
            domain: $site.val()
        });
        $("#blocked-sites-container").append(
            '<div class="site-row">'+
                $site.val()+
                '<span style="float: right;" data-site='+$site.val()+' class="row-btn bg-danger blocked-site-remove">REMOVE</span>'+
            '</div>'
        );

        $site.val('');
        return false;
    }
});
$('html').on("click", ".blocked-site-remove", (eventInfo)=>{
    //TODO: Blocked site remove
    $(eventInfo.currentTarget.parentElement).remove();
    const $site = $(eventInfo.currentTarget).attr("data-site");
    console.log($site);
});