import { play as stepPlay, pause as stepPause, start, updateUps, updateEntities } from "./drawLoop.js"

let paused = false
let main, ui, side
{
	let port, started
	onmessage = async function({data}) {
		if (data.ui)
			ui = data.ui.getContext("2d")
		if (data.main)
			main = data.main.getContext("2d")
		if (data.side)
			side = data.side
		if (data.port)
			port = data.port

		if (!started && main && ui && side && port) {
			started = true
			start(side, {main, ui})
			listen(port)
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

function listen(port) {
	port.onmessage = ({data}) => {
		if (data.type === 'buffers') {
			updateEntities(data.entities)
			port.postMessage({type: 'received'})
			play()
		}
		if (data.type === 'ups') {
			updateUps(data.ups)
		}
	}
}

function pause() {
	stepPause()
}

function play() {
	stepPlay({main, ui})
}