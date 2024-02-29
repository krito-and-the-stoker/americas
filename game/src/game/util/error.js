import Record from 'util/record'
import Savegame from 'util/savegame'
import Dialog from 'view/ui/dialog'
import Message from 'util/message'
import Tracking from 'util/tracking'


let sending = Promise.resolve()
const show = error => {
    console.error('Captured error', error)
    Dialog.open('error.general', {
      error: error.message,
      reload: async () => {
          await sending
          window.location.reload()
      }
    })
}

const send = error => {
    const data = Record.serialize()
    const body = JSON.stringify({
        id: Savegame.state.gameId,
        error: error.message,
        game: data,
    })

    sending = Promise.all([
        fetch('/api/error/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body,
        }).then(() => {
            Message.savegame.log('Sent error with savegame to server')
        })
        .catch(e => {
            console.error('Could not send error to server', e)
        }),
        Tracking.error()
    ])
}

const core = error => {
    show(error)
    send(error)

    throw error
}

const draw = error => {
    show(error)
    send(error)

    throw error
}


export default {
    core, draw
}
