import Member from 'util/member'
import Binding from 'util/binding'
import { Function1, CleanupExec } from 'util/types'


type Hint = {
  action: string
  text: string
}

const data: { hints: Hint[] } = {
  hints: [],
}

const add = (hint: Hint) => {
  const hints = data.hints.filter(h => h.action === hint.action)
  hints.forEach(h => {
    Member.remove(data, 'hints', h)
  })
  return Member.add(data, 'hints', hint)
}
const remove = (hint: Hint) => Member.remove(data, 'hints', hint)
const listenEach = (fn: Function1<Hint, CleanupExec>) => Member.listenEach(data, 'hints', fn)
const listen = (fn: Function1<Hint[], CleanupExec>) => Binding.listen(data, 'hints', fn)

export default {
  add,
  remove,
  listen,
  listenEach,
}
