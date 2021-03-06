const uiCanvas = document.getElementById("ui");
const mainCanvas = document.getElementById("main");

const side = Math.min(window.innerHeight, window.innerWidth) // * window.devicePixelRatio
mainCanvas.height = side
mainCanvas.width = side
uiCanvas.height = side
uiCanvas.width = side

const canvasWorker = new Worker("js/workers/canvas.worker.js", { type: "module" })
const processWorker = new Worker("js/workers/process.worker.js", { type: "module" });

const offscreenMain = mainCanvas.transferControlToOffscreen()
const offscreenUi = uiCanvas.transferControlToOffscreen()

requestAnimationFrame(() => {
	requestAnimationFrame(() => {
		canvasWorker.postMessage({
			side: side,
			main: offscreenMain,
			ui: offscreenUi,
		}, [offscreenMain, offscreenUi]);
		processWorker.postMessage({
			side: side,
		})
	})
})


const channel = new MessageChannel();
canvasWorker.postMessage({port: channel.port1}, [channel.port1]);
processWorker.postMessage({port: channel.port2}, [channel.port2]);

mainCanvas.addEventListener('click', ({x, y}) => {
	processWorker.postMessage({
		type: 'mouse',
		mouse: {
			x: x * side / mainCanvas.offsetWidth,
			y: y * side / mainCanvas.offsetHeight,
		}
	})
})
window.addEventListener('keydown', (event) => {
	if(event.key === 'Escape') {
		event.preventDefault()
		processWorker.postMessage({
			type: 'mouse',
			mouse: null
		})
	}
})

let playing = true
document.addEventListener("visibilitychange", () => {
	if(playing) {
		const message = {
			type: 'toggle',
			status: document.visibilityState === 'visible'
		}
		processWorker.postMessage(message)
		canvasWorker.postMessage(message)
	}
})

window.addEventListener('keydown', (event) => {
	if(event.key === ' ') {
		event.preventDefault()
		playing = !playing
		const message = {
			type: 'toggle',
			status: playing
		}
		processWorker.postMessage(message)
		canvasWorker.postMessage(message)
	}
})
