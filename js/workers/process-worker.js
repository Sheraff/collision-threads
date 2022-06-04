

/**
 * @typedef {Object} EntitySet
 * @property {(dx: number) => void} update
 * @property {(context: CanvasRenderingContext2D) => void} draw
 * @property {Object<string, SharedArrayBuffer>} buffers
 */

import Balls from "../classes/Balls.js"
import * as updateLoop from "./updateLoop.js"

const child = new Worker('./support-worker.js', {type: 'module'})

/** @type {Object<string, EntitySet>} */
const entities = {}
let paused = false
let port
{
	let side, started
	onmessage = async function({data}) {
		if (data.side) {
			side = data.side
			child.postMessage({side})
		}
		if (data.port) {
			port = data.port
		}
		if (!started && side && port) {
			started = true
			start(side)
			dispatch(port)
			dispatch(child)
		}
		if (data.type === 'toggle') {
			child.postMessage({type: 'toggle', status: data.status})
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
	const message = {
		type: 'buffers',
		entities: Object.fromEntries(Object.entries(entities).map(([type, entity]) => [type, entity.buffers]))
	}
	const interval = setInterval(() => {
		port.postMessage(message)
	}, 50)
	port.onmessage = ({data}) => {
		if(data.type === 'received') {
			clearInterval(interval)
		}
	}
}

/**
 * @param {number} side 
 */
function start(side) {
	entities.balls = new Balls(side, {start: 0, increment: 2})
	entities.balls.initBuffers()
	entities.balls.initValues()
	if (!paused) {
		play()
	}
}

let metricsTimeoutId
function metrics() {
	metricsTimeoutId = setTimeout(() => {
		const ups = updateLoop.getUps()
		port.postMessage({
			type: 'ups',
			ups: Math.round(ups),
		})
		metrics()
	}, 1000)
}

function pause() {
	updateLoop.pause()
	clearTimeout(metricsTimeoutId)
}

function play() {
	updateLoop.play(entities)
	metrics()
}