import { COUNT, GRAVITY, DELAY_BETWEEN_BALLS, MAX_BALL_RADIUS, MIN_BALL_RADIUS, COLORS } from "../utils/constants.js"
import * as FloatAtomics from "../utils/FloatAtomics.js"
import { randomFloat, randomInt } from "../utils/random.js"

/** @type {Map<Function, number>} */
const lengths = new Map([
	[Uint32Array, 4],
	[Uint8Array, 1],
	[Int32Array, 4],
])

/**
 * @param {Function} type 
 * @param {number} length 
 */
function makeBuffer(type, length) {
	return {
		array: new SharedArrayBuffer(length * lengths.get(type)),
		type: type.name,
	}
}

export default class Balls {
	constructor(side) {
		this.buffers = {}
		this.side = side
		this.container = {
			x: this.side / 2,
			y: this.side / 2,
			r: this.side / 2 - 100,
		}
	}

	initBuffers() {
		this.buffers.counters = makeBuffer(Uint8Array, 2)
		this.buffers.x = makeBuffer(Uint32Array, COUNT)
		this.buffers.prevX = makeBuffer(Uint32Array, COUNT)
		this.buffers.accelerationX = makeBuffer(Int32Array, COUNT)
		this.buffers.y = makeBuffer(Uint32Array, COUNT)
		this.buffers.prevY = makeBuffer(Uint32Array, COUNT)
		this.buffers.accelerationY = makeBuffer(Int32Array, COUNT)
		this.buffers.r = makeBuffer(Uint8Array, COUNT)
		this.buffers.alive = makeBuffer(Uint8Array, COUNT)
		this.buffers.color = makeBuffer(Uint8Array, COUNT)

		this.initViewsFromBuffers()
	}

	initViewsFromBuffers(buffers = this.buffers) {
		Object.entries(buffers).forEach(([key, { array, type }]) => {
			this[key] = new globalThis[type](array)
		})
	}

	initValues() {
		this.count = COUNT
		this.lastBall = 0
		this.x.fill(0)
		this.prevX.fill(0)
		this.accelerationX.fill(0)
		this.y.fill(0)
		this.prevY.fill(0)
		this.accelerationY.fill(0)
		this.r.fill(0)
		this.alive.fill(0)
	}

	get count() {
		return this.counters[0]
	}

	set count(number) {
		this.counters[0] = number
	}

	get lastBall() {
		return this.counters[1]
	}

	set lastBall(index) {
		this.counters[1] = index
	}

	drawUi = true
	/**
	 * @param {Object<string, CanvasRenderingContext2D>} contexts
	 * @param {number} dt 
	 */
	draw({main, ui}, dt) {
		if (this.drawUi) {
			ui.fillStyle = "gray"
			ui.beginPath()
			ui.arc(this.container.x, this.container.y, this.container.r, 0, 2 * Math.PI)
			ui.fill()
			this.drawUi = false
		}
		for (let i = 0; i < this.count; i++) {
			if (Atomics.load(this.alive, i) === 0) {
				continue
			}
			const x = FloatAtomics.load(this.x, i)
			const y = FloatAtomics.load(this.y, i)
			const r = Atomics.load(this.r, i)
			const color = COLORS[Atomics.load(this.color, i)]
			main.fillStyle = color
			main.beginPath();
			main.arc(x, y, r, 0, Math.PI * 2)
			main.fill()
		}
	}

	step(dt, entities) {
		this.addBall(dt)
		this.applyGravity()
		this.applyConstraints()
		this.solveCollisions()
		this.updatePosition(dt)
	}

