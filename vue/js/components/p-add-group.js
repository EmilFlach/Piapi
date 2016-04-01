Vue.component('p-add-mode', {
    props: ['newMode', 'newModePhase', 'newModeStep', 'edit'],
    template: '#add-mode-template',

    computed: {
        // Compute the classes required, mostly dependent on the edit variable
        gridClasses: function () {
            return {
                'pure-u-1' : true,
                'pure-u-lg-1-2' : this.edit,
                'pure-u-sm-1-2' : !this.edit,
                'pure-u-md-1-3' : !this.edit,
                'pure-u-lg-1-4' : !this.edit
            }
        }
    },
    methods: {
        // Computed classes, but then for specific items
        itemClasses: function (d) {
            return {
                'item' : true,
                'item__toggle' : true,
                'item__toggle--mode': this.newModePhase == 0,
                'item__toggle--mode--on' : d.stateOn && this.newModePhase == 1 || d.stateOff && this.newModePhase == 2,
                'item__toggle--mode--off' : !d.stateOn && this.newModePhase == 1 || !d.stateOff && this.newModePhase == 2
            }
        },

        /*
         *   Mode Device item functions
         */

        // Set the state of the device depending on the state oft he mode
        setModeDeviceState: function (d, i) {
            if(this.newModePhase != 0) {
                var device = getDeviceByID(d.id);
                switch(device.type) {
                    case 0:
                        if(i == 1) {
                            d.stateOn = (!d.stateOn ? 1 : 0);
                        }
                        if(i == 2) {
                            d.stateOff = (!d.stateOff ? 1 : 0);
                        }
                        break;
                    default:
                        break;
                }
            }
        },

        // Remove a mode device
        removeNewModeDevice: function (d) {
            this.newMode.devices.$remove(d);
        },

        /*
         * Functions to manage the state of the new mode creation
         */

        // Continue to the next phase
        nextNewModePhase: function() {
            var p = this.newModePhase;
            if(p < 2) {
                p = p + 1;
            } else {
                p = 0;
            }
            this.newModePhase = p;
        },

        // Go back to the previous phase
        prevNewModePhase: function() {
            var p = this.newModePhase;
            if(p > 0) {
                p = p - 1;
            } else {
                p = 0;
            }
            this.newModePhase = p;
        },

        // Save the new mode in its current form
        saveNewMode: function() {
            createNewMode();
            updateState();
        },

        // Delete the new mode in its current form
        deleteNewMode: function () {
            deleteNewMode();
            updateState();
        },

        /*
         * Helper functions
         */

        //  helps to access getDeviceByID from the html
        getDeviceByID: function(id) {
            return getDeviceByID(id);
        }
    }
});

function createNewMode() {
    if(!!vue.newMode.name && !!vue.newMode.devices.length) {
        vue.modeValidation = '';
        vue.modes.push({
            id: vue.modes.length,
            name: vue.newMode.name,
            devices: vue.newMode.devices
        });
        deleteNewMode();
        return true;
    } else {
        vue.modeValidation = 'Check your input';
        return false;
    }
}

function deleteNewMode() {
    vue.newMode.devices = [];
    vue.newMode.name = '';
    vue.newModePhase = 0;
}
