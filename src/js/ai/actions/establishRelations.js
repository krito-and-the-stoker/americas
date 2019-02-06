import Record from 'util/record'


const name = () => 'establish relations'


const produces = (state, goal) =>
	goal.key.length === 3 &&
	goal.key[0] === 'relations' &&
	goal.key[1] &&
	goal.key[2] === 'established' &&
	goal.value


const needs = (state, goal) => ({
	key: ['units', null, 'mapCoordinates'],
	value: Record.getAll('unit')
		.filter(unit => unit.owner.referenceId === Number(goal.key[1]) && unit.tile.domain === 'land')
		.map(unit => unit.tile.mapCoordinates),
	name: goal.name
})


const cost = () => 0


const commit = (state, goal, next) => {
	// console.log('relationships established!')
	// state.relations[goal.key[1]].established = true
	return next()
}


export default {
	produces,
	needs,
	cost,
	commit,
	name
}