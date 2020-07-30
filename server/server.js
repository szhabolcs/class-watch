//import * as cts from './constants';
//import * as io from 'socket.io';
const cts = require('./constants');
const io = require('socket.io')(3000);
const utils = require('./utils');

let classes = [];

function sendError(socket, errorMessage) {
    socket.emit('errorMsg', errorMessage);
}

io.on('connection', (socket) => {

    console.log("connected", socket.id);
    socket.on('createClass', (eventInfo) => {
        console.log("class created");
        const className = eventInfo.className;
        if (classes.hasOwnProperty(className)) {
            sendError(socket, cts.MSG_CLASS_EXISTS);
        } else {
            classes[className] = {
                teacherId: socket.id,
                teacherName: eventInfo.teacherName
            };
            classes[className].students = [];
            socket.join(eventInfo.className);
            socket.emit("createSuccess",
                {
                    name: eventInfo.teacherName,
                    className: className
                });
        }
    });


    socket.on('joinClass', (eventInfo) => {
        if (classes.hasOwnProperty(eventInfo.className)) {
            const studentName = eventInfo.studentName;
            const className = eventInfo.className;
            if (classes[className].teacherName === studentName)
                sendError(socket, cts.MSG_SAME_NAME);
            else if (utils.searchStudentByName(classes[className].students, studentName)) {
                sendError(socket, cts.MSG_STUDENT_EXISTS)
            } else {
                const className = eventInfo.className;
                classes[className].students[socket.id] = {
                    name: eventInfo.studentName
                };
                socket.join(className);
                socket.emit('joinSuccess', {
                    name: studentName,
                    className: className
                });
            }
        } else {
            sendError(socket, cts.MSG_UNKNOWN_CLASS);
        }
    });

    socket.on('leave', (session) => {

        if (session.joined === true) {
            const className = session.class;
            const clientName = session.name;
            if (classes[className].teacherName === clientName)
                delete classes[className];
            else delete classes[className].students[clientName];
        }
    });

    socket.on('disconnecting', (reason) => {
        console.log("Disconnected");
    });

    socket.to("asd").emit('message', "Hello World");
});
