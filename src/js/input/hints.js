import Member from 'util/member'

const data = {
	hints: []
}

const add = hint => Member.add(data, 'hints', hint)
const remove = hint => Member.remove(data, 'hints', hint)
const listenEach = fn => Member.listenEach(data, 'hints', fn)

export default {
	add,
	remove,
	listenEach
}