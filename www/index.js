console.log('main')

const uiCanvas = document.getElementById("ui");
const mainCanvas = document.getElementById("main");

const side = Math.min(window.innerHeight, window.innerWidth) // * window.devicePixelRatio
mainCanvas.height = side
mainCanvas.width = side
uiCanvas.height = side
uiCanvas.width = side

const canvasWorker = new Worker("./js/workers/canvas.worker.js", { type: "module" })
const rustWorker = new Worker("./js/workers/rust.worker.js", { type: "module" })

console.log('workers')

const offscreenMain = mainCanvas.transferControlToOffscreen()
const offscreenUi = uiCanvas.transferControlToOffscreen()

requestAnimationFrame(() => {
	requestAnimationFrame(() => {
		console.log('messages')
		canvasWorker.postMessage({
			side: side,
			main: offscreenMain,
			ui: offscreenUi,
		}, [offscreenMain, offscreenUi]);
		rustWorker.postMessage({
			side: side,
		})
	})
})


const channel = new MessageChannel();
canvasWorker.postMessage({port: channel.port1}, [channel.port1]);
rustWorker.postMessage({port: channel.port2}, [channel.port2]);

mainCanvas.addEventListener('click', ({x, y}) => {
	rustWorker.postMessage({
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
		rustWorker.postMessage({
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
		rustWorker.postMessage(message)
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
		rustWorker.postMessage(message)
		canvasWorker.postMessage(message)
	}
})
