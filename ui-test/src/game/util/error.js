import Message from 'util/message'

const capture = error => {
	Message.error('Captured error:', error)

	// future TODO:
	// Send the error to our api together with previous messages, user agent and savegame
}

export default {
	capture
}