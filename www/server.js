const express = require('express')
const path = require('path')
const app = express()
const port = 5000

express.static.mime.define({'application/wasm': ['wasm']});

app.get('*', (req, res, next) => {
	res.setHeader('Cross-origin-Embedder-Policy', 'require-corp');
	res.setHeader('Cross-origin-Opener-Policy','same-origin');
	next()
})

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'index.html'));
})

app.use(express.static('./'))

app.listen(port, () => {
	console.log(`http://localhost:${port}`)
})