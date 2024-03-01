import type { Coordinates, Function1 } from 'util/types'
import Util from 'util/util'

type Line = {
  point1: Coordinates
  point2: Coordinates
}


const add = (v: Coordinates, w: Coordinates) => ({
  x: v.x + w.x,
  y: v.y + w.y,
})

const madd = (v: Coordinates, m: number, w: Coordinates) => ({
  x: v.x + m * w.x,
  y: v.y + m * w.y,
})

const mmadd = (l, v: Coordinates, m: number, w: Coordinates) => ({
  x: l * v.x + m * w.x,
  y: l * v.y + m * w.y,
})

const lerp = (v: Coordinates, w: Coordinates, lambda: number) => ({
  x: lambda * v.x + (1.0 - lambda) * w.x,
  y: lambda * v.y + (1.0 - lambda) * w.y,
})

const multiply = (m: number, v: Coordinates) => ({
  x: m * v.x,
  y: m * v.y,
})

const subtract = (v: Coordinates, w: Coordinates) => ({
  x: v.x - w.x,
  y: v.y - w.y,
})

const normalize = (v: Coordinates) => ({
  x: v.x / distance(v),
  y: v.y / distance(v),
})

const normalizeManhatten = (v: Coordinates) => ({
  x: v.x / distanceManhatten(v),
  y: v.y / distanceManhatten(v),
})

const rotate = (alpha: number, v: Coordinates = { x: 1, y: 0 }) => ({
  x: Math.cos(alpha) * v.x - Math.sin(alpha) * v.y,
  y: Math.sin(alpha) * v.x + Math.cos(alpha) * v.y,
})

const rotate90 = (v: Coordinates) => ({
  x: -v.y,
  y: v.x,
})

const product = (v: Coordinates, w: Coordinates = v) => v.x * w.x + v.y * w.y
const vector = (x = 0, y = x) => ({ x, y })

const piecewise = <T>(v: Coordinates, fn: Function1<number, T>) => ({
  x: fn(v.x),
  y: fn(v.y),
})

const round = (v: Coordinates) => piecewise(v, Math.round)

const factorize = (v:Coordinates, n1: Coordinates, n2: Coordinates) => ({
  x: product(v, n1),
  y: product(v, n2),
})

const sqDistance = (v: Coordinates, w: Coordinates = { x: 0, y: 0 }) => product(subtract(w, v))
const distance = (v: Coordinates, w?: Coordinates) => Math.sqrt(sqDistance(v, w))

const distanceManhatten = (v: Coordinates, w: Coordinates = { x: 0, y: 0 }) => {
  const delta = subtract(v, w)
  return Math.max(Math.abs(delta.x), Math.abs(delta.y))
}

const random = (x: number, y: number) => ({
  x: Math.random() * x,
  y: Math.random() * y,
})

const min = (...args: Coordinates[]) => ({
  x: Math.min(...args.map(v => v.x)),
  y: Math.min(...args.map(v => v.y)),
})

const max = (...args: Coordinates[]) => ({
  x: Math.max(...args.map(v => v.x)),
  y: Math.max(...args.map(v => v.y)),
})

const intersect = (line1: Line, line2: Line) => {
  const normal1 = rotate90(subtract(line1.point1, line1.point2))
  const offset1 = product(line1.point1, normal1)
  const normal2 = rotate90(subtract(line2.point1, line2.point2))
  const offset2 = product(line2.point1, normal2)

  return (
    (product(line2.point1, normal1) - offset1) * (product(line2.point2, normal1) - offset1) <
      0 &&
    (product(line1.point1, normal2) - offset2) * (product(line1.point2, normal2) - offset2) < 0
  )
}

const vectorProduct = (v: number[], ...args: Coordinates[]) => ({
  x: Util.sum(v.map((a, i) => a * args[i].x)),
  y: Util.sum(v.map((a, i) => a * args[i].y)),
})

export default {
  add,
  madd,
  mmadd,
  lerp,
  subtract,
  multiply,
  distance,
  sqDistance,
  distanceManhatten,
  normalize,
  normalizeManhatten,
  product,
  rotate,
  rotate90,
  factorize,
  piecewise,
  round,
  random,
  vectorProduct,
  min,
  max,
  intersect,
  vector,
  v: vector,
  w: vector,
}
