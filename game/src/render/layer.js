import * as PIXI from 'pixi.js'

const setDimensions = layer => {
  const [width, height] = [window.innerWidth, window.innerHeight]
  layer.width = width
  layer.height = height
  layer.app.renderer.resize(width, height)
  layer.app.stage.hitArea = new PIXI.Rectangle(0, 0, width, height)
}

class Layer {
  constructor(props) {
    //Create Pixi Foreground canvas
    this.app = new PIXI.Application({
      ...props,
      eventMode: 'passive',
    })
    this.app.renderer.view.style.position = 'absolute'
    this.app.renderer.view.style.display = 'block'
    this.app.renderer.view.style.opacity = '0'
    const layer = this
    requestAnimationFrame(() => {
      layer.app.renderer.view.style.transition = 'opacity 2s'
    })
    this.app.renderer.autoResize = true
    setDimensions(this)

    //Add the canvas that Pixi automatically created for you to the HTML document
    document.querySelector('.canvas').appendChild(this.app.view)
    this.resizeHandler = () => {
      setDimensions(layer)
    }
    window.addEventListener('resize', this.resizeHandler)
  }

  show() {
    this.app.renderer.view.style.opacity = '1'
  }
}

export default Layer
