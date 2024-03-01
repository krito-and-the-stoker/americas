import Record from 'util/record'
import Savegame from 'util/savegame'
import Dialog from 'view/ui/dialog'
import Message from 'util/message'
import Tracking from 'util/tracking'

// const THROW_ERROR = window.location.hostname === 'localhost'
const THROW_ERROR = false

let sending = Promise.resolve()
const show = error => {
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

const handle = error => {
    show(error)
    send(error)
}

const initialize = () => {
    const errorHandleCallback = e => {
        e.preventDefault()
        if (e.error) {
            console.error(e.error)
            handle(e.error)
            return
        }
        if (e.reason) {
            console.error(e.reason)
            handle(e.reason)
            return
        }

        console.error('Captured undefined error event', e)
    }

    window.addEventListener('error', errorHandleCallback)
    window.addEventListener('unhandledrejection', errorHandleCallback)
}

export default {
    initialize
}
