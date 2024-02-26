import Record from 'util/record'
import Tracking from 'util/tracking'
import Message from 'util/message'
import Events from 'util/events'

const SAVE_TO_LOCAL_STORAGE = true
const SAVE_TO_REMOTE = true

let gameId = null
let gameData = null

const initialize = async clickResume => {
    gameId = window.location.pathname.split('/').pop()
    if (gameId) {
      document.querySelector('.load')?.addEventListener('click', clickResume)
      document.querySelector('.load')?.classList.remove('disabled')
      gameData = load()
    }

    if (SAVE_TO_REMOTE) {
        try {
            const syncItems = JSON.parse(window.localStorage.getItem('needsSync') ?? '[]')
            await Promise.all(
                syncItems
                    .map(id => window.localStorage.getItem(id))
                    .filter(x => !!x)
                    .map(saveToRemote)
            )
            window.localStorage.setItem('needsSync', '[]')
        } catch(e) {
            Message.savegame.error('Error syncing savegames', e)
        }
    }
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
        gameId = data.id
        window.history.replaceState(null, '', data.redirect)
    }
}

const saveToRemote = async data => {
    const body = JSON.stringify({
        id: gameId,
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
    Message.record.log('Saving...')
    const data = savegame || Record.serialize()
    if (SAVE_TO_LOCAL_STORAGE) {
        window.localStorage.setItem(gameId, data)
        Message.record.log(`Entities saved to local storage using ${data.length} bytes.`)
        if (SAVE_TO_REMOTE) {
            const syncItems = JSON.parse(window.localStorage.getItem('needsSync') ?? '[]')
            syncItems.push(gameId)
            window.localStorage.setItem('needsSync', JSON.stringify(syncItems))
        }
    }

    Message.record.log(`Entities saved in memory using ${data.length} bytes.`)
    Events.trigger('save')
}

const autosave = async () => {
    Message.record.log('Saving...')
    const data = await Record.serializeAsync()
    if (SAVE_TO_REMOTE) {
        await saveToRemote(data)
    }
    if (SAVE_TO_LOCAL_STORAGE) {
        window.localStorage.setItem(gameId, data)
    }

    Message.record.log(`Entities saved to local storage using ${Math.round(data.length / 1024)} kb.`)
    Tracking.autosave()
}

const getData = async () => {
    if (!gameData) {
        gameData = await load()
    }

    return gameData
}


const load = async () => {
    const syncItems = JSON.parse(window.localStorage.getItem('needsSync') ?? '[]')

    if (SAVE_TO_REMOTE && gameId && !syncItems.includes(gameId)) {
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

export default {
    start,
    getData,
    initialize,
    save,
    autosave,
}