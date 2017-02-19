var net = require('net');
var fs = require('fs');
var util = require('util');
var Firebase = require('firebase');
var express = require('express');
var app = express();
var CronJob = require('cron').CronJob;

var baseURL = "https://burning-torch-8945.firebaseio.com";
var globalRef = new Firebase(baseURL);
var deviceRef = new Firebase(baseURL + '/devices');
var modesRef = new Firebase(baseURL + '/modes');
var triggersRef = new Firebase(baseURL + '/triggers');
var sensorsRef = new Firebase(baseURL + '/sensors');
var fifo = '/tmp/fromnode';

deviceRef.authWithPassword({
    email    : process.env.fbEmail,
    password : process.env.fbPass
});

var modes = [];
var triggers = [];
var sensors = [];
var devices = [];
var writeData = "";

// Listen for changed devices
deviceRef.on("child_changed", deviceCallback);
deviceRef.on("value", devicesCallback);
modesRef.on("value", modesCallback);
triggersRef.on("value", triggersCallback);
sensorsRef.on("value", sensorsCallback);

// Reset the firebase connection every 15 seconds
new CronJob('*/15 * * * * *', connectionCallback, null, true);

// Listen for sensor readings
var client = net.createConnection("/tmp/tonode");
client.on("data", tokCallback);

function connectionCallback() {
    deviceRef.off("child_changed", deviceCallback);
    deviceRef.on("child_changed", deviceCallback);
}

function tokCallback(data) {
    var string = new Buffer(data).toString('ascii');
    if(string == "end") {
        sendTik();
    } else {
        var sensor = string.split(',');
        if(sensor[0] == 'S') {
            var sensorRef = new Firebase(baseURL + '/sensors/' + sensor[1]);
            sensorRef.update({ value: sensor[2] });
        }
    }
}

function sendTik() {
    var ms = Date.now() + 100;
    while (Date.now() < ms) {}
    writeToFifo(writeData + "end;");
    writeData = "";
}

function deviceCallback(snap, prevChildKey) {
    if (!!snap.val()) {
        var device = snap.val();
        if(device.type == 0) {
            writeData += device.type + ',' + device.id + ',' + device.state + ',;';
        }
    }
}

function devicesCallback(snap) {
    if (!!snap.val()) {
        devices = snap.val();
    }
}

function modesCallback(snap) {
    if (!!snap.val()) {
        modes = snap.val();
    }
}

function triggersCallback(snap) {
    if (!!snap.val()) {
        triggers = snap.val();
    }
}

function sensorsCallback(snap) {
    if (!!snap.val()) {
        sensors = snap.val();
        executeTriggered(getTriggered());
    }
}

function executeTriggered(triggeredTriggers) {
    for(i = 0; i < triggeredTriggers.length; i++) {
        var trigger = triggeredTriggers[i];
        console.log('Trigger: "' + trigger.name + '" fired');
        for(j = 0; j < trigger.modes.length; j++) {
            var mode = getModeByID(trigger.modes[j].id);
            if(!!mode) {
                for(k = 0; k < mode.devices.length; k++) {
                    var modeDevice = mode.devices[k];
                    var device = getDeviceByID(modeDevice.id);
                    device.state = modeDevice.stateOn;
                }
            }
        }
    }
    globalRef.update({
        devices: devices,
        version: Date.now()
    });
}

app.get('/', function (req, res) {
    res.send("ok!")
});

app.get('/sensors/:sensorId/value/:sensorValue', function (req, res) {
    var sensorRef = new Firebase(baseURL + '/sensors/' + req.params.sensorId);
    sensorRef.update({ value: req.params.sensorValue });
    res.send("ok!: " + req.params.sensorId + " ," + req.params.sensorValue);
});

app.listen(3000, function () {
    console.log('Node listening on port 3000!')
});


