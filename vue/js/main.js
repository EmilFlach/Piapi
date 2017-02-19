var baseURL = "https://burning-torch-8945.firebaseio.com/";
var fb = new Firebase(baseURL);
var deviceRef = new Firebase(baseURL + '/devices');
var modesRef = new Firebase(baseURL + '/modes');
var triggersRef = new Firebase(baseURL + '/triggers');
var sensorsRef = new Firebase(baseURL + '/sensors');


Vue.config.debug = true;
window.vue = new Vue({
    el: '#app',
    data: {

        // Global data
        devicesReady: false,
        modesReady: false,
        triggersReady: false,
        sensorsReady: false,
        edit: false,
        disabled: false,
        loggedIn: false,
        knowsPermissions: false,
        version: 0,
        devices: [],
        modes: [],
        sensors: [],
        triggers: [],

        // New mode data
        newMode: {
            name: '',
            devices: []
        },
        newModePhase: 0,
        newModeStep: [
            'Add devices',
            'ON mode states',
            'OFF mode states'
        ],
        modeValidation: '',


        // New sensor data
        newTrigger: {
            name: '',
            sensors: [],
            modes: [],
            timeAfter: '00:00',
            timeBefore: '23:59'
        },
        newTriggerPhase: 0,
        newTriggerStep: [
            'Add sensors',
            'Set trigger values',
            'Add modes to trigger',
            'Set mode value'
        ],
        triggerValidation: ''

    },
    computed: {
      ready: function () {
          return this.devicesReady && this.modesReady && this.triggersReady && this.sensorsReady;
      }
    },
    methods: {
        toggleEditMode: function () {
            this.edit = !this.edit;
            if(this.edit) {
                decoupleData();
            } else {
                initializeData();
            }
        },
        login: function () {
            loginPopUp();
        }
    },
    created: function() {
        initializeData()
    },
    ready: function () {
        this.loggedIn = (!!fb.getAuth());
    }
});

function updateState() {
    var v = window.vue;
    if(v.loggedIn) {
        decoupleData();
        v.disabled = true;
        v.version = Date.now();
        fb.update({
            devices: v.devices,
            modes: v.modes,
            sensors: v.sensors,
            triggers: v.triggers,
            version: v.version
        }, function (err) {
            if(err) {
                swal({
                    title: 'Failed',
                    text: 'Something went wrong!',
                    timer: 1000,
                    type: 'error',
                    showConfirmButton: false,
                    allowOutsideClick: true
                });
            } else {
                initializeData();
                v.disabled = false;
            }
        });
    } else {
        if(!v.knowsPermissions) {
            loginPopUp();
            v.knowsPermissions = true;
        }
    }
}

function getDeviceByID(id) {
    var device = false,
        devices = window.vue.devices,
        length = devices.length;
    for (i = 0; i < length; i++) {
        if(devices[i].id == id) {
            device = devices[i];
            break;
        }
    }
    return device;
}

function getSensorByID(id) {
    var sensor = false,
        sensors = window.vue.sensors,
        length = sensors.length;
    for (i = 0; i < length; i++) {
        if(sensors[i].id == id) {
            sensor = sensors[i];
            break;
        }
    }
    return sensor;
}

function getModeByID(id) {
    var mode = false,
        modes = window.vue.modes,
        length = modes.length;
    for (i = 0; i < length; i++) {
        if(modes[i].id == id) {
            mode = modes[i];
            break;
        }
    }
    return mode;
}

function initializeData() {
    deviceRef.on("value", devicesCallback);
    modesRef.on("value", modesCallback);
    triggersRef.on("value", triggersCallback);
    sensorsRef.on("value", sensorsCallback);
}

function decoupleData() {
    deviceRef.off("value", devicesCallback);
    modesRef.off("value", modesCallback);
    triggersRef.off("value", triggersCallback);
    sensorsRef.off("value", sensorsCallback);
}


function devicesCallback(snap) {
    if (!!snap.val()) {
        vue.devices = snap.val();
        initSliders();
    }
    vue.devicesReady = true;
}

function modesCallback(snap) {
    if (!!snap.val()) {
        vue.modes = snap.val();
    }
    vue.modesReady = true;
}

function triggersCallback(snap) {
    if (!!snap.val()) {
        vue.triggers = snap.val();
    }
    vue.triggersReady = true;
}

function sensorsCallback(snap) {
    if (!!snap.val()) {
        vue.sensors = snap.val();
    }
    vue.sensorsReady = true;
}

function loginPopUp() {
    swal({
            title: 'Login',
            html: '<p><input id="login-email" class="swal__input" placeholder="E-mail" type="text" name="username"></p><p><input id="login-password" type="password" class="swal__input" placeholder="password"></p>',
            showCancelButton: true,
            closeOnConfirm: false,
            allowOutsideClick: false,
            buttonsStyling: false,
            confirmButtonText: 'Login',
            confirmButtonClass: 'swal__confirm',
            cancelButtonClass: 'swal__cancel'
        },
        function() {
            fb.authWithPassword({
                email    : document.getElementById('login-email').value,
                password : document.getElementById('login-password').value
            }, function(error, authData) {
                if (!error) {
                    swal({
                        title: 'Logged in',
                        text: 'Congratulations on logging in!',
                        timer: 1000,
                        type: 'success',
                        showConfirmButton: false,
                        allowOutsideClick: true
                    });
                    window.vue.loggedIn = (!!fb.getAuth());
                } else {
                    swal({
                        title: 'Failed',
                        text: 'Something went wrong!',
                        timer: 1000,
                        type: 'error',
                        showConfirmButton: false,
                        allowOutsideClick: true
                    });
                }
            });
        })
}