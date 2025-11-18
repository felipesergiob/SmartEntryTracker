#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>

const char *ssid = "VIVOFIBRA-06A6";
const char *password = "i3isPrAaJN";

const char *mqtt_server = "192.168.15.3";
const uint16_t MQTT_PORT = 1883;

#define SENSOR1_PIN 13
#define SENSOR2_PIN 14

WiFiClient espClient;
PubSubClient client(espClient);

int peopleInside = 0;
bool occupied = false;

enum DetectionState
{
  WAITING,
  SENSOR1_ACTIVE,
  SENSOR2_ACTIVE
};

DetectionState currentState = WAITING;
unsigned long sequenceStartTime = 0;
const unsigned long SEQUENCE_TIMEOUT = 2000;

QueueHandle_t eventQueue;

bool isObjectDetected(int sensorPin)
{
  return digitalRead(sensorPin) == LOW;
}

void setup_wifi()
{
  delay(10);
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
    Serial.print(WiFi.status());
  }

  Serial.println("\nWiFi connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void reconnect()
{
  while (!client.connected())
  {
    Serial.print("Connecting to MQTT...");

    String clientId = "ESP32_Entry_" + String((uint32_t)ESP.getEfuseMac(), HEX);

    if (client.connect(clientId.c_str()))
    {
      Serial.println("Connected!");
      client.publish("entry/status", "ESP32 Online");
    }
    else
    {
      Serial.print("Failed, rc=");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

void taskSensors(void *pvParameters)
{
  pinMode(SENSOR1_PIN, INPUT);
  pinMode(SENSOR2_PIN, INPUT);

  bool sensor1Blocked = false;
  bool sensor2Blocked = false;

  while (1)
  {
    bool sensor1DetectsNow = isObjectDetected(SENSOR1_PIN);
    bool sensor2DetectsNow = isObjectDetected(SENSOR2_PIN);

    if (!sensor1Blocked && sensor1DetectsNow)
    {
      sensor1Blocked = true;
      Serial.println(">>> SENSOR 1 DISPAROU");
      
      if (currentState == WAITING)
      {
        currentState = SENSOR1_ACTIVE;
        sequenceStartTime = millis();
        Serial.println("Sensor 1 ativado - aguardando sequencia");
      }
      else if (currentState == SENSOR2_ACTIVE)
      {
        if ((millis() - sequenceStartTime) <= SEQUENCE_TIMEOUT)
        {
          int event = -1;
          xQueueSend(eventQueue, &event, portMAX_DELAY);
          Serial.println("EXIT detectada (S2 -> S1)");
        }
        currentState = WAITING;
      }
    }
    
    if (!sensor2Blocked && sensor2DetectsNow)
    {
      sensor2Blocked = true;
      Serial.println(">>> SENSOR 2 DISPAROU");
      
      if (currentState == WAITING)
      {
        currentState = SENSOR2_ACTIVE;
        sequenceStartTime = millis();
        Serial.println("Sensor 2 ativado - aguardando sequencia");
      }
      else if (currentState == SENSOR1_ACTIVE)
      {
        if ((millis() - sequenceStartTime) <= SEQUENCE_TIMEOUT)
        {
          int event = 1;
          xQueueSend(eventQueue, &event, portMAX_DELAY);
          Serial.println("ENTRY detectada (S1 -> S2)");
        }
        currentState = WAITING;
      }
    }

    if (!sensor1DetectsNow) sensor1Blocked = false;
    if (!sensor2DetectsNow) sensor2Blocked = false;

    if (currentState != WAITING && (millis() - sequenceStartTime) > SEQUENCE_TIMEOUT)
    {
      currentState = WAITING;
      Serial.println("Timeout da sequencia - voltando para WAITING");
    }

    vTaskDelay(pdMS_TO_TICKS(50));
  }
}

void taskMQTT(void *pvParameters)
{
  int event;

  while (1)
  {
    if (!client.connected())
    {
      reconnect();
    }
    client.loop();

    if (xQueueReceive(eventQueue, &event, 0) == pdTRUE)
    {
      if (event == 1)
      {
        peopleInside++;
        occupied = (peopleInside > 0);

        unsigned long timestamp = millis();

        char msgPeople[20];
        snprintf(msgPeople, 20, "%d", peopleInside);

        client.publish("entry/event", "ENTRY");
        client.publish("entry/count", msgPeople);
        client.publish("entry/occupied", occupied ? "true" : "false");

        char jsonMsg[150];
        snprintf(jsonMsg, 150,
                 "{\"type\":\"entry\",\"people\":%d,\"timestamp\":%lu,\"occupied\":%s}",
                 peopleInside, timestamp, occupied ? "true" : "false");
        client.publish("entry/data", jsonMsg);

        Serial.printf("ENTRY - People: %d\n", peopleInside);
      }
      else if (event == -1)
      {
        peopleInside--;
        if (peopleInside < 0)
          peopleInside = 0;

        occupied = (peopleInside > 0);

        unsigned long timestamp = millis();

        char msgPeople[20];
        snprintf(msgPeople, 20, "%d", peopleInside);

        client.publish("entry/event", "EXIT");
        client.publish("entry/count", msgPeople);
        client.publish("entry/occupied", occupied ? "true" : "false");

        char jsonMsg[150];
        snprintf(jsonMsg, 150,
                 "{\"type\":\"exit\",\"people\":%d,\"timestamp\":%lu,\"occupied\":%s}",
                 peopleInside, timestamp, occupied ? "true" : "false");
        client.publish("entry/data", jsonMsg);

        Serial.printf("EXIT - People: %d\n", peopleInside);
      }
    }

    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

void setup()
{
  Serial.begin(115200);
  delay(1000);

  Serial.println("\nSmartEntryTracker - Starting...");

  setup_wifi();

  client.setServer(mqtt_server, MQTT_PORT);
  reconnect();

  eventQueue = xQueueCreate(10, sizeof(int));

  xTaskCreatePinnedToCore(
      taskSensors,
      "Sensors",
      4096,
      NULL,
      2,
      NULL,
      0);

  xTaskCreatePinnedToCore(
      taskMQTT,
      "MQTT",
      4096,
      NULL,
      2,
      NULL,
      1);

  Serial.println("System started!");
}

void loop()
{
  vTaskDelay(portMAX_DELAY);
}
