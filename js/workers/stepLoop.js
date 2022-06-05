
import Balls from "../classes/Balls.js"
import { SUB_STEPS, TARGET_UPS } from "../utils/constants.js"

let paused
const entities = {}

/**
 * @param {number} side 
 */
export function start(side) {
	entities.balls = new Balls(side)
	entities.balls.initBuffers()
	entities.balls.initValues()
}

const upsArray = []
let loopTimeoutId
export function loop() {
	let lastTime = performance.now()
	const frame = () => {
		loopTimeoutId = setTimeout(() => {
			const time = performance.now()
			const dt = (time - lastTime) / 1000
			lastTime = time
			const subDt = dt / SUB_STEPS
			for (let i = 0; i < SUB_STEPS; i++) {
				Object.values(entities).forEach((entity) => entity.step(subDt, entities))

				upsArray.push(subDt)
				if(upsArray.length > 100) {
					upsArray.shift()
				}
			}
			if (!paused) {
				frame()
			}
		}, 1000 / TARGET_UPS)
	}
	frame()
}

const asapChannel = new MessageChannel()
function setAsap(fn, delay) {
	const time = performance.now()
	asapChannel.port1.onmessage = () => {
		const now = performance.now()
		const delta = now - time
		if (delta < delay) {
			setAsap(fn, delay - delta)
		} else {
			fn()
		}
	}
	asapChannel.port2.postMessage(null)
}

export function getEntities(){
	return entities
}

export function getUps() {
	const ups = upsArray.length / upsArray.reduce((a, b) => a + b)
	return Math.round(ups)
}

export function pause() {
	paused = true
	clearTimeout(loopTimeoutId)
}

export function play() {
	paused = false
	loop()
}