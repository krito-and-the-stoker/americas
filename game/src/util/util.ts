import 'util/polyfills'
import Clone from 'clone'
import * as PIXI from 'pixi.js'

import type { Maybe, Function1, Function2, Coordinates, HasCoordinates } from 'util/types'

import Names from 'data/names.json'

import LA from 'util/la'
import Message from 'util/message'


interface Unit extends HasCoordinates {
  radius: number
  properties: {
    radius: number
  }
}

type RGBColors = {
  r: number
  g: number
  b: number
}


const distance = LA.distance
const inBattleDistance = (unit: Unit, other: Unit) =>
  distance(unit.mapCoordinates, other.mapCoordinates) < 0.5 * unit.radius
const inDistance = (unit: Unit, other: Unit) =>
  distance(unit.mapCoordinates, other.mapCoordinates) < 0.5 * unit.radius
const inRaidDistance = (unit: Unit, other: Unit) =>
  distance(unit.mapCoordinates, other.mapCoordinates) < 0.25 * unit.properties.radius
const inMoveDistance = (unit: Unit, other: Unit) => LA.distanceManhatten(unit.mapCoordinates, other.mapCoordinates) <= 1

const isArray = Array.isArray
const flatten = <T>(array: any[]): T[] => {
  const result = array.flat()
  return result.some(value => isArray(value)) ? flatten(result) : result
}

let names = Names
const tag = () => {
  const name = choose(names)
  names = names.filter(n => n !== name)
  if (names.length === 0) {
    Message.util.warn('Resetting names. Consider using more in future.')
    names = Names
  }

  return name
}

const disordered = <T>(array: T[]): T[] => {
  const copy = [...array]
  array.forEach((_, index) => {
    const swapIndex = Math.floor(Math.random() * copy.length)
    const tmp = copy[index]
    copy[index] = copy[swapIndex]
    copy[swapIndex] = tmp
  })

  return copy
}

const isFunction = (something: any): something is Function => typeof something === 'function'

// const mergeFunctions = funcArray => funcArray.filter(fn => isFunction(fn)).reduce((all, fn) => arg => { all(arg); fn(arg) }, () => {})
// const mergeFunctionsFlat = funcArray => mergeFunctions(flatten(funcArray))
const execute = (something: unknown, ...arg: unknown[]): unknown => {
  if (!something) {
    return null
  }

  if (isFunction(something)) {
    return something(...arg)
  }

  if (isArray(something)) {
    return flatten<Function>(something)
      .filter(isFunction)
      .map(fn => fn(...arg))
  }

  Message.util.warn('unable to execute', something)
  // throw new Error('unable to execute')
}

const makeObject = Object.fromEntries
const clone = <T>(something: T) => Clone(something) as T

const globalScale = (sprite: PIXI.Container<PIXI.DisplayObject>) => {
  let s = sprite
  let scale = s.scale.x
  while (s.parent && s.parent.scale) {
    s = s.parent
    scale *= s.scale.x
  }

  return scale
}

const removeDuplicates = <T>(array: T[]): T[] =>
  array.reduce<T[]>((arr, something) => {
    if (!arr.includes(something)) {
      arr.push(something)
    }
    return arr
  }, [])

const range = (n: number) => (n > 0 ? [...Array(n).keys()] : [])

const quantizedRadius = (coords: Coordinates, radius: number) =>
  range(2 * radius)
    .map(x => Math.round(x + coords.x - radius))
    .map(x =>
      range(2 * radius)
        .map(y => Math.round(y + coords.y - radius))
        .map(y => ({ x, y }))
    )
    .flat()
    .filter(
      ({ x, y }) =>
        (x - coords.x) * (x - coords.x) + (y - coords.y) * (y - coords.y) <= radius * radius
    )

const choose = <T>(array: T[]) => array[Math.floor(Math.random() * array.length)]
const unique = <T>(value: T, index: number, array: T[]) => array.indexOf(value) === index
const uniqueFn = <T>(fn: Function1<T, any>) => (value: T, index: number, array: T[]): boolean => array.findIndex(other => fn(other) == fn(value)) === index
const sum = (array: number[]) => array.reduce((all, single) => all + single, 0)
const average = (array: number[]) => (array.length > 0 ? sum(array) / array.length : 0)

const minDistance = (many: Coordinates[], one: Coordinates ) =>
  distance(
    min(many, other => distance(one, other)) ?? one,
    one
  )
const entityDistance = (one: HasCoordinates, other: HasCoordinates) => distance(one.mapCoordinates, other.mapCoordinates)

function min<T>(many: T[]): Maybe<T>
function min<T>(many: T[], fn: Function1<T, number>): Maybe<T>
function min<T>(many: T[], fn: any = (x: T) => x) {
  return many.reduce<Maybe<T>>((best, test) => (best && fn(best) < fn(test) ? best : test), null)
}

const minPair = <T>(many: T[], some: T[], fn: Function2<T, T, number>) =>
  min(
    many.map(one => ({
      one,
      other: min(some, other => fn(one, other)) as T,
    })),
    ({ one, other }) => fn(one, other)
  )
const minPairValue = <T>(many: T[], some: [], fn: Function2<T, T, number>) => {
  const pair = minPair(many, some, fn)
  return pair && fn(pair.one, pair.other)
}

function max<T>(many: T[]): Maybe<T>
function max<T>(many: T[], fn: Function1<T, number>): Maybe<T>
function max<T>(many: T[], fn: any = (x: T) => x) {
  return many.reduce<Maybe<T>>((best, test) => (best && fn(best) > fn(test) ? best : test), null)
}


const pairs = <T>(many: T[], some: T[]) =>
  many
    .map(one =>
      some.map(other => ({
        one,
        other,
      }))
    )
    .flat()

let currentId = 0
const uid = () => {
  currentId += 1
  return currentId
}


const clamp = (value: number, lower = 0, upper = 1) => Math.min(Math.max(value, lower), upper)
const quantize = (value: number, resolution: number) => resolution * Math.round((1.0 * value) / resolution)
const quantizeDown = (value: number, resolution: number) => resolution * Math.floor((1.0 * value) / resolution)
const quantizeUp = (value: number, resolution: number) => resolution * Math.ceil((1.0 * value) / resolution)

const numberToColor = (number: number) => ({
  r: (number & 0xff0000) / 0xff0000,
  g: (number & 0x00ff00) / 0x00ff00,
  b: (number & 0x0000ff) / 0x0000ff,
})
const colorToNumber = ({ r, g, b }: RGBColors) => Math.round(0xff0000 * r + 0x00ff00 * g + 0x0000ff * b)
const interpolateColors = (number1: number, number2: number, value: number) => {
  const color1 = numberToColor(number1)
  const color2 = numberToColor(number2)
  return colorToNumber({
    r: (1 - value) * color1.r + value * color2.r,
    g: (1 - value) * color1.g + value * color2.g,
    b: (1 - value) * color1.b + value * color2.b,
  })
}

export default {
  clone,
  makeObject,
  tag,
  globalScale,
  range,
  choose,
  isFunction,
  uid,
  execute,
  isArray,
  flatten,
  disordered,
  clamp,
  quantize,
  quantizeDown,
  quantizeUp,
  removeDuplicates,
  unique,
  uniqueFn,
  distance,
  minDistance,
  entityDistance,
  quantizedRadius,
  inBattleDistance,
  inDistance,
  inRaidDistance,
  inMoveDistance,
  min,
  max,
  minPair,
  minPairValue,
  pairs,
  sum,
  average,
  interpolateColors,
}
