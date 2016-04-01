/*
    Written by Emil Flach in 2016
*/

#include "RCSwitchActuator.h"


/*
 * RC Switch variables
 */
 RCSwitch rcSwitch; 
 int protocol = 24;
 int transmitPin = 1;

 /*
  * The struct which carries all the specific
  * information we need to control the switch
  */
typedef struct RCSwitchClient{
    long offValue;
    long onValue;
} RCSwitchClient; 


/*
 * RC Switch initialization function, 
 * not really necessary but looks nice
 * @param transmitPin number of the pin
 */
int registerRCSwitch(int transmitPin) {
    rcSwitch = RCSwitch();
    rcSwitch.enableTransmit(transmitPin);
    rcSwitch.setRepeatTransmit(5);
}


/*
 * The function that gets called when a switch needs to be set
 * @param data a pointer to an RCSwitchClient
 * @param state the state which should be written, in this case on or off
 */
void setRCSwitchClient(void * data, int state) {
    RCSwitchClient * client = (RCSwitchClient *) data;
    if(state == 0) {
        rcSwitch.send(client->offValue, protocol);
    } else {
        rcSwitch.send(client->onValue, protocol);
    }
}


/*
 * This line is required to we can point to the setRCSwitchClient
 * It creates a function pointer which can be added to the actuators
 */
void (*setRCSwitchClientPtr)(void *,int) = &setRCSwitchClient;


/*
 * This function initializes the RCSwitchClient with all required data
 * Then the newly created RCSwitchClient gets added to the actuators,
 * along with setRCSwitchClient's function pointer.
 * When this specific actuator gets called, the specified function will be called
 * and it will be supplied with data defined in this function 
 * This function returns the integer at which this actuator resides
 *
 * @param offValue the code required to turn off a device
 * @param onValue the code require to turn on a device
 * 
 * @return int client position in actuators array
 */
int registerRCSwitchClient(long offValue, long onValue) {
    RCSwitchClient * client = (RCSwitchClient *) malloc(sizeof(RCSwitchClient));
    client->offValue = offValue;
    client->onValue = onValue;

    actuators[actuatorCount].function = setRCSwitchClientPtr;
    actuators[actuatorCount].data = client;

    return actuatorCount++;
}