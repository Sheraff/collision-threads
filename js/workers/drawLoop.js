import Balls from "../classes/Balls.js"

const entities = {}
let side
let processUps

export function start(_side, {ui}) {
	side = _side
	entities.balls = new Balls(side)

	ui.strokeStyle = "darkgray"
	ui.rect(0, 0, side, side)
	ui.stroke()
}

let fpsArray = []
let rafId
export function loop({main, ui}) {
	let lastTime = 0
	let lastMetricsPrint = lastTime
	let drawFps = 0
	const frame = () => {
		rafId = requestAnimationFrame((time) => {
			if (!lastTime) {
				lastTime = time
				return frame()
			}
			// timing
			const dt = (time - lastTime) / 1000
			lastTime = time

			// draw
			main.clearRect(0, 0, side, side)
			Object.values(entities).forEach((entity) => {
				entity.draw({main, ui}, dt)
			})

			// metrics
			fpsArray.push(dt)
			if(time - lastMetricsPrint > 100) {
				lastMetricsPrint = time
				drawFps = Math.round(fpsArray.length / fpsArray.reduce((a, b) => a + b))
				if(fpsArray.length > 100) {
					fpsArray = fpsArray.slice(Math.max(0, fpsArray.length - 100))
				}
			}
			main.fillStyle = 'white'
			main.font = '25px monospace'
			main.fillText(`step: ${processUps}ups - draw: ${drawFps}fps - count: ${entities.balls.lastBall}`, 10, 50)

			// next
			frame()
		})
	}
	frame()
}

export function updateUps(ups) {
	processUps = ups
}

export function updateEntities(bufferStructure){
	Object.entries(bufferStructure).forEach(([type, entity]) => {
		entities[type].initViewsFromBuffers(entity)
	})
}

export function pause() {
	cancelAnimationFrame(rafId)
}

export function play(contexts) {
	loop(contexts)
}