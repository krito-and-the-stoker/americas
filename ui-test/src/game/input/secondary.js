const on = (target, fn) => {
  const handler = async e => {
    e.stopPropagation()
    const handleClick = async () => {
      target.interactive = false
      await fn({
        coords: e.data.global,
        shiftKey: e.data.originalEvent.shiftKey,
      })
      target.interactive = true
    }

    await handleClick()
  }

  target.interactive = true
  target.on('rightdown', handler)

  const unsubscribe = () => {
    target.off('rightdown', handler)
  }

  return unsubscribe
}

const initialize = () => {
  // document.querySelectorAll('canvas').forEach(el => {
  // 	el.addEventListener('contextmenu', e => {
  // 		e.preventDefault()
  // 	})
  // })
  window.oncontextmenu = e => {
    e.preventDefault()
  }
}

initialize()

export default {
  on,
}
