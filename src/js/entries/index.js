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
		await intro()
		document.querySelector('#log').innerHTML = `Initializing game...`
		document.querySelector('.loading').classList.remove('hidden')	
		await loadingGameCode
		await nextFrame()
		await game.start()
		prepareGame()
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
		console.log(`Built time ${Version.date}`)
		const date = new Date(Version.date)
		document.querySelector('#log').innerHTML = `Loading files...`
		document.querySelector('#date').innerHTML = `${date.toLocaleString()} Development Build`

		document.querySelector('.start').addEventListener('click', clickStart)
		document.querySelector('.start').classList.remove('disabled')	

		Audience.preload()
		Journey.preload()
		loadingGameCode = import(/* webpackChunkName: "game" */ './game.js').then(module => {
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
