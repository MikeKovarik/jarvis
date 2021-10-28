const devices = new Map
devices.getByName = name => Array.from(devices.values()).find(d => d.name === name)
export default devices