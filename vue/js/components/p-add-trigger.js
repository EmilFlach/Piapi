Vue.component('p-add-trigger', {
    props: ['newTrigger', 'newTriggerPhase', 'newTriggerStep', 'edit'],
    template: '#add-trigger-template',

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
                'item__toggle--mode': this.newTriggerPhase < 3,
                'item__toggle--mode--on' : d.triggerValue && this.newTriggerPhase == 3,
                'item__toggle--mode--off' : !d.triggerValue && this.newTriggerPhase == 3
            }
        },

        /*
         *   Trigger Device item functions
         */

        // Set the state of the device depending on the state oft he group
        toggleTriggerModeState: function (d) {
            if(this.newTriggerPhase == 3) {
                d.triggerValue = !d.triggerValue;
            }
        },

        // Remove a sensor
        removeNewTriggerSensor: function (d) {
            this.newTrigger.sensors.$remove(d);
        },

        // Remove a mode
        removeNewTriggerMode: function (d) {
            this.newTrigger.modes.$remove(d);
        },

        /*
         * Functions to manage the state of the new group creation
         */

        // Continue to the next phase
        nextNewTriggerPhase: function() {
            var p = this.newTriggerPhase;
            if(p < this.newTriggerStep.length - 1) {
                p = p + 1;
            } else {
                p = 0;
            }
            this.newTriggerPhase = p;
        },

        // Go back to the previous phase
        prevNewTriggerPhase: function() {
            var p = this.newTriggerPhase;
            if(p > 0) {
                p = p - 1;
            } else {
                p = 0;
            }
            this.newTriggerPhase = p;
        },

        // Save the new group in its current form
        saveNewTrigger: function() {
            createNewTrigger();
            updateState();
        },

        // Delete the new group in its current form
        deleteNewTrigger: function () {
            deleteNewTrigger();
            updateState();
        },

        /*
         * Helper functions
         */

        //  helps to access getDeviceByID from the html
        getDeviceByID: function(id) {
            return getDeviceByID(id);
        },

        //  helps to access getSensorByID from the html
        getSensorByID: function(id) {
            return getSensorByID(id);
        },

        //  helps to access getSensorByID from the html
        getModeByID: function(id) {
            return getModeByID(id);
        }
    }
});

function createNewTrigger() {
    var vue = window.vue;
    if(!!vue.newTrigger.name && !!vue.newTrigger.sensors.length && !!vue.newTrigger.modes.length) {
        vue.triggerValidation = '';

        vue.triggers.push({
            name: vue.newTrigger.name,
            sensors: vue.newTrigger.sensors,
            modes: vue.newTrigger.modes,
            timeAfter: vue.newTrigger.timeAfter,
            timeBefore: vue.newTrigger.timeBefore
        });

        deleteNewTrigger();
        return true;
    } else {
        vue.triggerValidation = 'Check your input';
        return false;
    }
}

function deleteNewTrigger() {
    var v = window.vue;
    v.newTrigger.modes = [];
    v.newTrigger.sensors = [];
    v.newTrigger.timeAfter = '00:00';
    v.newTrigger.timeBefore = '23:59';
    v.newTrigger.name = '';
    v.newTriggerPhase = 0;
}
