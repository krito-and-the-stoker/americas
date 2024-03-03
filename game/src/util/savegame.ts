import Record from 'util/record'
import Tracking from 'util/tracking'
import Message from 'util/message'
import Events from 'util/events'
import Signal from 'util/signal'

import { FunctionVoid } from 'util/types'

const SAVE_TO_LOCAL_STORAGE = true
const SAVE_TO_REMOTE = true
const AUTOSAVE_INTERVAL = 5 * 60 * 1000 // autosave every 5 minutes


const gameId = Signal.basic(null)
const gamesToSync = Signal.basic(JSON.parse(window.localStorage.getItem('needsSync') || '[]'))
const lastSaveId = Signal.basic(window.localStorage.getItem('lastSaveId'))
const isRunning = Signal.basic(false)
const gamesInStorage = Signal.basic(Object.keys(window.localStorage).filter(key => key.startsWith('game-')))
const autosaveInterval = Signal.basic(parseInt(window.localStorage.getItem('autosaveInterval') ?? `${AUTOSAVE_INTERVAL}`) ?? AUTOSAVE_INTERVAL)
const lastSaveTime = Signal.basic(null)
const saveOnExit = Signal.basic(JSON.parse(window.localStorage.getItem('saveOnExit') ?? 'true'))

const update = {
    isRunning: isRunning.update,
    autosaveInterval: autosaveInterval.update,
    saveOnExit: saveOnExit.update,
}

const listen = {
    autosaveInterval: autosaveInterval.listen,
    lastSaveTime: lastSaveTime.listen,
    saveOnExit: saveOnExit.listen,
}

const state = {
    get gameId() { return gameId.value },
    get autosaveInterval() { return autosaveInterval.value },
}

const initialize = async (clickResume: FunctionVoid) => {
    setGameIdFromUrl()
    window.addEventListener('popstate', () => {
        if (isRunning.value) {
            if (saveOnExit.value) {
                save()
            }
            window.location.reload()
        } else {
            setGameIdFromUrl()
        }
    })
    window.addEventListener('beforeunload', () => {
        if (isRunning.value && saveOnExit.value) {
            save()
        }
    })


    derived.gameData.listen((data:string) => {
        if (data) {
            document.querySelector('.load')?.addEventListener('click', clickResume)
            document.querySelector('.load')?.classList.remove('disabled')
        }

        return () => {
            document.querySelector('.load')?.classList.add('disabled')
        }
    })

    gamesToSync.listen((items: string[]) => {
        const newValue = items || []
        window.localStorage.setItem('needsSync', JSON.stringify(newValue))
    })

    lastSaveId.listen((id: string) => {
        window.localStorage.setItem('lastSaveId', id || '')
    })
    autosaveInterval.listen((interval: number) => {
        window.localStorage.setItem('autosaveInterval', `${interval}`)
    })
    saveOnExit.listen((value: boolean) => {
        window.localStorage.setItem('saveOnExit', `${value}`)
    })

    isRunning.listen((value: boolean) =>
        value && autosaveInterval.listen((interval: number) => {
            console.log('setting interval', interval)
            if (typeof interval === 'number' && interval > 0) {
                const clearId = setInterval(autosave, interval)
                return () => {
                    clearInterval(clearId)
                }
            }
        }))


    if (SAVE_TO_REMOTE) {
        await Promise.all(
            gamesToSync.value.map((id: string) => {
                const data = loadFromStorage(id)
                if (data) {
                    return saveToRemote(id, data).then(() => {
                        gamesToSync.update(gamesToSync.value.filter((item: string) => item !== id))
                    }).catch(e => {
                        Message.savegame.error('Could not sync to server', id, e)
                    })
                } else {
                    Message.savegame.error('Could not sync to server, no data found for', id)
                    gamesToSync.update(gamesToSync.value.filter((item: string) => item !== id))
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

const duplicate = async () => {
    const data = await Record.serializeAsync()
    const result = await fetch('/api/game/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: Tracking.getUserId(), data })
    })
    const response = await result.json()

    if (data) {
        if (response.redirect) {
            window.location.reload()
            window.open(response.redirect, '_blank')
        }
    }

}

const saveToRemote = async (id: string, data: string) => {
    const body = JSON.stringify({
        id,
        game: data,
    })

    await fetch('/api/game/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body,
    })

    Message.savegame.log('Synced savegame to server', id)
}

const saveLocal = (id: string, data: string) => {
    const key = `game-${id}`
    try {
        window.localStorage.setItem(key, data)
    } catch(e) {
        Message.savegame.log('Could not save to local storage, removing other games and retry')
        const doNotDelete = gamesToSync.value.map((otherId: string) => `game-${otherId}`)
        gamesInStorage.value
            .filter((key: string) => !doNotDelete.includes(key))
            .forEach((key: string) => window.localStorage.removeItem(key))

        window.localStorage.setItem(key, data)
    }

    gamesInStorage.update([...gamesInStorage.value, key])
    lastSaveId.update(id)
}

const loadFromStorage = (id: string) => {
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


const load = async (gameId: string) => {
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
        Signal.select(({ id, isRunning }: any) => !isRunning ? id : null),
        Signal.await(load),
    ),
    name: Signal.state(
        gameId.listen,
        Signal.select((id: string) => id?.split('--')[1]),
        Signal.select((name: string) => name && name[0].toUpperCase() + name.slice(1)),
    )
}


export default {
    start,
    duplicate,
    derived,
    update,
    listen,
    state,
    initialize,
    save,
    asyncSave,
    autosave,
}