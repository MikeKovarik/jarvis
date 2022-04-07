export const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

export const timeout = millis => new Promise(resolve => setTimeout(resolve, millis))