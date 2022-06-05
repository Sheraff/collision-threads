
/**
 * @typedef {Object} TransferableEntitySet
 * @property {Object<string, SharedArrayBuffer>} buffers
 */

 import Balls from "../classes/Balls.js"

 /**
  * @typedef {Object} EntitySet
  * @property {(dx: number) => void} update
  * @property {(main: CanvasRenderingContext2D) => void} draw
  */
 
 /** @type {Object<string, EntitySet>} */
 const entities = {}
 let paused = false
 let main, ui, side
 {
	 let port, started
	 onmessage = async function({data}) {
		 if (data.ui) {
			 ui = data.ui.getContext("2d")
		 }
		 if (data.main) {
			 main = data.main.getContext("2d")
		 }
		 if (data.side) {
			 side = data.side
		 }
		 if (data.port) {
			 port = data.port
		 }
		 if (!started && main && ui && side && port) {
			 started = true
			 start()
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
 
 let processUps = 0
 function listen(port) {
	 port.onmessage = ({data}) => {
		 if (data.type === 'buffers') {
			 Object.entries(data.entities).forEach(([type, entity]) => {
				 entities[type].initViewsFromBuffers(entity)
			 })
			 port.postMessage({type: 'received'})
			 play()
		 }
		 if (data.type === 'ups') {
			 processUps = data.ups
		 }
	 }
 }
 
 function start() {
	 entities.balls = new Balls(side)
 
	 ui.strokeStyle = "darkgray"
	 ui.rect(0, 0, side, side)
	 ui.stroke()
 }
 
 let fpsArray = []
 let rafId
 function loop() {
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
 
 function pause() {
	 cancelAnimationFrame(rafId)
 }
 
 function play() {
	 loop()
 }