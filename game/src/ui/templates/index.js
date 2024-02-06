import generateAst from './ast'
import renderTemplate from './render'

const TEMPLATE_ENDPOINT = '/templates/all.json'
let dialogs
export const fetchDialogs = async () => {
	if (!dialogs) {
		dialogs = {}

		const response = await fetch(TEMPLATE_ENDPOINT)
		const strings = await response.json()
		const templates = strings.map(str => ({
			str
		})).map(obj => {
			const ast = generateAst(obj.str)
			return {
				...obj,
				ast
			}
		}).filter(obj => {
			if (!obj.ast) {
				console.error('Failed to parse template, dropping:\n\n', obj.str)
				return false
			}

			return true
		}).map(obj => {			
			const templates = obj.ast.value.map(renderTemplate)

			return {
				...obj,
				templates
			}
		}).flatMap(obj => obj.templates.map(template => ({
			str: obj.str,
			ast: obj.ast,
			...template
		})))

		templates.forEach(template => {
			if (template.type === 'dialog') {
				if (template.name) {
					if (dialogs[template.name]) {
						console.error('Duplicate dialog name', template.name)
					} else {
						console.log('Adding dialog', template.name, `to dialogs:\n${template.str}`)
						dialogs[template.name] = template
					}
				} else {
					console.error('Dialog has no name, src:\n', template.str, { template })
				}
			} else {
				console.error(`Unknown template type: ${template.type}\nsrc:${template.str}`, { template })
			}
		})
	}

	return dialogs
}
