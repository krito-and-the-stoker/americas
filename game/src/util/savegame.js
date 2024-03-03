import Record from 'util/record'
import Tracking from 'util/tracking'
import Message from 'util/message'
import Events from 'util/events'
import Signal from 'util/signal'
import Binding from 'util/binding'


const SAVE_TO_LOCAL_STORAGE = true
const SAVE_TO_REMOTE = true
const AUTOSAVE_INTERVAL = 5 * 60 * 1000 // autosave every 5 minutes


const gameId = Signal.basic(null)
const gamesToSync = Signal.basic(JSON.parse(window.localStorage.getItem('needsSync') || '[]'))
const lastSaveId = Signal.basic(window.localStorage.getItem('lastSaveId'))
const isRunning = Signal.basic(false)
const gamesInStorage = Signal.basic(Object.keys(window.localStorage).filter(key => key.startsWith('game-')))
const autosaveInterval = Signal.basic(parseInt(window.localStorage.getItem('autosaveInterval')) || AUTOSAVE_INTERVAL)
const lastSaveTime = Signal.basic(null)

const update = {
    isRunning: isRunning.update,
    autosaveInterval: autosaveInterval.update,
}

const listen = {
    autosaveInterval: autosaveInterval.listen,
    lastSaveTime: lastSaveTime.listen,
}

const state = {
    get gameId() { return gameId.value },
    get autosaveInterval() { return autosaveInterval.value },
}

const initialize = async clickResume => {
    setGameIdFromUrl()
    window.addEventListener('popstate', () => {
        if (isRunning.value) {
            save()
            window.location.reload()
        } else {
            setGameIdFromUrl()
        }
    })

    derived.gameData.listen(data => {
        if (data) {
            document.querySelector('.load')?.addEventListener('click', clickResume)
            document.querySelector('.load')?.classList.remove('disabled')
        }

        return () => {
            document.querySelector('.load')?.classList.add('disabled')
        }
    })

    gamesToSync.listen(items => {
        const newValue = items || []
        window.localStorage.setItem('needsSync', JSON.stringify(newValue))
    })

    lastSaveId.listen(id => {
        window.localStorage.setItem('lastSaveId', id || 0)
    })
    autosaveInterval.listen(interval => {
        window.localStorage.setItem('autosaveInterval', interval)
    })

    isRunning.listen(value =>
        value && autosaveInterval.listen(interval => {
            if (typeof interval !== 'number') {
                return
            }

            const clearId = setInterval(autosave, interval)
            return () => {
                clearInterval(clearId)
            }
        }))


    if (SAVE_TO_REMOTE) {
        await Promise.all(
            gamesToSync.value.map(id => {
                const data = loadFromStorage(id)
                if (data) {
                    return saveToRemote(id, data).then(() => {
                        gamesToSync.update(gamesToSync.value.filter(item => item !== id))
                    }).catch(e => {
                        Message.savegame.error('Could not sync to server', id, e)
                    })
                } else {
                    Message.savegame.error('Could not sync to server, no data found for', id)
                    gamesToSync.update(gamesToSync.value.filter(item => item !== id))
                }
            })
        )
    }
}

const setGameIdFromUrl = () => {
    const newValue = window.location.pathname.split('/').pop() || lastSaveId.value
    gameId.update(newValue)
}



const start = async () => {
    const result = await fetch('/api/game/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: Tracking.getUserId() })
    })
    const data = await result.json()

    if (data) {
        gameId.update(data.id)
        window.history.replaceState(null, '', data.redirect)
    }
}

const saveToRemote = async (id, data) => {
    const body = JSON.stringify({
        id: gameId.value,
        game: data,
    })

    const result = await fetch('/api/game/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body,
    })

    Message.savegame.log('Synced savegame to server')
}

const saveLocal = (id, data) => {
    const key = `game-${id}`
    try {
        window.localStorage.setItem(key, data)
    } catch(e) {
        Message.savegame.log('Could not save to local storage, removing other games and retry')
        const doNotDelete = gamesToSync.value.map(otherId => `game-${otherId}`)
        gamesInStorage.value
            .filter(key => !doNotDelete.includes(key))
            .forEach(key => window.localStorage.removeItem(key))

        window.localStorage.setItem(key, data)
    }

    gamesInStorage.update([...gamesInStorage.value, key])
    lastSaveId.update(id)
}

const loadFromStorage = id => {
    return window.localStorage.getItem(`game-${id}`)
}

const save = (savegame = null) => {
    Message.savegame.log('Saving...', gameId.value)
    const data = savegame || Record.serialize()
    if (SAVE_TO_LOCAL_STORAGE) {
        saveLocal(gameId.value, data)
        if (SAVE_TO_REMOTE) {
            gamesToSync.update([...gamesToSync.value, gameId.value])
        }
    }

    lastSaveTime.update(Date.now())

    Message.savegame.log(`Entities saved to local storage using ${Math.round(data.length / 1024)} kb.`)
    Events.trigger('save')
}

const asyncSave = async () => {
    Message.savegame.log('Saving...', gameId.value)
    const data = await Record.serializeAsync()
    if (SAVE_TO_LOCAL_STORAGE) {
        Message.savegame.log('Saving to local storage...')
        saveLocal(gameId.value, data)
    }
    if (SAVE_TO_REMOTE) {
        Message.savegame.log('Saving to remote...')
        await saveToRemote(gameId.value, data)
    }

    lastSaveTime.update(Date.now())
    Message.savegame.log(`Entities saved to local storage and remote using ${Math.round(data.length / 1024)} kb.`)
}

const autosave = async () => {
    await asyncSave()
    Tracking.autosave()
}


const load = async gameId => {
    if (!gameId) {
        return undefined
    }

    if (SAVE_TO_REMOTE && gameId && !gamesToSync.value.includes(gameId)) {
        const result = await fetch('/api/game/load', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: gameId })
        })

        const data = await result.json()
        if (data.userId) {
            Tracking.updateUserId(data.userId)
        }

        if (data.game) {
            try {
                Message.savegame.log('Savegame found on server', gameId)
                return data.game
            } catch (e) {
                Message.savegame.error('Error parsing savegame', e)
            }
        }
    }

    if (SAVE_TO_LOCAL_STORAGE && gameId) {
        const data = loadFromStorage(gameId)

        if (data) {
            Message.savegame.log('Savegame found in local storage', gameId)
            return data
        }
    }

    Message.savegame.warn('No savegame found', gameId)
}

const derived = {
    gameData: Signal.state(
        gameId.listen,
        Signal.combine({
            id: Signal.through,
            isRunning: Signal.source(isRunning.listen),
        }),
        Signal.select(({ id, isRunning }) => !isRunning ? id : null),
        Signal.await(load),
    ),
    name: Signal.state(
        gameId.listen,
        Signal.select(id => id?.split('--')[1]),
        Signal.select(name => name && name[0].toUpperCase() + name.slice(1)),
    )
}


export default {
    start,
    derived,
    update,
    listen,
    state,
    initialize,
    save,
    asyncSave,
    autosave,
}