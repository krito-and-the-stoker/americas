import KeenTracking from 'keen-tracking'
import uuid from 'uuid/v4'


const client = process.env.ENABLE_TRACKING ? new KeenTracking({
    projectId: '5c4111adc9e77c0001219952',
    writeKey: process.env.KEEN_SECRET
}) : null

const getId = () => {	
	const id = window.localStorage.getItem('uuid') || uuid()
 	window.localStorage.setItem('uuid', id)

 	return id
}

const pageView = () => {
	if (process.env.ENABLE_TRACKING) {	
	  client.recordEvent('pageview', {
	    host: window.location.host,
	    ip_address: "${keen.ip}",
	    sessionId: getId(),
	    keen: {
	      addons: [{
	        name: "keen:ip_to_geo",
	        input: {
	          ip: "ip_address"
	        },
	        output: "keen.location"
	      }]
	    }
	  })
	}
}

const newGame = () => {
	if (process.env.ENABLE_TRACKING) {	
		client.recordEvent('newgame', {
			sessionId: getId()
		})
	}
}

const resumeGame = () => {
	if (process.env.ENABLE_TRACKING) {	
		client.recordEvent('resumegame', {
			sessionId: getId()
		})
	}
}

export default {
	pageView,
	newGame,
	resumeGame
}