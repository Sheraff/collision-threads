import { SUB_STEPS, TARGET_UPS } from "../utils/constants.js"

let paused = false
const upsArray = []
let loopTimeoutId

export function loop(entities) {
	let lastTime = performance.now()
	const frame = () => {
		loopTimeoutId = setTimeout(() => {
			const time = performance.now()
			const dt = (time - lastTime) / 1000
			if (dt > 1 / TARGET_UPS) {
				lastTime = time
				const subDt = dt / SUB_STEPS
				for (let i = 0; i < SUB_STEPS; i++) {
					Object.values(entities).forEach((entity) => entity.step(subDt, entities))

					upsArray.push(subDt)
					if(upsArray.length > 100) {
						upsArray.shift()
					}
				}
			}
			if (!paused) {
				frame()
			}
		// }, 1000 / TARGET_UPS)
		}, 0)
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

export function pause() {
	paused = true
	clearTimeout(loopTimeoutId)
}

export function play(entities) {
	paused = false
	loop(entities)
}

export function getUps() {
	const ups = upsArray.length / upsArray.reduce((a, b) => a + b)
	return ups
}