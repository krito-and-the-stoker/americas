import LZString from 'lz-string'
import FileSaver from 'file-saver'

import Version from 'version/version.json'

import Util from 'util/util'
import PathFinder from 'util/pathFinder'
import Message from 'util/message'
import Events from 'util/events'
import Tracking from 'util/tracking'

import Time from 'timeline/time'

import Building from 'entity/building'
import Colonist from 'entity/colonist'
import Colony from 'entity/colony'
import Construction from 'entity/construction'
import Europe from 'entity/europe'
import Forecast from 'entity/forecast'
import MapEntity from 'entity/map'
import Market from 'entity/market'
import Owner from 'entity/owner'
import Production from 'entity/production'
import Settlement from 'entity/settlement'
import Storage from 'entity/storage'
import Tile from 'entity/tile'
import Trade from 'entity/trade'
import Treasure from 'entity/treasure'
import Tribe from 'entity/tribe'
import Unit from 'entity/unit'

const REFERENCE_KEY = 'referenceId'

const SAVE_TO_LOCAL_STORAGE = true
const USE_COMPRESSION = false
const USE_WEBWORKER = false

let lastSave = null

let idCounter = 0
const makeId = () => (idCounter += 1)

let worker = null
let autosaveInProgress = false
let records = []
let snapshot = { entities: [] }
let globals = {}
let tiles = []
let listeners = {}
const add = (type, entity) => {
  entity.referenceId = makeId()
  records.push({
    id: entity.referenceId,
    entity,
    type,
    destroy: update(type, entity),
  })
}

const remove = entity => {
  const record = records.find(record => record.entity === entity)
  if (!record) {
    Message.record.warn('cannot remove, entity not found. Possible duplicate removal', entity)
  } else {
    Util.execute(record.destroy)
  }
  records = records.filter(record => record.entity !== entity)
}

const initListeners = type => {
  listeners[type] = []
}

const listen = (type, fn) => {
  if (!listeners[type]) {
    initListeners(type)
  }

  const destroys = []
  records
    .filter(record => record.type === type)
    .forEach(record => {
      const destroy = fn(record.entity)
      destroys.push({
        destroy,
        record,
      })
      record.destroy = [record.destroy, destroy]
    })

  listeners[type].push(fn)

  return () => {
    destroys.forEach(entry => {
      // execute destroys
      Util.execute(entry.destroy)

      // and remove from record
      entry.record.destroy = entry.record.destroy.filter(d => d !== entry.destroy)
    })

    listeners[type] = listeners[type].filter(f => f !== fn)
  }
}

const update = (type, entity) => {
  if (!listeners[type]) {
    initListeners(type)
  }
  return listeners[type].map(fn => fn(entity))
}

const addTile = tile => {
  tiles[tile.index] = tile
}

const setGlobal = (key, value) => {
  globals[key] = value
}
const getGlobal = key => globals[key]

const getAll = type =>
  records.filter(record => record.type === type).map(record => record.entity)

const get = id => records.find(record => record.id === id)

const revive = record => {
  if (record.entity) {
    return record.entity
  }

  if (idCounter < record.id) {
    idCounter = record.id + 1
  }

  record.entity = getModule(record.type).load(record.data)
  record.entity.referenceId = record.id
  record.listeners.forEach(fn => fn(record.entity))
  records.push(record)

  beforeEntitiesLoaded(() => {
    record.destroy = update(record.type, record.entity)
  })

  return record.entity
}

const dump = () => {
  Message.record.log('Records', records)
  Message.record.log('Globals', globals)

  window.Record = {
    add,
    remove,
    listen,
    addTile,
    reference,
    referenceTile,
    dereferenceTile,
    dereference,
    dereferenceLazy,
    entitiesLoaded,
    setGlobal,
    getGlobal,
    save,
    load,
    dump,
    getAll,
    get,
    download,
    upload,
    REFERENCE_KEY,
  }

  window.Building = Building
  window.Colonist = Colonist
  window.Colony = Colony
  window.Construction = Construction
  window.Europe = Europe
  window.Forecast = Forecast
  window.MapEntity = MapEntity
  window.Market = Market
  window.Owner = Owner
  window.Production = Production
  window.Settlement = Settlement
  window.Storage = Storage
  window.Tile = Tile
  window.Trade = Trade
  window.Treasure = Treasure
  window.Tribe = Tribe
  window.Unit = Unit

  window.DEBUG = !window.DEBUG
}

const state = () => ({
  records: records.map(saveSingleRecord).data,
  tiles: tiles.map(saveSingleTile),
  time: Time.save(),
  europe: Europe.save(),
  treasure: Treasure.save(),
  market: Market.save(),
  globals,
})

const reviveTile = (data, index) => {
  const tile = Tile.load(data, index)
  tiles[tile.index] = tile
}

