Vue.component('p-items', {
    props: ['items', 'type', 'edit', 'disabled'],
    template: '#item-template',

    computed: {
        // Compute the classes required, mostly dependent on the edit variable

    },
    methods: {

        // Computed classes, but then for specific items
        itemClasses: function (item) {
            return {
                'item' : true,
                'item__toggle--on' : itemState(item),
                'item__toggle--disabled' : this.disabled,
                'item--edit' : this.edit,
                'item__toggle' : this.type == 'devices' || this.type == 'modes',
                'item__sensor' : this.type == 'sensors',
                'item__trigger' : this.type == 'triggers'
            }
        },

        gridClasses: function (item) {
            if(item.type == 1 && !this.edit) {
                return {
                    'pure-u-1' : true,
                    'pure-u-lg-1-2': true
                }
            } else {
                return {
                    'pure-u-1' : this.edit,
                    'pure-u-lg-1-2' : this.edit,
                    'pure-u-md-1' : this.edit,
                    'pure-u-sm-1-2' : this.edit,
                    'pure-u-1-2' : !this.edit,
                    'pure-u-md-1-3' : !this.edit,
                    'pure-u-lg-1-4' : !this.edit,
                    'draggable' : true,
                    'draggable--mode' : this.type == 'modes',
                    'draggable--device' : this.type == 'devices',
                    'draggable--sensor' : this.type == 'sensors',
                    'draggable--trigger' : this.type == 'sensors' || this.type == 'modes'
                }
            }
        },


        sliderClass: function(item) {
            return 'item__slider--' + item.state;
        },


        /*
         *   item functions
         */

        setItemState: function (item) {
            if(item.devices) {
                setModeState(item);
            } else if(item.value || !!item.sensors) {
                return false;
            } else {
                setDeviceState(item);
            }
        },

        editItem: function (item) {
            if(!!item.devices) {
                window.vue.newMode = {
                    name: item.name,
                    devices: item.devices
                };
                this.items.$remove(item);
            } else if(!!item.sensors) {
                window.vue.newTrigger = {
                    name: item.name,
                    modes: item.modes,
                    sensors: item.sensors,
                    timeAfter: item.timeAfter,
                    timeBefore: item.timeBefore
                };
                this.items.$remove(item);
            } else {
                item.editable = !item.editable;
                if(!item.editable) {
                    console.log(item);
                    updateState();
                }
            }
        }
    }
});

function toggle(device, state) {
    if(window.vue.edit) { return; }
    device.state = (!device.state ? 1 : 0);
    if(state !== false) {
        device.state = state;
    }
}


// Returns the state of either a mode or a device
function itemState(item) {
    if(item.devices) {
        var output = true;
        var gds = item.devices;
        var length = gds.length;
        for (var i = 0; i < length; i++) {
            var d = getDeviceByID(gds[i].id);
            if(d.state != gds[i].stateOn) {
                output = false;
                break;
            }
        }
        return output;
    } else if (item.value){
        return false;
    } else {
        return item.state;
    }
}

// Device item function to set state
function setDeviceState(device) {
    switch(device.type) {
        case 0:
            toggle(device, false);
            break;
        default:
            break;
    }
    updateState();
}

// Mode item function to set state
function setModeState(mode) {
    if(this.edit) { return; }
    var state = itemState(mode);
    var gds = mode.devices;
    var length = gds.length;
    for (var i = 0; i < length; i++) {
        var d = getDeviceByID(gds[i].id);
        if(!state) {
            toggle(d, gds[i].stateOn);
        } else {
            toggle(d, gds[i].stateOff);
        }
    }
    updateState();
}
