window.currentSlider = false;
window.sliders = [];

interact('.item__sliderhandle')
    .draggable({
        //restrict: {
        //    restriction: "parent",
        //    endOnly: false,
        //    elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
        //},
        onstart: function (event) {
            window.currentSlider = event.target.parentElement.parentElement.getAttribute('data-device-id');
                var width = event.target.parentElement.offsetWidth;
                var percentage = parseInt(event.target.parentElement.classList[2].substring('item__slider--'.length)) / 100;
                window.sliders[window.currentSlider] = percentage * width;
        },
        onmove: function(event) {
            dragSliderListener(event, false);
        },
        onend: function (event) {
            window.currentSlider = false;
            updateState();
        }
    });

function initSliders() {
    setTimeout(function() {
        var itemSliders = document.getElementsByClassName('item__slider');
        for(var i = 0; i < itemSliders.length; i++) {
            itemSliders[i].addEventListener("click", clickSlider, false);
        }
    }, 100);
}


function dragSliderListener(event) {
    var target = event.target.parentElement,
        x = (window.sliders[window.currentSlider] || 0) + event.dx,
        percentage = Math.round((x / target.offsetWidth) * 100);

    if(percentage < 0) {
        percentage = 0;
    } else if(percentage > 100) {
        percentage = 100;
    }

    if(x < 0) {
        x = 0;
    } else if(x > this.offsetWidth) {
        x = this.offsetWidth;
    }

    window.vue.devices[window.currentSlider].state = percentage;
    window.sliders[window.currentSlider] = x;
}

function clickSlider(e) {
    var x = e.clientX - this.getBoundingClientRect().left,
        percentage = Math.round((x / this.offsetWidth) * 100),
        deviceID = this.parentElement.getAttribute('data-device-id');

    if(percentage < 0) {
        percentage = 0;
    } else if(percentage > 100) {
        percentage = 100;
    }

    if(x < 0) {
        x = 0;
    } else if(x > this.offsetWidth) {
        x = this.offsetWidth;
    }

    window.vue.devices[deviceID].state = percentage;
    window.sliders[deviceID] = x;
    updateState();
}

