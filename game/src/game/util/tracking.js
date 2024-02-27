import { v4 as uuidv4 } from 'uuid'

import Message from 'util/message'


let userId
const getUserId = () => {
  userId = window.localStorage?.getItem('userId')
  if (!userId) {
    userId = uuidv4()
    window.localStorage?.setItem('userId', userId)
  }

  return userId
}

const updateUserId = newValue => {
  userId = newValue
  window.localStorage?.setItem('userId', userId)
}

const trackEvent = async name => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    Message.tracking.log('Localhost: Event tracking skipped')
    return
  }
  await fetch('/api/events/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, userId: getUserId() }),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText)
      }
    })
    // .then(data => Message.tracking.log('Success:', data))
    .catch(error => Message.tracking.error('Error:', error))
}

const pageView = () => trackEvent('PageView')
const newGame = () => trackEvent('NewGame')
const resumeGame = () => trackEvent('ResumeGame')
const autosave = () => trackEvent('Autosave')

export default {
  getUserId,
  updateUserId,
  pageView,
  newGame,
  resumeGame,
  autosave,
}
