import Balls from "./classes/Balls.js";
import * as draw from "./workers/drawLoop.js";
import * as step from "./workers/stepLoop.js";

const side = Math.min(window.innerHeight, window.innerWidth) // * window.devicePixelRatio
let main, ui

{
	const uiCanvas = document.getElementById("ui");
	const mainCanvas = document.getElementById("main");
	mainCanvas.height = side
	mainCanvas.width = side
	uiCanvas.height = side
	uiCanvas.width = side

	main = mainCanvas.getContext("2d")
	ui = uiCanvas.getContext("2d")
}

{
	const balls = new Balls(side)
	step.start(balls, side)
	draw.start(balls, side, {main, ui})
	play()
}

var metricsTimeoutId
function metrics() {
	metricsTimeoutId = setTimeout(() => {
		const ups = step.getUps()
		draw.updateUps(ups)
		metrics()
	}, 1000)
}

var playing = true
function play() {
	playing = true
	metrics()
	step.play()
	draw.play({main, ui})
}
function pause(){
	playing = false
	clearTimeout(metricsTimeoutId)
	step.pause()
	draw.pause()
}


document.addEventListener("visibilitychange", () => {
	if(playing) {
		if(document.visibilityState === 'visible') {
			play()
		} else {
			pause()
		}
	}
})

window.addEventListener('keydown', (event) => {
	if(event.key === ' ') {
		event.preventDefault()
		playing = !playing
		if(playing) {
			play()
		} else {
			pause()
		}
	}
})
