import { v4 as uuidv4 } from 'uuid'

const getUserId = () => {
  let userId = window.localStorage?.getItem('userId')
  if (!userId) {
    userId = uuidv4()
    window.localStorage?.setItem('userId', userId)
  }

  return userId
}

const trackEvent = async name => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('Localhost: Event tracking skipped')
    return
  }
  await fetch('/api/event', {
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
      return response.json()
    })
    .then(data => console.log('Success:', data))
    .catch(error => console.error('Error:', error))
}

const pageView = () => trackEvent('PageView')
const newGame = () => trackEvent('NewGame')
const resumeGame = () => trackEvent('ResumeGame')
const autosave = () => trackEvent('Autosave')

export default {
  pageView,
  newGame,
  resumeGame,
  autosave,
}
