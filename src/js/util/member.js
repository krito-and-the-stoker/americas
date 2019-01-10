import Binding from './binding'


const update = (entity, key, members) => Binding.update(entity, key, members)

const	add = (entity, key, member) => {
	if (!entity[key].includes(member)) {
		entity[key].push(member)
		update(entity)
	}
}

const	remove = (entity, key, member) => {
	update(entity, entity[key].filter(u => u !== member))
}

const has = (entity, key, member) => entity[key].includes(member)


export default {
	add,
	remove,
	has
}