import Binding from './binding'
import List from './list'



const	add = (entity, key, member) => {
	return List.add(entity, key, member)
}

const	remove = (entity, key, member) => {
	List.remove(entity, key, member)
}

const has = (entity, key, member) => entity[key].includes(member)

const listenEach = (entity, key, fn) => {
	return List.listen(entity,  key, (entity, added) =>
		Binding.listen(entity, null, x => fn(x, added)))
}



export default {
	add,
	remove,
	listenEach,
	has
}