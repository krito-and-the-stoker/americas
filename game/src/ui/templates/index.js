import Message from 'util/message'

import generateAst from './ast'
import renderTemplate from './render'

const TEMPLATE_ENDPOINT = '/templates/index.md'
let dialogs
export const fetchDialogs = async (staticContext) => {
	if (!dialogs) {
		dialogs = {}

		const response = await fetch(TEMPLATE_ENDPOINT)
		const text = await response.text()
		const ast = generateAst(text)
		const templates = ast.value.map(node => renderTemplate(node, staticContext))

		templates.forEach((template, index) => {
			if (template.type === 'dialog') {
				if (template.name) {
					if (dialogs[template.name]) {
						console.error('Duplicate dialog name', template.name)
					} else {
						// console.log('Adding dialog', template.name, `to dialogs:\n${template.str}`)
						dialogs[template.name] = template
					}
				} else {
					console.error('Dialog has no name: ', { template }, ast.value[index])
				}
			} else {
				console.error(`Unknown template type: ${template.type}\nsrc:${text}`, { template })
			}
		})
	}

	Message.log(`Prerendered ${Object.keys(dialogs).length} dialog templates`)

	return dialogs
}
