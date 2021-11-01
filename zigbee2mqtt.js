import './config-env.js'
import Controller from 'zigbee2mqtt/dist/controller.js'



/*
ZIGBEE2MQTT_DATA

zigbee2mqtt/bridge/event
device_joined, device_leave

zigbee2mqtt/big-button-1
"action":"arrow_right_click"

on
off
brightness_move_up
brightness_move_down
brightness_stop
arrow_left_click
arrow_left_hold
arrow_left_release
arrow_right_click
arrow_right_hold
arrow_right_release

*/

let controller
let stopping = false

async function restart() {
    await stop()
    await start()
}

async function exit(code) {
    process.exit(code)
}

async function start() {
    controller = new Controller(restart, exit)
    await controller.start()
}

async function stop(reason) {
    await controller.stop(reason)
}

async function handleQuit() {
    if (!stopping && controller) {
        stopping = true
        await stop()
    }
}

process.on('SIGINT', handleQuit)
process.on('SIGTERM', handleQuit)
start()