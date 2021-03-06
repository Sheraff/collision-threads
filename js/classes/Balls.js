import { COUNT, GRAVITY, DELAY_BETWEEN_BALLS, MAX_BALL_RADIUS, MIN_BALL_RADIUS, COLORS } from "../utils/constants.js"
import * as FloatAtomics from "../utils/FloatAtomics.js"
import { randomFloat, randomInt } from "../utils/random.js"

/**
 * @param {Function} type 
 * @param {number} length 
 */
function makeBuffer(type, length) {
	const bytes = type.BYTES_PER_ELEMENT
	return {
		array: new SharedArrayBuffer(length * bytes),
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
		this.buffers.counters = makeBuffer(Uint16Array, 2)
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

			ui.fillStyle = "black"
			const max = this.side / 1000 * MAX_BALL_RADIUS
			const x = this.container.x
			const y = this.container.y - this.container.r + 2 * max
			ui.beginPath()
			ui.arc(x, y, max, 0, 2 * Math.PI)
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
		const y = this.container.y - this.container.r + 2 * max
		FloatAtomics.store(this.x, i, x)
		FloatAtomics.store(this.prevX, i, x - dt * (randomInt(0, 1) ? -300 : 300))
		FloatAtomics.store(this.y, i, y)
		FloatAtomics.store(this.prevY, i, y + dt * (randomInt(0, 1) ? -50 : 500))
		Atomics.store(this.r, i, randomInt(min, max))
		Atomics.store(this.alive, i, 1)
		Atomics.store(this.color, i, randomInt(0, COLORS.length - 1))
	}

	applyGravity() {
		this.accelerate(...GRAVITY)
	}

	solveCollisions() {
		for (let i = 0; i < this.lastBall - 1; i++) {
			const x1 = FloatAtomics.load(this.x, i)
			const y1 = FloatAtomics.load(this.y, i)
			const r1 = Atomics.load(this.r, i)
			for (let j = i + 1; j < this.lastBall; j++) {
				const r2 = Atomics.load(this.r, j)
				const minDistance = r1 + r2
				const x2 = FloatAtomics.load(this.x, j)
				const dx = x1 - x2
				if (dx > minDistance || dx < -minDistance) {
					continue
				}
				const y2 = FloatAtomics.load(this.y, j)
				const dy = y1 - y2
				if (dy > minDistance || dy < -minDistance) {
					continue
				}
				const distance = Math.hypot(dx, dy)
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
		for (let i = 0; i < this.lastBall; i++) {
			const x = FloatAtomics.load(this.x, i)
			const y = FloatAtomics.load(this.y, i)
			const r = Atomics.load(this.r, i)
			const xToContainer = x - this.container.x
			const yToContainer = y - this.container.y
			const distanceToContainer = Math.hypot(xToContainer, yToContainer)
			const minDistance = this.container.r - r
			if (distanceToContainer > minDistance) {
				const xRatio = xToContainer / distanceToContainer
				const yRatio = yToContainer / distanceToContainer
				FloatAtomics.store(this.x, i, this.container.x + xRatio * minDistance)
				FloatAtomics.store(this.y, i, this.container.y + yRatio * minDistance)
			}
		}
	}

	updatePosition(dt) {
		for (let i = 0; i < this.lastBall; i++) {
			const x = FloatAtomics.load(this.x, i)
			const prevX = FloatAtomics.exchange(this.prevX, i, x)
			const accelerationX = FloatAtomics.exchange(this.accelerationX, i, 0)
			const velocityX = x - prevX
			FloatAtomics.add(this.x, i, velocityX + accelerationX * dt**2)

			const y = FloatAtomics.load(this.y, i)
			const prevY = FloatAtomics.exchange(this.prevY, i, y)
			const accelerationY = FloatAtomics.exchange(this.accelerationY, i, 0)
			const velocityY = y - prevY
			FloatAtomics.add(this.y, i, velocityY + accelerationY * dt**2)
		}
	}

	accelerate(x, y) {
		for (let i = 0; i < this.count; i++) {
			FloatAtomics.add(this.accelerationX, i, x)
			FloatAtomics.add(this.accelerationY, i, y)
		}
	}
}