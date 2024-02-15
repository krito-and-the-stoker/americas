import Storage from 'entity/storage'


const create = colonyOrColonistOrUnit => {
  const entity = colonyOrColonistOrUnit

  const update = (currentTime, deltaTime) => {
    if (entity.productionRecord) {
      Storage.clearWithProduction(entity.productionSummary)
      Storage.transferWithProduction(entity.productionRecord, entity.productionSummary)
    }
    if (entity.consumptionRecord) {
      Storage.clearWithProduction(entity.consumptionSummary)
      Storage.transferWithProduction(entity.consumptionRecord, entity.consumptionSummary)
    }

    return true
  }

  return {
    update,
    sort: 5,
  }
}

export default { create }
