import { Coordinates } from "util/la"

type BaseEntry = {
    position: Coordinates
}

export default <E extends BaseEntry>(entry: E, x: number, y: number, extra = {}) => ({
    ...entry,
    position: {
        x: entry.position.x + x,
        y: entry.position.y + y,
    },
    ...extra,
})