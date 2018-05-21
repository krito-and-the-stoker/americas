class Layer {
	constructor(props) {
		//Create Pixi Foreground canvas
		const [width, height] = [window.innerWidth, window.innerHeight]
		this.width = width
		this.height = height
		this.app = new PIXI.Application(props)
		this.app.renderer.view.style.position = "absolute";
		this.app.renderer.view.style.display = "block";
		this.app.renderer.autoResize = true;
		this.app.renderer.resize(width, height)

		//Add the canvas that Pixi automatically created for you to the HTML document
		document.body.appendChild(this.app.view)
	}
}

export default Layer
