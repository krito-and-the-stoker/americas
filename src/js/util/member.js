import Binding from './binding'
import List from './list'


const trueOnceFn = () => {
	let firstTime = true
	return () => {
		if (firstTime) {
			firstTime = false
			return true
		}

		return false
	}
}


const	add = (entity, key, member) => {
	return List.add(entity, key, member)
}

const	remove = (entity, key, member) => {
	List.remove(entity, key, member)
}

const has = (entity, key, member) => entity[key].includes(member)

const listenEach = (entity, key, fn) => {
	return List.listen(entity,  key, (entity, added) => {
		const trueOnce = trueOnceFn()
		return Binding.listen(entity, '*', x => fn(x, added && trueOnce()))
	})
}



export default {
	add,
	remove,
	listenEach,
	has
}