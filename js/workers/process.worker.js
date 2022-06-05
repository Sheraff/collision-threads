

/**
 * @typedef {Object} EntitySet
 * @property {(dx: number) => void} update
 * @property {(context: CanvasRenderingContext2D) => void} draw
 * @property {Object<string, SharedArrayBuffer>} buffers
 */

import { getEntities, getUps, play as stepPlay, pause as stepPause, start } from "./stepLoop.js"

/** @type {Object<string, EntitySet>} */

let paused = false
let port
{
	let side, started
	onmessage = async function({data}) {
		if (data.side) {
			side = data.side
		}
		if (data.port) {
			port = data.port
		}
		if (!started && side && port) {
			started = true
			start(side)
			dispatch(port)
			play()
			
		}
		if (data.type === 'toggle') {
			paused = !data.status
			if(started) {
				if (paused) {
					pause()
				} else {
					play()
				}
			}
		}
	}
}

function dispatch(port){
	const entities = getEntities()
	const interval = setInterval(() => {
		port.postMessage(
			{
				type: 'buffers',
				entities: Object.fromEntries(Object.entries(entities).map(([type, entity]) => [type, entity.buffers]))
			}
		)
	}, 50)
	port.onmessage = ({data}) => {
		if(data.type === 'received') {
			clearInterval(interval)
		}
	}
}

let metricsTimeoutId
function metrics() {
	metricsTimeoutId = setTimeout(() => {
		const ups = getUps()
		port.postMessage({
			type: 'ups',
			ups,
		})
		metrics()
	}, 1000)
}

function pause() {
	paused = true
	stepPause()
	clearTimeout(metricsTimeoutId)
}

function play() {
	paused = false
	stepPlay()
	metrics()
}