const reference = entity => {
  if (!entity) {
    return null
  }

  if (entity && !entity.referenceId) {
    console.warn('No referenceId on entity', entity)
  }

  return {
    [REFERENCE_KEY]: entity.referenceId,
  }
}

const referenceTile = tile =>
  tile
    ? {
        tileIndex: tile.index,
      }
    : null

const getModule = name =>
  ({
    colonist: Colonist,
    colony: Colony,
    map: MapEntity,
    tile: Tile,
    unit: Unit,
    settlement: Settlement,
    tribe: Tribe,
    owner: Owner,
    building: Building,
  })[name]

const saveSingleRecord = record => ({
  id: record.id,
  type: record.type,
  data: getModule(record.type).save(record.entity),
})

const saveSingleTile = tile => Tile.save(tile)

let tileDictionary = {}
let tileLookup = []
const getTileLookup = tile => {
  const s = tile.join('-')
  if (!tileDictionary[s]) {
    tileDictionary[s] = tileLookup.length
    tileLookup.push(tile)
  }

  return tileDictionary[s]
}

// defaults to identity when no lookup table found
const resolveLookup = index => (tileLookup ? tileLookup[index] : index)

const serialize = () => {
  setGlobal('revision', Version.revision)
  tileDictionary = {}
  tileLookup = []
  const tileIndices = tiles.map(saveSingleTile).map(getTileLookup)
  const content = JSON.stringify({
    game: 'americas',
    revision: Version.revision,
    entities: records.map(saveSingleRecord),
    tileLookup,
    tiles: tileIndices,
    time: Time.save(),
    europe: Europe.save(),
    treasure: Treasure.save(),
    market: Market.save(),
    globals,
  })
  return content
}

const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve))
const serializeAsync = () =>
  new Promise(async resolve => {
    setGlobal('revision', Version.revision)
    tileDictionary = {}
    tileLookup = []

    const data = {
      entities: records.map(saveSingleRecord),
      time: Time.save(),
      tiles: tiles.map(Tile.serializableCopy),
      europe: Europe.save(),
      treasure: Treasure.save(),
      market: Market.save(),
      globals,
    }
    await nextFrame()

    if (autosaveInProgress) {
      return
    }
    autosaveInProgress = true

    if (USE_WEBWORKER && window.Worker) {
      if (!worker) {
        throw new Error('Worker disabled for vite build')
        // worker = new Worker(new URL('entries/worker.js', import.meta.url))
      }

      worker.onmessage = e => {
        autosaveInProgress = false
        resolve(e.data)
      }

      worker.postMessage('clear')
      worker.postMessage({
        entities: data.entities,
        time: data.time,
        europe: data.europe,
        market: data.market,
        treasure: data.treasure,
        globals: data.globals,
      })

      const CHUNK_SIZE = 5000
      await Util.range(Math.ceil(data.tiles.length / CHUNK_SIZE)).reduce(
        (wait, i) =>
          wait
            .then(() => {
              worker.postMessage({
                tiles: data.tiles.slice(
                  CHUNK_SIZE * i,
                  Math.min((i + 1) * CHUNK_SIZE),
                  data.tiles.length
                ),
              })
            })
            .then(nextFrame),
        nextFrame()
      )
      await nextFrame()
      worker.postMessage('save')
    } else {
      await nextFrame()
      data.tiles = tiles.map(saveSingleTile)
      await nextFrame()
      data.tiles = data.tiles.map(getTileLookup)
      await nextFrame()
      ;(data.game = 'americas'), (data.revision = Version.revision)
      ;(data.tileLookup = tileLookup), await nextFrame()
      const content = JSON.stringify(data)
      await nextFrame()
      resolve(content)
    }
  })

const autosave = async () => {
  Message.record.log('Saving...')
  const content = await serializeAsync()
  window.localStorage.setItem('lastSave', content)
  Tracking.autosave()
  Message.record.log(`Entities saved to local storage using ${Math.round(content.length / 1024)} kb.`)
}

const save = () => {
  Message.record.log('Saving...')
  lastSave = serialize()
  if (SAVE_TO_LOCAL_STORAGE) {
    if (USE_COMPRESSION) {
      if (USE_WEBWORKER && window.Worker) {
        // Worker disabled for vite build
        const worker = null; //new Worker(new URL('entries/worker.js', import.meta.url))
        worker.onmessage = e => {
          window.localStorage.setItem('lastSaveCompressed', e.data)
          Message.record.log(`Entities saved to local storage using ${e.data.length} bytes.`)
        }
        worker.postMessage(lastSave)
      } else {
        const compressed = LZString.compress(lastSave)
        window.localStorage.setItem('lastSaveCompressed', compressed)
        Message.record.log(`Entities saved to local storage using ${compressed.length} bytes.`)
      }
    } else {
      window.localStorage.setItem('lastSave', lastSave)
      Message.record.log(`Entities saved to local storage using ${lastSave.length} bytes.`)
    }
  } else {
    Message.record.log(`Entities saved in memory using ${lastSave.length} bytes.`)
  }
  Events.trigger('save')
}

