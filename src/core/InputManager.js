export class InputManager {
  constructor() {
    this._held = new Set()
    this._pressed = new Set()
    this._released = new Set()
    this._consumed = new Set()
    this.mouseButtons = 0
    this.mouseDelta = { x: 0, y: 0 }
    this.mousePos = { x: 0, y: 0 }
    this.scrollDelta = 0
    this._rawDelta = { x: 0, y: 0 }
    this._rawScroll = 0
    this._prevPressed = new Set()

    window.addEventListener('keydown', e => {
      const k = e.code
      if (!this._held.has(k)) this._pressed.add(k)
      this._held.add(k)
    })
    window.addEventListener('keyup', e => {
      const k = e.code
      this._held.delete(k)
      this._released.add(k)
    })
    window.addEventListener('mousedown', e => { this.mouseButtons |= (1 << e.button) })
    window.addEventListener('mouseup',   e => { this.mouseButtons &= ~(1 << e.button) })
    window.addEventListener('mousemove', e => {
      this._rawDelta.x += e.movementX
      this._rawDelta.y += e.movementY
      this.mousePos.x = e.clientX
      this.mousePos.y = e.clientY
    })
    window.addEventListener('wheel', e => { this._rawScroll += e.deltaY }, { passive: true })
    window.addEventListener('contextmenu', e => e.preventDefault())
  }

  update() {
    this.mouseDelta.x = this._rawDelta.x
    this.mouseDelta.y = this._rawDelta.y
    this.scrollDelta  = this._rawScroll
    this._rawDelta.x  = 0
    this._rawDelta.y  = 0
    this._rawScroll   = 0
    this._pressed.clear()
    this._released.clear()
    this._consumed.clear()
  }

  isDown(code)      { return this._held.has(code) }
  wasPressed(code)  { return this._pressed.has(code) && !this._consumed.has(code) }
  wasReleased(code) { return this._released.has(code) }
  consumePress(code){ this._consumed.add(code) }

  isMouseDown(btn)  { return (this.mouseButtons & (1 << btn)) !== 0 }
}
