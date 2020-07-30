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
    console.log(stdout.split("\n"));
  });

$("#enter-class").click(function(){
    //TODO: enter class
});

$("#create-class").click(function(){
    //TODO: new class
});