const dereferenceTile = ref => (ref ? tiles[ref.tileIndex] : null)
const dereference = ref => {
  if (!ref) {
    return null
  }
  const referenceId = ref[REFERENCE_KEY]
  const alive = records.find(record => record.id === referenceId)
  if (alive) {
    return alive.entity
  }

  const dead = snapshot.entities.find(record => record.id === referenceId)
  if (dead) {
    return revive(dead)
  }

  Message.record.warn('could not find reference for ', ref, snapshot.entities)
  return null
}
const dereferenceLazy = (ref, fn) => {
  if (!ref) {
    fn(null)
  } else {
    const referenceId = ref[REFERENCE_KEY]
    const alive = records.find(record => record.id === referenceId)
    if (alive) {
      fn(alive.entity)
    } else {
      const dead = snapshot.entities.find(record => record.id === referenceId)
      if (!dead) {
        Message.record.warn('Could not find reference for', ref)
      } else {
        dead.listeners.push(fn)
      }
    }
  }
}

let beforeLoadedListeners = []
let loadedListeners = []
const entitiesLoaded = (fn, priority = 10) =>
  loadedListeners.push({
    fn,
    priority,
  })
const beforeEntitiesLoaded = fn => beforeLoadedListeners.push(fn)

const unserialize = (content, initRenderMapFn = null) => {
  records.forEach(record => Util.execute(record.destroy))
  loadedListeners = []
  records = []
  tiles = []

  snapshot = JSON.parse(content)
  // console.log('Loading', snapshot)
  if (snapshot.game !== 'americas') {
    Message.record.warn('The save game does not appear to be a valid americas save game.')
  }
  if (snapshot.revision !== Version.revision) {
    Message.record.warn(
      'The save games version does not match the version of the game. If you see no errors you can ignore this warning.'
    )
  }
  globals.revision = snapshot.revision
  globals = snapshot.globals
  tileLookup = snapshot.tileLookup
  snapshot.entities.forEach(record => (record.listeners = []))
  MapEntity.prepare()
  snapshot.tiles.map(resolveLookup).forEach(reviveTile)
  MapEntity.load()
  Util.execute(initRenderMapFn)
  snapshot.entities.forEach(revive)
  Time.load(snapshot.time)
  Treasure.load(snapshot.treasure)
  Market.load(snapshot.market)
  Europe.load(snapshot.europe)
  beforeLoadedListeners.forEach(fn => fn())
  loadedListeners.sort((a, b) => a.priority - b.priority).forEach(({ fn }) => fn())
}

const load = (initRenderMap, src = null) => {
  Message.record.log('Loading...')

  if (src) {
    lastSave = src
  } else {
    if (USE_COMPRESSION) {
      lastSave = LZString.decompress(window.localStorage.getItem('lastSaveCompressed'))
    } else {
      lastSave = window.localStorage.getItem('lastSave')
    }
  }

  unserialize(lastSave, initRenderMap)
  PathFinder.initialize()

  Events.trigger('restart')
  Message.record.log('Game loaded')
}

const download = () => {
  save()
  var blob = new Blob([lastSave], { type: 'application/json;charset=utf-8' })
  FileSaver.saveAs(blob, 'americas-save-game.json')
}

const upload = initRenderMap => {
  const input = document.createElement('input')
  input.setAttribute('type', 'file')
  input.setAttribute('accept', 'application/json, .json')
  input.addEventListener('change', () => {
    const file = input.files[0]
    if (file) {
      var reader = new FileReader()
      reader.readAsText(file, 'UTF-8')
      reader.onload = evt => {
        load(initRenderMap, evt.target.result)
        document.body.removeChild(input)
      }
      reader.onerror = function (evt) {
        Message.record.log('oh no, something went wrong :/', evt)
        document.body.removeChild(input)
      }
    }
  })
  document.body.appendChild(input)

  const evt = document.createEvent('MouseEvents')
  evt.initEvent('click', true, false)
  input.dispatchEvent(evt)
}

export default {
  add,
  remove,
  listen,
  addTile,
  reference,
  referenceTile,
  dereferenceTile,
  dereference,
  dereferenceLazy,
  entitiesLoaded,
  setGlobal,
  getGlobal,
  autosave,
  save,
  load,
  serialize,
  unserialize,
  dump,
  getAll,
  download,
  upload,
  state,
  REFERENCE_KEY,
}
