

/**
 * @typedef {Object} EntitySet
 * @property {(dx: number) => void} update
 * @property {(context: CanvasRenderingContext2D) => void} draw
 * @property {Object<string, SharedArrayBuffer>} buffers
 */

import Balls from "../classes/Balls.js"
import { SUB_STEPS, TARGET_UPS } from "../utils/constants.js"

/** @type {Object<string, EntitySet>} */
const entities = {}
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

/**
 * @param {number} side 
 */
function start(side) {
	entities.balls = new Balls(side)
	entities.balls.initBuffers()
	entities.balls.initValues()
	if (!paused) {
		play()
	}
}

const upsArray = []
let loopTimeoutId
function loop() {
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

let metricsTimeoutId
function metrics() {
	metricsTimeoutId = setTimeout(() => {
		const ups = upsArray.length / upsArray.reduce((a, b) => a + b)
		port.postMessage({
			type: 'ups',
			ups: Math.round(ups),
		})
		metrics()
	}, 1000)
}

function pause() {
	clearTimeout(loopTimeoutId)
	clearTimeout(metricsTimeoutId)
}

function play() {
	loop()
	metrics()
}