import Member from 'util/member'
import Binding from 'util/binding'

const data = {
  hints: [],
}

const add = hint => {
  const hints = data.hints.filter(h => h.action === hint.action)
  hints.forEach(h => {
    Member.remove(data, 'hints', h)
  })
  return Member.add(data, 'hints', hint)
}
const remove = hint => Member.remove(data, 'hints', hint)
const listenEach = fn => Member.listenEach(data, 'hints', fn)
const listen = fn => Binding.listen(data, 'hints', fn)

export default {
  add,
  remove,
  listen,
  listenEach,
}
