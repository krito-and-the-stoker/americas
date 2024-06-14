import Record from 'util/record'
import Tracking from 'util/tracking'
import Message from 'util/message'
import Events from 'util/events'
import $ from 'signal-chain'

import Time from 'timeline/time'

import { FunctionVoid, Maybe } from 'util/types'

const SAVE_TO_LOCAL_STORAGE = true
const SAVE_TO_REMOTE = true
const AUTOSAVE_INTERVAL = 5 * 60 * 1000 // autosave every 5 minutes


const gameId = $.primitive.create<string | null>(null)
const gamesToSync = $.primitive.create<string[]>(JSON.parse(window.localStorage.getItem('needsSync') || '[]'))
const lastSaveId = $.primitive.create(window.localStorage.getItem('lastSaveId'))
const isRunning = $.primitive.create(false)
const gamesInStorage = $.primitive.create(Object.keys(window.localStorage).filter(key => key.startsWith('game-')))
const autosaveInterval = $.primitive.create(parseInt(window.localStorage.getItem('autosaveInterval') ?? `${AUTOSAVE_INTERVAL}`) ?? AUTOSAVE_INTERVAL)
const lastSaveTime = $.primitive.create<number | null>(null)
const saveOnExit = $.primitive.create<boolean>(JSON.parse(window.localStorage.getItem('saveOnExit') ?? 'true'))

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
    get saveOnExit() { return saveOnExit.value },
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
        window.localStorage.setItem('lastSaveId', id || '')
    })
    autosaveInterval.listen(interval => {
        window.localStorage.setItem('autosaveInterval', `${interval}`)
    })
    saveOnExit.listen(value => {
        window.localStorage.setItem('saveOnExit', `${value}`)
    })

    isRunning.listen(value =>
        value && autosaveInterval.listen((interval: number) => {
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
                    return saveToRemote(id, data).then(ok => {
                        if (ok) {
                            gamesToSync.update(gamesToSync.value.filter((item: string) => item !== id))
                        }
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
    const data = Record.serialize()
    const result = await fetch('/api/game/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: Tracking.getUserId(), data })
    })
    const response = await result.json()

    if (response?.redirect) {
        window.open(response.redirect, '_blank')
        if (!Time.state.paused) {
            Time.pause()
        }
    }
}

const saveToRemote = async (id: string, data: string) => {
    const body = JSON.stringify({
        id,
        game: data,
    })

    const result = await fetch('/api/game/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body,
    }).then(res => res.ok).catch(e => {
        Message.savegame.error(e)
        return false
    })


    Message.savegame.log('Synced savegame to server', id)
    return result
}

const saveLocal = (id: string, data: string): boolean => {
    const key = `game-${id}`
    try {
        window.localStorage.setItem(key, data)
    } catch(e) {
        Message.savegame.log('Could not save to local storage, removing other games and retry')
        const doNotDelete = gamesToSync.value.map((otherId: string) => `game-${otherId}`)
        gamesInStorage.value
            .filter((key: string) => !doNotDelete.includes(key))
            .forEach((key: string) => window.localStorage.removeItem(key))

        try {
            window.localStorage.setItem(key, data)
        } catch(e) {
            return false
        }
    }

    gamesInStorage.update([...gamesInStorage.value, key])
    lastSaveId.update(id)

    return true
}

const loadFromStorage = (id: string) => {
    return window.localStorage.getItem(`game-${id}`)
}

const save = (savegame = null) => {
    Message.savegame.log('Saving...', gameId.value)
    if (!gameId.value) {
        Message.savegame.error('Could not save: No game id')
        return
    }
    const data = savegame || Record.serialize()
    if (SAVE_TO_LOCAL_STORAGE) {
        if (!saveLocal(gameId.value, data)) {
            Message.savegame.warn('Could not save to local storage.')
        }
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
    if (!gameId.value) {
        Message.savegame.error('Could not save: No game id')
        return
    }

    const data = await Record.serializeAsync()
    if (SAVE_TO_LOCAL_STORAGE) {
        Message.savegame.log('Saving to local storage...')
        if (!saveLocal(gameId.value, data)) {
            Message.savegame.error('Could not save to local storage.')
        }
    }
    if (SAVE_TO_REMOTE) {
        Message.savegame.log('Saving to remote...')
        const neededSync = gamesToSync.value.includes(gameId.value)
        const ok = await saveToRemote(gameId.value, data)

        if (ok && neededSync) {
            gamesToSync.update(gamesToSync.value.filter((item: string) => item !== gameId.value))
        }
        if (!ok && !neededSync) {
            gamesToSync.update([...gamesToSync.value, gameId.value])
        }

        // if ok and not needed sync, it doesn't need sync now -> do nothing
        // if not okay and needed sync, it still needs sync now -> do nothing
    }

    lastSaveTime.update(Date.now())
    Message.savegame.log(`Entities saved to local storage and remote using ${Math.round(data.length / 1024)} kb.`)
}

const autosave = async () => {
    await asyncSave()
    Tracking.autosave()
}


const load = async (gameId: Maybe<string>): Promise<Maybe<string>> => {
    if (!gameId) {
        return undefined
    }

    let error = []

    try {
        if (SAVE_TO_REMOTE && gameId && !gamesToSync.value.includes(gameId)) {
            const result = await fetch('/api/game/load', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: gameId })
            })

            const data = await result.json()

            if (data.game) {
                try {
                    Message.savegame.log('Savegame found on server', gameId)
                    return data.game
                } catch (e) {
                    Message.savegame.error('Error parsing savegame', e)
                }
            }
        }
    } catch(e) {
        error.push(e)
    }

    try {
        if (SAVE_TO_LOCAL_STORAGE && gameId) {
            const data = loadFromStorage(gameId)

            if (data) {
                Message.savegame.log('Savegame found in local storage', gameId)
                return data
            }
        }
    } catch(e) {
        error.push(e)
    }

    if (error.length) {
        throw error
    }

    Message.savegame.warn('No savegame found', gameId)
}

const derived = {
    gameData: $.primitive.connect(
        $.combine(
            gameId.listen,
            isRunning.listen
        ),
        $.passIf(([_, isRunning]) => !isRunning),
        $.select(([id]) => id),
        $.await.latest($.select(load)),
        $.type.isError(
            $.effect(error => Message.savegame.error('Failed to load game data:', error)),
            $.emit(null)
        )
    ),
    name: $.primitive.connect(
        gameId.listen,
        $.select(id => id?.split('--')[1]),
        $.select(name => name && name[0].toUpperCase() + name.slice(1)),
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