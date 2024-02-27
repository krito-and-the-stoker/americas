import Record from 'util/record'
import Tracking from 'util/tracking'
import Message from 'util/message'
import Events from 'util/events'
import Signal from 'util/signal'
import Binding from 'util/binding'


const SAVE_TO_LOCAL_STORAGE = true
const SAVE_TO_REMOTE = true


const gameId = Signal.basic(null)
const gamesToSync = Signal.basic(JSON.parse(window.localStorage.getItem('needsSync') || '[]'))
const isRunning = Signal.basic(false)

const update = {
    isRunning: isRunning.update,
}

const initialize = async clickResume => {
    setGameIdFromUrl()
    window.addEventListener('popstate', () => {
        if (isRunning.value) {
            save()
            window.location = window.location
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


    if (SAVE_TO_REMOTE) {
        await Promise.all(
            gamesToSync.value.map(id => {
                const data = window.localStorage.getItem(id)
                if (data) {
                    return saveToRemote(id, data).then(() => {
                        gamesToSync.update(gamesToSync.value.filter(item => item !== id))
                    }).catch(e => {
                        Message.savegame.error('Could not sync to server', id, e)
                    })
                } else {
                    Message.savegame.error('Could not sync to server, no data found for', id)
                }
            })
        )
    }
}

const setGameIdFromUrl = () => {
    const newValue = window.location.pathname.split('/').pop()
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

const save = (savegame = null) => {
    Message.savegame.log('Saving...')
    const data = savegame || Record.serialize()
    if (SAVE_TO_LOCAL_STORAGE) {
        window.localStorage.setItem(gameId.value, data)
        Message.savegame.log(`Entities saved to local storage using ${data.length} bytes.`)
        if (SAVE_TO_REMOTE) {
            gamesToSync.update([...gamesToSync.value, gameId.value])
        }
    }

    Message.savegame.log(`Entities saved in memory using ${data.length} bytes.`)
    Events.trigger('save')
}

const autosave = async () => {
    Message.savegame.log('Saving...')
    const data = await Record.serializeAsync()
    if (SAVE_TO_LOCAL_STORAGE) {
        window.localStorage.setItem(gameId.value, data)
    }
    if (SAVE_TO_REMOTE) {
        await saveToRemote(gameId.value, data)
    }

    Message.savegame.log(`Entities saved to local storage using ${Math.round(data.length / 1024)} kb.`)
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
                Message.savegame.log('Savegame found on server')
                return data.game
            } catch (e) {
                Message.savegame.error('Error parsing savegame', e)
            }
        }
    }

    if (SAVE_TO_LOCAL_STORAGE && gameId) {
        const data = window.localStorage.getItem(gameId)

        if (data) {
            Message.savegame.log('Savegame found in local storage')
            return data
        }
    }

    Message.savegame.warn('No savegame found')
}

const derived = {
    gameData: Signal.state(
        gameId.listen,
        Signal.await(load),
    )
}


export default {
    start,
    derived,
    update,
    initialize,
    save,
    autosave,
}