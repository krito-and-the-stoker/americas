const capture = error => {
  console.error('Captured error:', error)

  if (window.location.hostname === 'localhost') {
    // throw early in development
    throw error
  }

  // future TODO:
  // Send the error to our api together with previous messages, user agent and savegame
}

export default {
  capture,
}
