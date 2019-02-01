import LZString from 'lz-string'

onmessage = e => {
	console.log('compressing...')
	console.log('received', e.data.length)
	const compressed = LZString.compress(e.data)
	postMessage(compressed)
	console.log('done')
	close()
}