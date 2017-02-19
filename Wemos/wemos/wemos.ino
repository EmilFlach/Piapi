/*
    Simple HTTP get webclient test
*/

#include <ESP8266WiFi.h>
#include <WiFiClient.h>

const char* ssid     = "GKI38-Emil";
const char* password = "vraaghetjemoeder";

const char* host = "192.168.1.150";
const int httpPort = 3000;
const int pirPin = 5; // This corresponds to D1
int pir = 0;
int prevPir = 0;

void setup() {
  Serial.begin(115200);
  pinMode(pirPin, INPUT);

  delay(100);

  // We start by connecting to a WiFi network

  Serial.println();
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  delay(500);
  int pir = digitalRead(pirPin);
  Serial.print("Pir value: ");
  Serial.println(pir);
  if (pir != prevPir) {
    if (pir == HIGH) {
      Serial.println("Motion");
      setSensor(1, 1);
    } else {
      Serial.println("No motion");
      setSensor(1, 0);
    }
  }
  prevPir = pir;
}

void setSensor(int id, int value) {
  WiFiClient client;
  if (!client.connect(host, httpPort)) {
    Serial.println("connection failed");
    return;
  }

  String strId = String(id);
  String strValue = String(value);
  String url = "/sensors/" + strId + "/value/" + strValue;
  Serial.print("Requesting URL: ");
  Serial.println(url);

  // This will send the request to the server
  client.print(String("GET ") + url + " HTTP/1.1\r\n" +
               "Host: " + host + "\r\n" +
               "Connection: close\r\n\r\n");

}