	lastBallDelay = 0
	addBall(dt){
		this.lastBallDelay -= dt
		if (this.lastBallDelay > 0 || this.lastBall >= this.count) {
			return
		}
		const i = this.lastBall
		this.lastBall += 1
		this.lastBallDelay = DELAY_BETWEEN_BALLS / 1000
		const min = this.side / 1000 * MIN_BALL_RADIUS
		const max = this.side / 1000 * MAX_BALL_RADIUS
		const x = this.side / 2
		const y = this.container.y - this.container.r + max + 1
		FloatAtomics.store(this.x, i, x)
		FloatAtomics.store(this.prevX, i, x - randomFloat(-2, 2))
		FloatAtomics.store(this.y, i, y)
		FloatAtomics.store(this.prevY, i, y - 1)
		Atomics.store(this.r, i, randomInt(min, max))
		Atomics.store(this.alive, i, 1)
		Atomics.store(this.color, i, randomInt(0, COLORS.length - 1))
	}

	applyGravity() {
		this.accelerate(...GRAVITY)
	}

	solveCollisions() {
		for (let i = 0; i < this.count; i++) {
			if (Atomics.load(this.alive, i) === 0) {
				continue
			}
			const x1 = FloatAtomics.load(this.x, i)
			const y1 = FloatAtomics.load(this.y, i)
			const r1 = Atomics.load(this.r, i)
			for (let j = 0; j < this.count; j++) {
				if (i === j || Atomics.load(this.alive, j) === 0) {
					continue
				}
				const x2 = FloatAtomics.load(this.x, j)
				const y2 = FloatAtomics.load(this.y, j)
				const r2 = Atomics.load(this.r, j)
				const dx = x1 - x2
				const dy = y1 - y2
				const distance = Math.hypot(dx, dy)
				const minDistance = r1 + r2
				if (distance < minDistance) {
					const xRatio = dx / distance
					const yRatio = dy / distance
					const delta = minDistance - distance
					const mass = r1 + r2
					const r1Ratio = r2 / mass
					const r2Ratio = r1 / mass
					FloatAtomics.add(this.x, i, xRatio * 0.5 * delta * r1Ratio)
					FloatAtomics.add(this.y, i, yRatio * 0.5 * delta * r1Ratio)
					FloatAtomics.sub(this.x, j, xRatio * 0.5 * delta * r2Ratio)
					FloatAtomics.sub(this.y, j, yRatio * 0.5 * delta * r2Ratio)
				}
			}
		}
	}

	applyConstraints() {
		for (let i = 0; i < this.count; i++) {
			const x = FloatAtomics.load(this.x, i)
			const y = FloatAtomics.load(this.y, i)
			const r = Atomics.load(this.r, i)
			const xToContainer = x - this.container.x
			const yToContainer = y - this.container.y
			const distanceToContainer = Math.hypot(xToContainer, yToContainer)
			if (distanceToContainer > this.container.r - r) {
				const xRatio = xToContainer / distanceToContainer
				const yRatio = yToContainer / distanceToContainer
				FloatAtomics.store(this.x, i, this.container.x + xRatio * (this.container.r - r))
				FloatAtomics.store(this.y, i, this.container.y + yRatio * (this.container.r - r))
			}
		}
	}

	updatePosition(dt) {
		for (let i = 0; i < this.count; i++) {
			const x = FloatAtomics.load(this.x, i)
			const y = FloatAtomics.load(this.y, i)
			const prevX = FloatAtomics.load(this.prevX, i)
			const prevY = FloatAtomics.load(this.prevY, i)
			const accelerationX = FloatAtomics.load(this.accelerationX, i)
			const accelerationY = FloatAtomics.load(this.accelerationY, i)
			const velocityX = x - prevX
			const velocityY = y - prevY
			FloatAtomics.store(this.prevX, i, x)
			FloatAtomics.store(this.prevY, i, y)
			FloatAtomics.add(this.x, i, velocityX + accelerationX * dt**2)
			FloatAtomics.add(this.y, i, velocityY + accelerationY * dt**2)
			FloatAtomics.store(this.accelerationX, i, 0)
			FloatAtomics.store(this.accelerationY, i, 0)
		}
	}

	accelerate(x, y) {
		for (let i = 0; i < this.count; i++) {
			FloatAtomics.add(this.accelerationX, i, x)
			FloatAtomics.add(this.accelerationY, i, y)
		}
	}
}