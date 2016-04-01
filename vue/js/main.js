var baseURL = "https://burning-torch-8945.firebaseio.com/";
var fb = new Firebase(baseURL);

Vue.config.debug = true;
window.vue = new Vue({
    el: '#app',
    data: {

        // Global data
        ready: false,
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
    methods: {
        toggleEditMode: function () {
            this.edit = !this.edit;
            if(this.edit) {
                fb.off("value", initializeData);
            } else {
                fb.on("value", initializeData);
            }
        },
        login: function () {
            loginPopUp();
        }
    },
    created: function() {
        fb.on("value", initializeData);
    },
    ready: function () {
        this.loggedIn = (!!fb.getAuth());
    }
});

function updateState() {
    var v = window.vue;
    if(v.loggedIn) {
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



function initializeData(snap) {
    var v = window.vue;
    if(v.version < snap.val().version) {
        if (!!snap.val().devices) {
            v.devices = snap.val().devices;
        }
        if (!!snap.val().modes) {
            v.modes = snap.val().modes;
        }
        if (!!snap.val().triggers) {
            v.triggers = snap.val().triggers;
        }
        v.version = snap.val().version;
        v.ready = true;
    }
    if(!!snap.val().sensors) {
        v.sensors = snap.val().sensors;
    }
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