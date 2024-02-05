import Util from 'util/util'

const create = (waitTime, fn) => {
  let finishedTime

  const init = currentTime => {
    finishedTime = currentTime + waitTime

    return true
  }

  const update = currentTime => {
    if (currentTime >= finishedTime) {
      Util.execute(fn)
      return false
    }

    return true
  }

  return {
    init,
    update,
  }
}

export default { create }
