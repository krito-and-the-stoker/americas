import Version from '../../version/version.json'

let game = null


window.addEventListener('load', async () => {
	console.log(`Revision: ${Version.revision}`)
	console.log(`Build from ${Version.date}`)
	document.querySelector('#date').innerHTML = `Development build from ${Version.date}`
	const clickStart = () => {
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

	if (window.localStorage.getItem('lastSave')) {
		document.querySelector('.load').addEventListener('click', clickResume)
	} else {
		document.querySelector('.load').classList.add('disabled')	
	}

})
