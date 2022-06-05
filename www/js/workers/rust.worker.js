import Balls from "../classes/Balls.js"
import { SUB_STEPS, TARGET_UPS } from "../utils/constants.js"
import * as wasm from "../../pkg/collision_threads.js"
console.log('hello')
// wasm.greet()

// const COUNT = 10
// const buffer = new SharedArrayBuffer(COUNT * Uint32Array.BYTES_PER_ELEMENT)
// const array = new Uint32Array(buffer)

// wasm.trade(array)

// console.log(array)

/** @type {Object<string, EntitySet>} */
const entities = {}
let paused = false
let port
{
	let side, started
	onmessage = async function({data}) {
		if (data.side) {
			console.log('side')
			side = data.side
		}
		if (data.port) {
			console.log('port')
			port = data.port
		}
		if (!started && side && port) {
			console.log('all')
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
					play(side)
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
	console.log('start')
	entities.balls = new Balls(side)
	entities.balls.initBuffers()
	entities.balls.initValues()
	if (!paused) {
		play(side)
	}
}

function pause() {
	clearTimeout(loopTimeoutId)
	clearTimeout(metricsTimeoutId)
}

function play(side) {
	loop(side)
	metrics()
}

const upsArray = []
let metricsTimeoutId
function metrics() {
	metricsTimeoutId = setTimeout(() => {
		const ups = upsArray.length / upsArray.reduce((a, b) => a + b, 0)
		port.postMessage({
			type: 'ups',
			ups: Math.round(ups),
		})
		metrics()
	}, 1000)
}

let loopTimeoutId
function loop(side) {
	console.log('loop')
	let lastTime = performance.now()
	const frame = () => {
		loopTimeoutId = setTimeout(() => {
			const time = performance.now()
			const dt = (time - lastTime) / 1000
			lastTime = time
			const subDt = dt / SUB_STEPS
			for (let i = 0; i < SUB_STEPS; i++) {
				// Object.values(entities).forEach((entity) => entity.step(subDt, entities))

				console.log(wasm.step(
					entities.balls.count,
					dt,
					side,
					entities.balls.container.x,
					entities.balls.container.y,
					entities.balls.container.r,
					entities.balls.lastBallDelay,
					entities.balls.lastBall,
					entities.balls.buffers.x,
					entities.balls.buffers.y,
					entities.balls.buffers.prevX,
					entities.balls.buffers.prevY,
					entities.balls.buffers.accX,
					entities.balls.buffers.accY,
					entities.balls.buffers.r,
					entities.balls.buffers.alive,
					entities.balls.buffers.color,
				))
				return

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