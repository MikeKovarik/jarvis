import {EventEmitter} from 'events'

const emitter = new EventEmitter

console.log('emitter._events', emitter._events)
console.log('emitter.eventNames()', emitter.eventNames())

emitter.on('foo', console.log)
emitter.on('bar', console.log)
emitter.on('bar', console.log)
emitter.on('baz', console.log)

console.log('emitter._events', emitter._events)
console.log('emitter.eventNames()', emitter.eventNames())