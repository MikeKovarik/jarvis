import mqtt from 'mqtt'


const mqttPort = 1883
export default mqtt.connect(`mqtt://localhost:${mqttPort}`)