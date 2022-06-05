
import { SUB_STEPS, TARGET_UPS } from "../utils/constants.js"

let paused
const entities = {}

/**
 * @param {number} side 
 */
export function start(balls, side) {
	entities.balls = balls
}

const upsArray = []
let rafId
export function loop() {
	let lastTime = performance.now()
	const frame = () => {
		rafId = requestAnimationFrame(() => {
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
		})
	}
	frame()
}

export function getUps() {
	const ups = upsArray.length / upsArray.reduce((a, b) => a + b)
	return Math.round(ups)
}

export function pause() {
	paused = true
	clearTimeout(rafId)
}

export function play() {
	paused = false
	loop()
}