const setDimensions = (layer) => {
	const [width, height] = [window.innerWidth, window.innerHeight]
	layer.width = width
	layer.height = height
	layer.app.renderer.resize(width, height)	
}

class Layer {
	constructor(props) {
		//Create Pixi Foreground canvas
		this.app = new PIXI.Application(props)
		this.app.renderer.view.style.position = "absolute";
		this.app.renderer.view.style.display = "block";
		this.app.renderer.autoResize = true;
		setDimensions(this)

		//Add the canvas that Pixi automatically created for you to the HTML document
		document.body.appendChild(this.app.view)
		const layer = this
		this.resizeHandler = () => {
			setDimensions(layer)
		}
		window.addEventListener('resize', this.resizeHandler)
	}
}

export default Layer
