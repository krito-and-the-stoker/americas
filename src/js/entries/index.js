import Version from '../../version/version.json'
import Tracking from '../util/tracking'
import NumberOfAssets from '../data/numberOfAssets.json'
import isMobile from 'is-mobile'

let game = null
window.addEventListener('load', async () => {
	if (!isMobile()) {
		console.log(`Revision: ${Version.revision}`)
		console.log(`Build from ${Version.date}`)
		document.querySelector('#log').innerHTML = `Loading files 0/${NumberOfAssets.files}...`
		Tracking.pageView()
		document.querySelector('#date').innerHTML = `Development build from ${Version.date}`
		const clickStart = () => {
			Tracking.newGame()
			document.querySelector('.start').removeEventListener('click', clickStart)
			document.querySelector('.load').removeEventListener('click', clickResume)
			document.querySelector('.title').classList.add('hidden')
			document.querySelector('.loading').classList.remove('hidden')
			requestAnimationFrame(() => {		
				loadingRessources.then(() => {
					return game.start()
				}).then(() => {
					setInterval(game.save, 60000)
					window.addEventListener('beforeunload', game.save)
					setTimeout(() => {
						document.querySelector('.loading').classList.add('hidden')
					}, 750)
				})
			})
		}

		const clickResume = () => {
			Tracking.resumeGame()
			document.querySelector('.start').removeEventListener('click', clickStart)
			document.querySelector('.load').removeEventListener('click', clickResume)
			document.querySelector('.title').classList.add('hidden')
			document.querySelector('.loading').classList.remove('hidden')
			requestAnimationFrame(() => {		
				loadingRessources.then(() => {
					return game.load()
				}).then(() => {
					setInterval(game.save, 60000)
					window.addEventListener('beforeunload', game.save)
					setTimeout(() => {
						document.querySelector('.loading').classList.add('hidden')
					}, 750)
				})
			})
		}


		const loadingRessources = import(/* webpackChunkName: "game" */ './game.js').then(module => {
			game = module.default
			return module.default.preload()
		})
		document.querySelector('.start').addEventListener('click', clickStart)
		document.querySelector('.start').classList.remove('disabled')	

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
