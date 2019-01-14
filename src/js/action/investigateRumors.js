import MapEntity from '../entity/map'
import Message from '../view/ui/message'
import Background from '../render/background'
import Unit from '../entity/unit'
import Treasure from '../entity/treasure'
import Europe from '../entity/europe'

// TODO: implement these
// After choice
// - These are the burial grounds of our ancient fathers! You have trespassed on sacred land. Now you must die!
// - The mounds are cold and empty.
// - Within, you find trinkets worth [x gold].
// - Within, you find incredible treasure worth [x gold]! It will take a Galleon to get this treasure back to Europe!

const options = [{
	text: () => 'Your find nothing but rumors',
	fn: () => {},
	probability: 1,
}, {
	text: () => 'Your expedition has vanished without a trace.',
	fn: ({ unit }) => Unit.disband(unit),
	probability: 0.5
}, {
	text: ({ random }) => `Your expedition enters a small friendly tribe. The chief offers you a gift worth ${Math.round(50 + 250*random)} gold.`,
	fn: ({ random }) => Treasure.gain(Math.round(50 + 250*random)),
	probability: 1.5
}, {
	text: () => 'You happen upon the desperate survivors of a former colony. In exchange for badly needed supplies, they swear allegiance to you.',
	fn: ({ unit }) => Unit.create('settler', unit.mapCoordinates),
	probability: 1
}, {
	text: ({ random }) => `You find the ruins of a lost civilization. Within are gold and artifacts worth ${Math.round(500 + 1500*random)} gold.`,
	fn: ({ random, unit }) => {
		const treasure = Unit.create('treasure', unit.mapCoordinates)
		treasure.treasure = Math.round(500 + 1500*random)
	},
	probability: 0.25
}, {
	text: ({ random }) => `You have found one of the Seven Cities of Cibola! Treasure worth ${Math.round(3000 + 4000*random)} gold unearthed in the ruins! It will take a Galleon to get this treasure back to Europe!`,
	fn: ({ random, unit }) => {
		const treasure = Unit.create('treasure', unit.mapCoordinates)
		treasure.treasure = Math.round(3000 + 4000*random)
	},
	probability: 0.1
}, {
	text: () => 'You have discovered a Fountain of Youth! Rumors fly in Europe! Immigrants line the docks to seek perpetual youth in the New World!',
	fn: () => Europe.update.crosses(150),
	probability: 0.1
}, {
	text: () => 'You are trespassing near our holy shrines!',
	fn: () => {},
	probability: 0.1
}]

export default unit => {
	const totalProbabilities = options.reduce((sum, option) => sum + option.probability, 0)
	const option = options.reduce((current, option) => current.sum > 0 ? { ...option, sum: current.sum - option.probability } : current, { sum: totalProbabilities * Math.random() })

	const random = Math.random()
	Message.send(option.text({ unit, random }))
	option.fn({ unit, random })

	const tile = MapEntity.tile(unit.mapCoordinates)
	tile.rumors = false
	Background.render()
}