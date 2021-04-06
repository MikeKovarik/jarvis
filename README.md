# jarvis

DIY home automation.

* LAN hub server
  * implements Google Home API (actions on google)
  * running on raspberry pi in local network
  * scans for any IOT device on the network, collects their state, sends commands
  * autoupdate from github repo triggered by webhooks
* IOT device firmware
  * ESP32 & ESP8266
* proxy tunnel
  * Exposes LAN hub to the internet (needed for GHome)
  * Proxy forwards requests to LAN throuh tunnel opened from LAN hub's side 
