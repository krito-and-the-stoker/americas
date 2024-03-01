// import intro from 'pug-loader!src/pages/intro.pug'

const preload = () => {
  const img = document.createElement('img')
  img.src = '/images/intro-king.jpg'
}

const text =
  'Anno domini 1607<br>I, the king of England,<br>give you the order to sail to the new world. Claim this land for the glory of England. Build settlements to establish a foothold and explore the lands riches!'

const create = () =>
  new Promise(resolve => {
    const container = document.querySelector('#intro .audience')
    container.innerHTML = text
    container.addEventListener('click', () => {
      container.classList.remove('visible')
      resolve()
    })

    requestAnimationFrame(() => {
      container.classList.add('visible')
    })
  })

export default { create, preload }
