import { Game } from './core/Game.js'

const canvas = document.getElementById('canvas')
const game = new Game(canvas)

document.getElementById('start-btn')?.addEventListener('click', () => {
  document.getElementById('main-menu').style.display = 'none'
  game.start()
})

document.getElementById('restart-btn')?.addEventListener('click', () => {
  window.location.reload()
})
