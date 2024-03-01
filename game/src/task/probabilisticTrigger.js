const create = (pdf, fn) => {
  let cumulatedProbability = 0
  let lastProbability = 0
  let timeElapsed = 0

  const init = () => {
    lastProbability = pdf(0)

    return true
  }

  const update = (currentTime, deltaTime) => {
    timeElapsed += deltaTime
    const currentProbability = pdf(timeElapsed / 1000)
    const probabilityIntegral =
      (deltaTime * (currentProbability + lastProbability)) / (2 * 1000)

    if (
      cumulatedProbability >= 1 ||
      Math.random() < probabilityIntegral / (1 - cumulatedProbability)
    ) {
      fn()
      return false
    }

    lastProbability = currentProbability
    cumulatedProbability += probabilityIntegral

    return true
  }

  return {
    init,
    update,
  }
}

export default { create }
