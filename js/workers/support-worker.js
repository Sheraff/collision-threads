import Balls from "../classes/Balls.js"
import * as updateLoop from "./updateLoop.js"

const entities = {}
let paused = false
{
	let side, started
	onmessage = async function({data}) {
		if (data.side) {
			side = data.side
		}
		if (!started && side) {
			started = true
			start(side)
		}
		if (data.type === 'toggle') {
			paused = !data.status
			if (started) {
				if (paused) {
					updateLoop.pause()
				} else {
					updateLoop.play(entities)
				}
			}
		}
		if (data.type === 'buffers') {
			Object.entries(data.entities).forEach(([type, entity]) => {
				entities[type].initViewsFromBuffers(entity)
			})
			postMessage({type: 'received'})
			updateLoop.play(entities)
		}
	}
}

/**
 * @param {number} side 
 */
function start(side) {
	entities.balls = new Balls(side, {start: 1, increment: 2})
}