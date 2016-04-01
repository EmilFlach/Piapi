/*
    Written by Emil Flach in 2016
*/

#include "communication.h"

/*
 * These variables are available from any file,
 * they are used to store any actuators or sensors
 * which should be part of this communication loop
 */
int sensorCount = 0;
int actuatorCount = 0;
Sensor sensors[MAX_SENSORS]; 
Actuator actuators[MAX_ACTUATORS];


/*
 * The function used to register a sensor with digital output
 * @param id the sensor ID (should not be duplicate)
 * @param pin the pin the sensor is connected to (wiringpi pin)
 * 
 * @return position of the sensor in sensors array
 */
int registerSensor(int id, int pin) {
    pinMode(pin, INPUT);
    sensors[sensorCount].id = id;
    sensors[sensorCount].pin = pin;
    sensors[sensorCount].value = 0;
    return sensorCount++;
}


/*
 * These variables are used to limit the update
 * rate of the sensors. All time is in milliseconds
 */
long ms;
long prevMs;
struct timespec spec;
long sensorInterval = 200;


/*
 * This function is used to set the current  
 * milliseconds of the day to the passed in pointer
 * @param ref pointer to the variable you want to set
 */
void setMs(long * ref) {
    clock_gettime(CLOCK_REALTIME, &spec);
    * ref = ((spec.tv_sec * 1000) + round(spec.tv_nsec / 1.0e6));
}


/*
 * Variables required for the socket
 * The socket writes to node.js
 */
size_t t;
int s, s2, len;  
struct sockaddr_un local, remote;
char str[MAX_BUF];


/*
 * Variables required for the fifo pipe
 * The fifo pipe reads from node.js
 */
char const * fifo = FIFO_PATH;
int fd;
char buf[MAX_BUF];
int end = 0;


/*
 * This function initializes the connection
 * of the fifo and then wait for the socket connection 
 * to be established. This function blocks until connection is made
 */
void openConnection() {
    // Make the fifo
    mkfifo(fifo, 0666);


    // Initializing socket
    if ((s = socket(AF_UNIX, SOCK_STREAM, 0)) == -1) {
        perror("socket");
        exit(1);
    }
    local.sun_family = AF_UNIX;
    strcpy(local.sun_path, SOCK_PATH);
    unlink(local.sun_path);
    len = strlen(local.sun_path) + sizeof(local.sun_family);
    if (bind(s, (struct sockaddr *)&local, len) == -1) {
        perror("bind");
        exit(1);
    }
    if (listen(s, 5) == -1) {
        perror("listen");
        exit(1);
    }

    // Wait for a connection to exist, then terminate
    int connected = 0;
    while(connected == 0) {

        printf("Waiting for a connection...\n");
        t = sizeof(remote);
        if ((s2 = accept(s, (struct sockaddr *)&remote, &t)) == -1) {
            perror("accept");
            exit(1);
        }

        printf("Connected.\n");

        if(write(s2, "end", 3) < 0) {
            perror("send"); 
        }
        connected = 1;

    }

    // assigning a value prevMs
    setMs(&prevMs);
}


/*
 * exit and init functions
 * handleExit is attached to the closing of the program
 * and should always be called when you want to exit the program
 * By calling this function you are sure all connections are proporly closed
 */
void handleExit(int sig) {
    close(fd);
    close(s2);
    unlink(fifo);
    exit(0);
}

void initCommunication() {
    signal(SIGINT, handleExit);
    umask(0000);
    if(wiringPiSetup() == -1) {
        printf("Wiring Pi initialisation failed\n");
    }
}


/*
 * Function that loops through all sensors
 * and writes them to node via the socket
 */
void writeSensors() {
    int i;
    for(i = 0; i < sensorCount; i++) {
        int sensorState = digitalRead(sensors[i].pin);
        sensors[i].value = sensorState;

        char str[6];
        sprintf(str, "S,%d,%d,", sensors[i].id, sensors[i].value);
        if(write(s2, str, 6) < 0) {
            perror("send"); 
        }
        delay(10);
    }
}


/*
 * Function that loops through all received commands
 * then decodes the commands and finally uses the commands
 * to call specific functions defined in the actuators array
 */
void setClient() {

    // http://linux.die.net/man/3/strtok_r Split a string with 2 delimiters

    char *str1, *str2, *token, *subtoken;
    char *saveptr1, *saveptr2;
    int j;

    for (j = 1, str1 = buf; ; j++, str1 = NULL) {
        token = strtok_r(str1, ";", &saveptr1);

        if (token == NULL) {
            break;
        } else {

            int i = 0;
            int input[3];
            for (str2 = token; ; str2 = NULL) {

                subtoken = strtok_r(str2, ",", &saveptr2);
                if (subtoken == NULL) {
                    // When there are no subtokens but there is a token
                    // this means the command is an ending command
                    // and all communication should terminated
                    end = 1;
                    close(fd);
                    break;
                } else {
                    input[i] = atoi(subtoken);
                    i++;
                }
                

            }

            if(input[1] < actuatorCount) {
                actuators[input[1]].function(actuators[input[1]].data, input[2]);
            }

        }
    }
}


/*
 * A function with a blocking loop that ties the room together by
 * reading from the fifo and writing to the socket. The writing can 
 * only start once the end command has been received and the reading
 * can only be started when the end command has been sent.
 * this results in a tik tok between node.js and this program
 * One can only continue to the next phase when the other confirms they are done
 */
 void runCommunication() {
    openConnection();

    while(1) {

        // A blocking read fifo
        fd = open(fifo, O_RDONLY);

        if(fd != -1) {

            while(end == 0) {
                // Read the fifo and save the length of the read string
                int length = read(fd, buf, MAX_BUF);

                // If the length is 4, the end command has been sent
                if(length == 4) {
                    end = 1;
                    close(fd);

                // If the length is not 3 but more than 0, it a command
                } else if(length > 0) {
                    setClient();

                // If the length is anything else it's a
                // failure and communication should be ended
                } else {
                    end = 1;
                    close(fd);

                }
            }
        }


        // Check wether the time interval has completed
        setMs(&ms);
        if(prevMs - ms < sensorInterval) {

            // Write all the sensors available to write
            writeSensors();

            // A small delay to slow down the tik tok
            delay(100);

            // Update the timer
            setMs(&prevMs);

            // Signal the end of writing
            end = 0;
            if(write(s2, "end", 3) < 0) {
                perror("send"); 
            }

        } else {

            // A small delay to slow down the tik tok
            delay(100);

            // Signal the end of writing
            end = 0;
            if(write(s2, "end", 3) < 0) {
                perror("send"); 
            }

        }

    }
    handleExit(0);
}
