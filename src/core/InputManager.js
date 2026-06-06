export class InputManager {
  constructor() {
    this._physicalHeld = new Set()
    this._virtualHeld  = new Set()
    this._pressed  = new Set()
    this._released = new Set()
    this._consumed = new Set()
    this.mouseButtons = 0
    this._virtualMouseButtons = 0
    this.mouseDelta = { x: 0, y: 0 }
    this.mousePos   = { x: 0, y: 0 }
    this.scrollDelta = 0
    this._rawDelta  = { x: 0, y: 0 }
    this._rawScroll = 0

    window.addEventListener('keydown', e => {
      const k = e.code
      if (!this._physicalHeld.has(k) && !this._virtualHeld.has(k)) this._pressed.add(k)
      this._physicalHeld.add(k)
    })
    window.addEventListener('keyup', e => {
      const k = e.code
      this._physicalHeld.delete(k)
      if (!this._virtualHeld.has(k)) this._released.add(k)
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

  isDown(code)      { return this._physicalHeld.has(code) || this._virtualHeld.has(code) }
  wasPressed(code)  { return this._pressed.has(code) && !this._consumed.has(code) }
  wasReleased(code) { return this._released.has(code) }
  consumePress(code){ this._consumed.add(code) }

  isMouseDown(btn) {
    return ((this.mouseButtons | this._virtualMouseButtons) & (1 << btn)) !== 0
  }

  // ── Virtual input API (used by MobileControls) ──
  setVirtualKey(code, isDown) {
    if (isDown) {
      if (!this._virtualHeld.has(code) && !this._physicalHeld.has(code)) {
        this._pressed.add(code)
      }
      this._virtualHeld.add(code)
    } else {
      if (this._virtualHeld.has(code)) {
        this._virtualHeld.delete(code)
        if (!this._physicalHeld.has(code)) this._released.add(code)
      }
    }
  }

  setVirtualKeyPressed(code) {
    if (!this._consumed.has(code)) this._pressed.add(code)
  }

  setVirtualMouseDown(btn, isDown) {
    if (isDown) this._virtualMouseButtons |=  (1 << btn)
    else        this._virtualMouseButtons &= ~(1 << btn)
  }

  clearVirtualKeys() {
    for (const k of this._virtualHeld) {
      if (!this._physicalHeld.has(k)) this._released.add(k)
    }
    this._virtualHeld.clear()
    this._virtualMouseButtons = 0
  }
}
