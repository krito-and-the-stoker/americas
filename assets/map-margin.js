import gulp from 'gulp'
import sharp from 'sharp'
import { Transform } from 'stream'
import rename from 'gulp-rename' // Import the rename utility

const SRC_FILE = './images/map.png'
const TARGET_DIR = './images/map/' // Target directory
const TARGET_FILE_NAME = 'tilesWithMargin.png' // The final file name

const tileSize = 64
const marginSize = 2
const rows = 32 + 16 // Adjust based on your sprite sheet
const columns = 16 // Adjust based on your sprite sheet
const newTileSize = tileSize + marginSize * 2; // Calculate the new tile size including the margin
const outputWidth = columns * newTileSize; // Calculate the total width of the output image
const outputHeight = rows * newTileSize; // Calculate the total height of the output image

const calculateTileWithMargin = async (tile) => {
   const left = await tile
        .clone()
        .extract({ left: 0, top: 0, width: 1, height: tileSize })
        .toBuffer()
    const right = await tile
        .clone()
        .extract({ left: tileSize - 1, top: 0, width: 1, height: tileSize })
        .toBuffer()
    const top = await tile
        .clone()
        .extract({ left: 0, top: 0, width: tileSize, height: 1 })
        .toBuffer()
    const bottom = await tile
        .clone()
        .extract({ left: 0, top: tileSize - 1, width: tileSize, height: 1 })
        .toBuffer()

    const main = await tile.toBuffer()

    const extendedTile = await sharp({
        create: {
            width: newTileSize,
            height: newTileSize,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    }).composite([{
        input: left,
        top: marginSize,
        left: 0
    }, {
        input: left,
        top: marginSize,
        left: 1
    }, {
        input: right,
        top: marginSize,
        left: newTileSize - marginSize + 1
    }, {
        input: right,
        top: marginSize,
        left: newTileSize - marginSize - 1 + 1
    }, {
        input: top,
        top: 0,
        left: marginSize
    }, {
        input: top,
        top: 1,
        left: marginSize
    }, {
        input: bottom,
        top: newTileSize - marginSize + 1,
        left: marginSize
    }, {
        input: bottom,
        top: newTileSize - marginSize - 1 + 1,
        left: marginSize
    }, {
        input: main,
        top: marginSize,
        left: marginSize
    }])
    .png()
    .toBuffer()

    return extendedTile
}

export default function () {
    return gulp.src(SRC_FILE)
         .pipe(new Transform({
            objectMode: true,
            async transform(file, _, callback) {
                const image = sharp(file.contents)
                const tiles = []

                // Loop through each tile position
                for (let y = 0; y < rows; y++) {
                    for (let x = 0; x < columns; x++) {
                        const tile = image
                            .clone()
                            .extract({ left: x * tileSize, top: y * tileSize, width: tileSize, height: tileSize }) // Extract each tile based on its position

                        const result = calculateTileWithMargin(tile)
                        tiles.push(result)
                    }
                }

                const buffers = await Promise.all(tiles);
                const composedImage = sharp({
                    create: {
                        width: outputWidth,
                        height: outputHeight,
                        channels: 4,
                        background: { r: 0, g: 0, b: 0, alpha: 0 },
                    }
                })
                .png({
                    compressionLevel: 9
                })
                .composite(buffers.map((buf, idx) => ({
                    input: buf,
                    top: Math.floor(idx / columns) * newTileSize,
                    left: (idx % columns) * newTileSize
                })))

                file.contents = await composedImage.toBuffer()
                callback(null, file)
            }
        }))
        .pipe(rename(TARGET_FILE_NAME)) // Rename the final file
        .pipe(gulp.dest(TARGET_DIR)) // Output to the target directory
}
