import Record from 'util/record'
import Savegame from 'util/savegame'
import Dialog from 'view/ui/dialog'
import Message from 'util/message'

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

    sending = fetch('/api/error/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body,
    }).catch(e => {
        console.error('Could not send error to server', e)
    })

    Message.savegame.log('Synced savegame to server')
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
