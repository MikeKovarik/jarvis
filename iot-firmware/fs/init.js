load('polyfill.js');
load('api_config.js');
load('api_gpio.js');
load('api_sys.js');
load('api_timer.js');
load('api_events.js');
load('api_rpc.js');
load('api_net.js');
load('api_pwm.js');
load('secret.js');
load('config.js');

load('device-setup.js');

// low-fat replacement for MQTT which is problematic in current setup.
load('mqtt-emulator.js');
// Disabled because running enabling MQTT seems to drop packets when used with raspberry zero az hub
//load('api_mqtt.js');

load('jarvis-hub.js');
load('google-smarthome.js');