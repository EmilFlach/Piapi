/*
    Written by Emil Flach in 2016
*/

#include "communication.h"
#include "RCSwitchActuator.h"

int main(int argc, char *argv[]) {
    initCommunication();

    registerRCSwitch(1); // RCSwitch initialized with pin 1
    registerSensor(0, 2); // [0] Motion sensor

    registerRCSwitchClient(6978151, 6978159); // [0] Desk lamp
    registerRCSwitchClient(6978147, 6978155); // [1] Screen
    registerRCSwitchClient(6978149, 6978157); // [2] Speaker
    registerRCSwitchClient(6978150, 6978158); // [3] Work lamp

    runCommunication();
    return 0;
}

