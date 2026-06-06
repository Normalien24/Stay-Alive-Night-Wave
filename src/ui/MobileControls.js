export class MobileControls {
  constructor(input) {
    this._input = input
    this._touchId = null
    this._stickOrigin = { x: 0, y: 0 }
    this._stickRadius = 55
    this._container = null
    this._thumb = null
    this._weaponIdx = 1  // 0=melee, 1=ranged

    this.enabled = this._isTouchDevice()
    this._createToggleBtn()
    if (this.enabled) this._buildUI()
  }

  _isTouchDevice() {
    return ('ontouchstart' in window) || navigator.maxTouchPoints > 0
  }

  _createToggleBtn() {
    const btn = document.createElement('button')
    btn.id = 'ctrl-toggle'
    btn.textContent = this.enabled ? '🖥 PC Mode' : '📱 Mobile'
    document.body.appendChild(btn)
    btn.addEventListener('click', () => {
      this.enabled = !this.enabled
      btn.textContent = this.enabled ? '🖥 PC Mode' : '📱 Mobile'
      if (this.enabled) {
        this._buildUI()
      } else {
        this._input.clearVirtualKeys()
        this._destroyUI()
      }
    })
    this._toggleBtn = btn
  }

  _buildUI() {
    if (this._container) return

    const c = document.createElement('div')
    c.id = 'mobile-ui'
    document.body.appendChild(c)
    this._container = c

    // ── Joystick ──────────────────────────────────
    const stickWrap = document.createElement('div')
    stickWrap.className = 'stick-wrap'
    const stickBase = document.createElement('div')
    stickBase.className = 'stick-base'
    const thumb = document.createElement('div')
    thumb.className = 'stick-thumb'
    stickBase.appendChild(thumb)
    stickWrap.appendChild(stickBase)
    c.appendChild(stickWrap)
    this._thumb = thumb
    this._stickBase = stickBase

    stickWrap.addEventListener('touchstart', e => this._stickStart(e), { passive: false })
    stickWrap.addEventListener('touchmove',  e => this._stickMove(e),  { passive: false })
    stickWrap.addEventListener('touchend',   e => this._stickEnd(e),   { passive: false })
    stickWrap.addEventListener('touchcancel',e => this._stickEnd(e),   { passive: false })

    // ── Action buttons ────────────────────────────
    const btnDefs = [
      { icon: '⚔️',   id: 'btn-attack', action: 'attack', big: true  },
      { icon: 'E',    id: 'btn-harvest', action: 'KeyE'              },
      { icon: 'B',    id: 'btn-build',   action: 'KeyB'              },
      { icon: 'F',    id: 'btn-shop',    action: 'KeyF'              },
      { icon: '🔄',   id: 'btn-weapon',  action: 'weapon'            },
    ]

    const btnWrap = document.createElement('div')
    btnWrap.className = 'action-btns'
    c.appendChild(btnWrap)

    for (const def of btnDefs) {
      const btn = document.createElement('button')
      btn.id = def.id
      btn.className = 'mobile-btn' + (def.big ? ' mobile-btn-big' : '')
      btn.textContent = def.icon

      btn.addEventListener('touchstart', e => {
        e.preventDefault()
        e.stopPropagation()
        btn.classList.add('pressed')
        this._onBtnDown(def.action)
      }, { passive: false })

      btn.addEventListener('touchend', e => {
        e.preventDefault()
        e.stopPropagation()
        btn.classList.remove('pressed')
        this._onBtnUp(def.action)
      }, { passive: false })

      btn.addEventListener('touchcancel', e => {
        btn.classList.remove('pressed')
        this._onBtnUp(def.action)
      })

      btnWrap.appendChild(btn)
    }
  }

  _destroyUI() {
    this._container?.remove()
    this._container = null
    this._thumb = null
  }

  _onBtnDown(action) {
    if (action === 'attack') {
      this._input.setVirtualMouseDown(0, true)
    } else if (action === 'weapon') {
      this._weaponIdx = 1 - this._weaponIdx
      this._input.setVirtualKeyPressed(this._weaponIdx === 0 ? 'Digit1' : 'Digit2')
    } else {
      this._input.setVirtualKeyPressed(action)
    }
  }

  _onBtnUp(action) {
    if (action === 'attack') {
      this._input.setVirtualMouseDown(0, false)
    }
  }

  _stickStart(e) {
    e.preventDefault()
    if (this._touchId !== null) return
    const t = e.changedTouches[0]
    this._touchId = t.identifier
    const r = this._stickBase.getBoundingClientRect()
    this._stickOrigin = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    this._moveStick(t.clientX, t.clientY)
  }

  _stickMove(e) {
    e.preventDefault()
    for (const t of e.changedTouches) {
      if (t.identifier === this._touchId) {
        this._moveStick(t.clientX, t.clientY)
      }
    }
  }

  _stickEnd(e) {
    e.preventDefault()
    for (const t of e.changedTouches) {
      if (t.identifier === this._touchId) {
        this._touchId = null
        if (this._thumb) this._thumb.style.transform = 'translate(-50%, -50%)'
        this._input.setVirtualKey('KeyW', false)
        this._input.setVirtualKey('KeyS', false)
        this._input.setVirtualKey('KeyA', false)
        this._input.setVirtualKey('KeyD', false)
      }
    }
  }

  _moveStick(cx, cy) {
    const dx = cx - this._stickOrigin.x
    const dy = cy - this._stickOrigin.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const max  = this._stickRadius
    const clamped = Math.min(dist, max)
    const angle = Math.atan2(dy, dx)

    const ox = Math.cos(angle) * clamped
    const oy = Math.sin(angle) * clamped
    if (this._thumb) {
      this._thumb.style.transform = `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px))`
    }

    const dead = 0.2
    const nx = dist > 8 ? dx / dist : 0
    const ny = dist > 8 ? dy / dist : 0
    this._input.setVirtualKey('KeyW', ny < -dead)
    this._input.setVirtualKey('KeyS', ny >  dead)
    this._input.setVirtualKey('KeyA', nx < -dead)
    this._input.setVirtualKey('KeyD', nx >  dead)
  }
}
