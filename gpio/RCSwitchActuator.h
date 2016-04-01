/*
    Written by Emil Flach in 2016
*/

#ifndef _RCSwitchActuator_h
#define _RCSwitchActuator_h

#include <wiringPi.h>
#include "RCSwitch.h"
#include <stdlib.h> 
#include <stdio.h>
#include <ctype.h>
#include <string.h>
#include <signal.h>
#include "communication.h"

int registerRCSwitchClient(long offValue, long onValue);
int registerRCSwitch(int transmitPin);
void setRCSwitchClient(void * data, int state);

#endif

