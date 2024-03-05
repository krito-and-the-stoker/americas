import { createSignal, createEffect, Switch, Match } from 'solid-js'

import Signal from 'util/signal'
import SaveGame from 'util/savegame'
import TimeView from 'util/timeView'

import style from './Save.module.scss'

function Save() {
    const gameName = Signal.create(SaveGame.derived.name.listen)

    const [isSaving, setIsSaving] = createSignal(false)
    const saveGame = async event => {
        event.preventDefault()

        if (isSaving()) {
            return
        }

        setIsSaving(true)
        await SaveGame.asyncSave()
        setIsSaving(false)
    }

    const [isDuplicating, setIsDuplicating] = createSignal(false)
    const duplicate = async () => {
        setIsDuplicating(true)
        await SaveGame.duplicate()
        setIsDuplicating(false)
    }


    const SIXTY_SECONDS = 60 * 1000
    const intervalValues = {
        NEVER: 0,
        SIXTY_SECONDS,
        FIVE_MINUTES: 5 * SIXTY_SECONDS,
        TEN_MINUTES: 10 * SIXTY_SECONDS,
        THIRTY_MINUTES: 30 * SIXTY_SECONDS,
        DEFAULT: 5 * SIXTY_SECONDS
    }
    let initialInterval = 'DEFAULT'
    for(const [key, value] of Object.entries(intervalValues)) {
        if (value === SaveGame.state.autosaveInterval) {
            initialInterval = key
            break
        }
    }
    const [interval, setInterval] = createSignal(initialInterval)
    const updateInterval = event => {
        setInterval(event.target.value)
        const value = intervalValues[event.target.value] ?? intervalValues.DEFAULT
        SaveGame.update.autosaveInterval(value)
    }

    const nowTime = Signal.basic(Date.now())
    const lastSaveTime = Signal.create(
        Signal.combine({
            lastTime: Signal.source(SaveGame.listen.lastSaveTime),
            nowTime: Signal.source(nowTime.listen),
        }),
        Signal.select(({ lastTime, nowTime }) => lastTime > 0 ? nowTime - lastTime : null),
        Signal.select(
            timeDiff => timeDiff && TimeView.describe(timeDiff, () => { nowTime.update(Date.now()) })
        )
    )

    const saveOnExit = Signal.create(SaveGame.listen.saveOnExit)
    const updateSaveOnExit = event => {
        SaveGame.update.saveOnExit(event.target.checked)
    }


    return <div class={style.save}>
        <div>
            <span>Game {gameName()} - </span>
            <Switch>
                <Match when={isDuplicating()}>
                    <span>Duplicating...</span>
                </Match>
                <Match when={!isDuplicating()}>
                    <a onClick={duplicate} class={style.link}>Duplicate</a>
                </Match>
            </Switch>
        </div>
        <div>
            <span>Autosave Interval:</span>
            <select value={interval()} onChange={updateInterval} class={style.interval}>
                <option value="NEVER">Never</option>
                <option value="SIXTY_SECONDS">60 seconds</option>
                <option value="FIVE_MINUTES">5 minutes</option>
                <option value="TEN_MINUTES">10 minutes</option>
                <option value="THIRTY_MINUTES">30 minutes</option>
            </select>
        </div>
        <div>
            <div>
                <span>Save on exit:</span>
                <input type="checkbox" checked={saveOnExit()} onChange={updateSaveOnExit} />
            </div>
        </div>
        <div>
            <a onClick={saveGame} classList={{[style.link]: true, disabled: isSaving() }}>Save</a>
            <Switch>
                <Match when={isSaving()}>
                    <span> - Saving...</span>
                </Match>
                <Match when={lastSaveTime()}>
                    <span> - Saved {lastSaveTime()}</span>
                </Match>
            </Switch>
        </div>
    </div>
}


export default Save