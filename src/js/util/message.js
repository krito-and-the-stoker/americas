/* eslint-disable no-console */

const config = {
	send: true,
	log: true,
	event: false,
	warn: true
}

const send = text => {
	if (config.send) {
		console.log(`Message: ${text}`)
	}
}

const log = text => {
	if (config.log) {	
		if (typeof document !== 'undefined') {	
			console.log(`Log: ${text}`)
			const logElement = document.querySelector('#log')
			if (logElement) {
				logElement.innerHTML = text
			}
		}
	}
}

const warn = (...args) => {
	if (config.warn) {
		console.warn(...args)
	}
}


const event = (text, args) => {
	if (config.event) {
		console.log(text, args)
	}
}


export default { send, log, event, warn }