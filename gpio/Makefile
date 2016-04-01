all: main

main: RCSwitch.o communication.o RCSwitchActuator.o main.o
	$(CXX) $(CXXFLAGS) $(LDFLAGS) $+ -o $@ -lwiringPi

clean:
	$(RM) *.o main
