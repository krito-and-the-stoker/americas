const send = text => {
	console.log(`Message: ${text}`)
}

const log = text => {
	console.log(`Log: ${text}`)
	const logElement = document.querySelector('#log')
	if (logElement) {
		logElement.innerHTML = text
	}
}

export default { send, log }