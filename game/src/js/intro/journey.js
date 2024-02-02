import intro from 'pug-loader!src/pages/intro.pug'

const preload = () => {
	const img = document.createElement('img')
	img.src = '/images/intro-ship.jpg'
}

const text = 'So you set sail.<br>On board some hundred men and women, armed with guns and equipped with needed tools, bound to never see their homeland again.'

const create = () => new Promise(resolve => {
	const container = document.querySelector('#intro .journey')
	container.innerHTML = intro({ text })
	container.addEventListener('click', () => {
		container.classList.remove('visible')
		setTimeout(() => {
			document.querySelector('#intro').remove()
		}, 2000)
		resolve()
	})

	requestAnimationFrame(() => {
		container.classList.add('visible')
	})
})

export default { create, preload }