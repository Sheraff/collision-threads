import { COUNT, GRAVITY, DELAY_BETWEEN_BALLS, MAX_BALL_RADIUS, MIN_BALL_RADIUS, COLORS } from "../utils/constants.js"
import { randomFloat, randomInt } from "../utils/random.js"

class Ball {
	constructor(x, y, prevX, prevY, r, color) {
		this.x = x
		this.y = y
		this.prevX = prevX
		this.prevY = prevY
		this.r = r
		this.color = color
		this.accelerationX = 0
		this.accelerationY = 0
	}

	draw(context) {
		const x = this.x
		const y = this.y
		const r = this.r
		const color = COLORS[this.color]
		context.fillStyle = color
		context.beginPath();
		context.arc(x, y, r, 0, Math.PI * 2)
		context.fill()
	}

	applyGravity() {
		this.accelerate(...GRAVITY)
	}

	accelerate(x, y) {
		this.accelerationX = x
		this.accelerationY = y
	}

	applyConstraints(container) {
		const x = this.x
		const y = this.y
		const r = this.r
		const xToContainer = x - container.x
		const yToContainer = y - container.y
		const distanceToContainer = Math.hypot(xToContainer, yToContainer)
		const minDistance = container.r - r
		if (distanceToContainer > minDistance) {
			const xRatio = xToContainer / distanceToContainer
			const yRatio = yToContainer / distanceToContainer
			this.x = container.x + xRatio * minDistance
			this.y = container.y + yRatio * minDistance
		}
	}

	updatePosition(dt) {
		const x = this.x
		const prevX = this.prevX
		this.prevX = x
		const accelerationX = this.accelerationX
		this.accelerationX = 0
		const velocityX = x - prevX
		this.x += velocityX + accelerationX * dt**2

		const y = this.y
		const prevY = this.prevY
		this.prevY = y
		const accelerationY = this.accelerationY
		this.accelerationY = 0
		const velocityY = y - prevY
		this.y += velocityY + accelerationY * dt**2
	}
}

export default class Balls {
	constructor(side) {
		this.count = COUNT
		this.lastBall = 0
		this.buffers = {}
		this.side = side
		this.container = {
			x: this.side / 2,
			y: this.side / 2,
			r: this.side / 2 - 100,
		}
		this.balls = []
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
		for (let i = 0; i < this.lastBall; i++) {
			this.balls[i].draw(main)
		}
	}

	step(dt, entities) {
		this.addBall(dt)
		for (let i = 0; i < this.lastBall; i++) {
			this.balls[i].applyGravity()
			this.balls[i].applyConstraints(this.container)
		}
		this.solveCollisions()
		for (let i = 0; i < this.lastBall; i++) {
			this.balls[i].updatePosition(dt)
		}
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
		const prevX = x - dt * (randomInt(0, 1) ? -300 : 300)
		const prevY = y + dt * (randomInt(0, 1) ? -50 : 500)
		const r = randomInt(min, max)
		const color = randomInt(0, COLORS.length - 1)
		this.balls.push(new Ball(x, y, prevX, prevY, r, color))
	}

	solveCollisions() {
		for (let i = 0; i < this.lastBall - 1; i++) {
			const x1 = this.balls[i].x
			const y1 = this.balls[i].y
			const r1 = this.balls[i].r
			for (let j = i + 1; j < this.lastBall; j++) {
				const r2 = this.balls[j].r
				const minDistance = r1 + r2
				const x2 = this.balls[j].x
				const dx = x1 - x2
				if (dx > minDistance || dx < -minDistance) {
					continue
				}
				const y2 = this.balls[j].y
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
					this.balls[i].x += xRatio * 0.5 * delta * r1Ratio
					this.balls[i].y += yRatio * 0.5 * delta * r1Ratio
					this.balls[j].x -= xRatio * 0.5 * delta * r2Ratio
					this.balls[j].y -= yRatio * 0.5 * delta * r2Ratio
				}
			}
		}
	}
}