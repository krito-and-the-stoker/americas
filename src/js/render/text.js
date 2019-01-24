import * as PIXI from 'pixi.js'

const create = (text = '', props = {}) => new PIXI.Text(`${text}`, {
	fontFamily: 'Times New Roman',
	fontSize: 32,
	fill: 0xffffff,
	align: 'center',
	...props
})

export default { create }