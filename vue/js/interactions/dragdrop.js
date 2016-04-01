//@prepros-prepend ../vendor/interact.min.js

window.currentDraggable = false;
interact('.draggable')
    .draggable({
        autoScroll: true,
        restrict: {
            restriction: 'body'
        },
        onstart: function (event) {
            event.target.classList.add('draggable--dragging');
            window.currentDraggable = event.target.getAttribute('data-device-id');
        },
        onmove: function(event) { dragMoveListener(event, false); },
        onend: function (event) {
            event.target.classList.add('draggable--revert');
            dragMoveListener(event, true);
            event.target.classList.remove('draggable--dragging');
            setTimeout(function() {
                event.target.classList.remove('draggable--revert');
            }, 100);
            window.currentDraggable = false;
        }
    })
    .allowFrom('.draggable__handle');

interact('.dropzone--mode').dropzone({
    accept: '.draggable--device',
    overlap: 0.75,
    ondragenter: function (event) {
        event.target.classList.add('dropzone--ontarget');
    },
    ondrop: function (event) {
        if(window.currentDraggable) {
            var device = window.vue.devices[window.currentDraggable],
                newModeDevices = window.vue.newMode.devices,
                exists = false,
                length = newModeDevices.length;

            for (i = 0; i < length; i++) {
                if(window.currentDraggable == newModeDevices[i].id) {
                    exists = true;
                    break;
                }
            }
            if(!exists) {
                newModeDevices.push(
                    {
                        id: device.id,
                        type: device.type,
                        stateOn: device.state,
                        stateOff: (!device.state ? 1 : 0)
                    }
                );
            }
        }
    },
    ondragleave: function (event) {
        event.target.classList.remove('dropzone--ontarget');
    },
    ondropdeactivate: function (event) {
        event.target.classList.remove('dropzone--ontarget');
    }
});


interact('.dropzone--trigger').dropzone({
    accept: '.draggable--trigger',
    overlap: 0.75,
    ondragenter: function (event) {
        event.target.classList.add('dropzone--ontarget');
    },
    ondrop: function (event) {
        if(window.currentDraggable) {
            var item = null, newModeItems = null;
            if(event.relatedTarget.classList.contains('draggable--sensor')) {
                item = window.vue.sensors[window.currentDraggable];
                newModeItems = window.vue.newTrigger.sensors;
            }

            if(event.relatedTarget.classList.contains('draggable--mode')) {
                item = window.vue.modes[window.currentDraggable];
                newModeItems = window.vue.newTrigger.modes;
            }
                var exists = false,
                length = newModeItems.length;

            for (i = 0; i < length; i++) {
                if(window.currentDraggable == newModeItems[i].id) {
                    exists = true;
                    break;
                }
            }
            if(!exists) {
                if(event.relatedTarget.classList.contains('draggable--sensor')) {
                    newModeItems.push({
                        id: item.id,
                        triggerComperation: '==',
                        triggerValue: item.value
                    });
                }
                if(event.relatedTarget.classList.contains('draggable--mode')) {
                    newModeItems.push({
                        id: item.id,
                        triggerValue: true
                    });
                }
            }
        }
    },
    ondragleave: function (event) {
        event.target.classList.remove('dropzone--ontarget');
    },
    ondropdeactivate: function (event) {
        event.target.classList.remove('dropzone--ontarget');
    }
});

function dragMoveListener (event, isZero) {
    var target = event.target,
        x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
        y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    var scale = 0.9;

    if(isZero) {
        x = y = 0;
        scale = 1.0;
        target.style.zIndex = 1;
    } else {
        target.style.zIndex = 10;
    }

    // translate the element
    target.style.webkitTransform =
        target.style.transform =
            'translate3d(' + x + 'px, ' + y + 'px, 1px) scale(' + scale + ')';

    // update the posiion attributes
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
}