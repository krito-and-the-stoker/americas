

let gameId = null
const initialize = async () => {
    const result = await fetch('/api/game/create')
    const data = await result.json()

    if (data) {
        gameId = data.id
        window.history.replaceState(null, '', data.redirect)
    }
}

export default {
    initialize
}