function getTriggered() {
    var triggeredTriggers = [];
    for(i = 0; i < triggers.length; i++) {
        if(isWithinTimeBoundaries(triggers[i])) {
            var triggerSensors = triggers[i].sensors;
            for(j = 0; j < triggerSensors.length; j++) {
                var triggered = 0;
                for(k = 0; k < sensors.length; k ++) {
                    if(triggerSensors[j].id == sensors[k].id && isTriggered(triggerSensors[j], sensors[k])) {
                        ++triggered;
                    }
                }
                if(triggerSensors.length == triggered) {
                    triggeredTriggers.push(triggers[i]);
                }
            }
        }
    }
    return triggeredTriggers;
}

function isWithinTimeBoundaries(trigger) {
    var timeAfterArray = trigger.timeAfter.split(':');
    var timeBeforeArray = trigger.timeBefore.split(':');
    var timeAfterSec = (parseInt(timeAfterArray[0]) * 3600) + (parseInt(timeAfterArray[1]) * 60);
    var timeBeforeSec = (parseInt(timeBeforeArray[0]) * 3600) + (parseInt(timeBeforeArray[1]) * 60);

    var dt = new Date();
    var secs = dt.getSeconds() + (60 * (dt.getMinutes() + (60 * (dt.getHours() + 2) )));

    if(timeBeforeSec < timeAfterSec) {
        return !!(secs <= timeBeforeSec || secs >= timeAfterSec);
    } else {
        return !!(secs <= timeBeforeSec && secs >= timeAfterSec);
    }
}

function isTriggered(triggerSensor, sensor) {
    var isTriggered = false;
    switch(triggerSensor.triggerComperation) {
        case '=':
        case '==':
            isTriggered = (sensor.value == triggerSensor.triggerValue);
            break;

        case '!=':
            isTriggered = (sensor.value != triggerSensor.triggerValue);
            break;

        case '===':
            isTriggered = (sensor.value === triggerSensor.triggerValue);
            break;

        case '!==':
            isTriggered = (sensor.value !== triggerSensor.triggerValue);
            break;

        case '>':
            isTriggered = (sensor.value > triggerSensor.triggerValue);
            break;

        case '>=':
            isTriggered = (sensor.value >= triggerSensor.triggerValue);
            break;

        case '<':
            isTriggered = (sensor.value < triggerSensor.triggerValue);
            break;

        case '<=':
            isTriggered = (sensor.value <= triggerSensor.triggerValue);
            break;

        default:
            isTriggered = false;
            break;
    }
    return isTriggered;
}


function getDeviceByID(id) {
    var device = false,
        length = devices.length;
    for (i = 0; i < length; i++) {
        if(devices[i].id == id) {
            device = devices[i];
            break;
        }
    }
    return device;
}

function getModeByID(id) {
    var mode = false,
        length = modes.length;
    for (i = 0; i < length; i++) {
        if(modes[i].id == id) {
            mode = modes[i];
            break;
        }
    }
    return mode;
}

function getSensorByID(id) {
    var sensor = false,
        length = sensors.length;
    for (i = 0; i < length; i++) {
        if(sensors[i].id == id) {
            sensor = sensors[i];
            break;
        }
    }
    return sensor;
}

function writeToFifo(data) {
    fs.open(fifo, 'w', function(err, fd) {
        if(err) {
            if(fd) {
                fs.close(fd);
            }
        } else {
            if(fd) {
                fs.write(fd, data, function (err, written, buf) {
                    if(err) {
                        console.log('FIFO Write: ' + err);
                        fs.close(fd);
                        if(buf == "end;") {
                            writeToFifo("end;");
                        }
                    }
                    else if(written !== data.length) {
                        console.log('FIFO Write: failed, sent: ' + data + ' wrote: ' + data.substring(0, written));
                        fs.close(fd);
                    } else {
                        if(data != "end;") {
                            console.log('FIFO Write: "' + data + '" successful');
                        }
                        fs.close(fd);
                    }
                });
            }
        }
    });

}
