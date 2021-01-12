import Europe from 'entity/europe'
import Colony from 'entity/colony'

const create = (colony) => {
  const update = () => {
    Europe.update.crosses(colony.crosses)
    Colony.update.crosses(colony, -colony.crosses)

    return true
  }

  return {
    update,
    sort: 6
  }
}

export default { create }