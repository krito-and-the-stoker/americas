import Version from 'version/version.json'
import Tracking from 'util/tracking'
import isMobile from 'is-mobile'
import Audience from 'intro/audience'
import Journey from 'intro/journey'

const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve))

const intro = () => new Promise(async (resolve) => {
	await Audience.create()
	document.querySelector('#intro').classList.add('opaque')
	await Journey.create()
	document.querySelector('#intro').classList.remove('opaque')
	resolve()
})

let loadingGameCode = null
const clickStart = async () => {
	Tracking.newGame()
	disableButtons()

	requestAnimationFrame(async () => {	
		const introPromise = intro()
		await loadingGameCode.then(() => {
			// return game.start()
		}).then(async () => {
			await introPromise
			document.querySelector('#log').innerHTML = `Initializing game...`
			document.querySelector('.loading').classList.remove('hidden')	
			await nextFrame()
			await game.start()
			prepareGame()
		})
	})
}

const clickResume = () => {
	Tracking.resumeGame()
	disableButtons()
	document.querySelector('.loading').classList.remove('hidden')	

	requestAnimationFrame(async () => {		
		await loadingGameCode.then(() => {
			return game.load()
		}).then(prepareGame)
	})
}

const disableButtons = () => {
	document.querySelector('.start').removeEventListener('click', clickStart)
	document.querySelector('.load').removeEventListener('click', clickResume)
	document.querySelector('.title').classList.add('hidden')
}

const prepareGame = () => {
	window.addEventListener('beforeunload', game.save)
	setTimeout(() => {
		document.querySelector('.loading').classList.add('hidden')
	}, 750)	
}


let game = null
window.addEventListener('load', async () => {
	if (!isMobile()) {
		Tracking.pageView()
		console.log(`Revision: ${Version.revision}`)
		console.log(`Build from ${Version.date}`)
		document.querySelector('#log').innerHTML = `Loading files...`
		document.querySelector('#date').innerHTML = `Development build from ${Version.date}`

		document.querySelector('.start').addEventListener('click', clickStart)
		document.querySelector('.start').classList.remove('disabled')	

		loadingGameCode = import(/* webpackChunkName: "game" */ './game.js').then(module => {
			Audience.preload()

			game = module.default
			return module.default.preload()
		})

		if (window.localStorage.getItem('lastSave')) {
			document.querySelector('.load').addEventListener('click', clickResume)
			document.querySelector('.load').classList.remove('disabled')	
		}
	} else {
		const overlay = document.createElement('div')
		overlay.innerHTML = '<p>Sorry, we currently do not support mobile devices.</p>'
		overlay.classList.add('overlay')
		document.body.appendChild(overlay)
		requestAnimationFrame(() => overlay.classList.add('show'))
		overlay.addEventListener('touch', () => overlay.classList.remove('show'))
		overlay.addEventListener('click', () => overlay.classList.remove('show'))
	}
})
