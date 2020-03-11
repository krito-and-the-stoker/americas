import * as PIXI from 'pixi.js'

const create = (text = '', props = {}) => new PIXI.Text(`${text}`, {
	fontFamily: ['Helvetica', 'Arial', 'sans-serif'],
	fontSize: 32,
	fill: 0xffffff,
	align: 'center',
	...props
})

export default { create }