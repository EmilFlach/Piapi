/*
    Written by Emil Flach in 2016
*/

#ifndef _communication_h
#define _communication_h

#include <stdlib.h> 
#include <stdio.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <unistd.h>
#include <signal.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <time.h>
#include <math.h>
#include <wiringPi.h>


#define _POSIX_C_SOURCE 200809L
#define SOCK_PATH "/tmp/tonode"
#define FIFO_PATH "/tmp/fromnode"
#define MAX_BUF 1024
#define MAX_SENSORS 20
#define MAX_ACTUATORS 20

typedef struct Sensor {
    int id;
    int pin;
    int value;
} Sensor;

typedef struct Actuator{
    void (*function)(void *,int);
    void * data;
} Actuator;

extern int actuatorCount;
extern Actuator actuators[MAX_ACTUATORS];

extern int sensorCount;
extern Sensor sensors[MAX_SENSORS];

void openConnection();
void runCommunication();

void setMs(long * ref);
void initCommunication();
void handleExit(int sig);
int registerSensor(int id, int pin);
void writeSensors();
void setClient();

int getActuatorCount();
Actuator * getActuators();

#endif
