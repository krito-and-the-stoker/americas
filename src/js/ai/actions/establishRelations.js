import Record from 'util/record'


const name = () => 'establish relations'


const produces = goal =>
	goal.key.length === 3 &&
	goal.key[0] === 'relations' &&
	goal.key[1] &&
	goal.key[2] === 'established' &&
	goal.value


const needs = goal => ({
	key: ['units', null, 'mapCoordinates'],
	value: Record.getAll('unit')
		.filter(unit => unit.owner.referenceId === Number(goal.key[1]) && unit.domain === 'land')
		.map(unit => unit.mapCoordinates)
})
	

const cost = () => 0


export default {
	produces,
	needs,
	cost,
	name
}