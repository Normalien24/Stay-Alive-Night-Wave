export class MobileControls {
  // actions: { harvest, toggleBuild, toggleShop, toggleWeapon }
  constructor(input, actions = {}) {
    this._input   = input
    this._actions = actions
    this._touchId = null
    this._stickOrigin = { x: 0, y: 0 }
    this._stickRadius = 55
    this._container = null
    this._thumb = null

    this.enabled = this._isTouchDevice()
    this._createToggleBtn()
    if (this.enabled) this._buildUI()
  }

  _isTouchDevice() {
    return ('ontouchstart' in window) || navigator.maxTouchPoints > 0
  }

  // ── Toggle button (always visible) ─────────────────────
  _createToggleBtn() {
    const btn = document.createElement('button')
    btn.id = 'ctrl-toggle'
    btn.textContent = this.enabled ? '🖥 PC Mode' : '📱 Mobile'
    document.body.appendChild(btn)
    this._toggleBtn = btn

    const toggle = (e) => {
      e?.preventDefault()
      this.enabled = !this.enabled
      btn.textContent = this.enabled ? '🖥 PC Mode' : '📱 Mobile'
      if (this.enabled) {
        this._buildUI()
      } else {
        this._input.clearVirtualKeys()
        this._destroyUI()
      }
    }

    btn.addEventListener('touchend', toggle, { passive: false })
    btn.addEventListener('click', toggle)
  }

  // ── Build the on-screen controls ───────────────────────
  _buildUI() {
    if (this._container) return

    const c = document.createElement('div')
    c.id = 'mobile-ui'
    document.body.appendChild(c)
    this._container = c

    // Joystick
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

    // Action buttons — each directly calls a game action, NO virtual key timing issues
    const btnDefs = [
      { icon: '⚔️', id: 'btn-attack',  action: 'attack',       big: true },
      { icon: '🌿', id: 'btn-harvest', action: 'harvest'                 },
      { icon: '🏗',  id: 'btn-build',   action: 'toggleBuild'            },
      { icon: '🏪', id: 'btn-shop',    action: 'toggleShop'             },
      { icon: '🔄', id: 'btn-weapon',  action: 'toggleWeapon'           },
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
        btn.classList.add('pressed')
        if (def.action === 'attack') {
          this._input.setVirtualMouseDown(0, true)
        } else {
          // Direct callback — no frame-timing dependency
          this._actions[def.action]?.()
        }
      }, { passive: false })

      btn.addEventListener('touchend', e => {
        e.preventDefault()
        btn.classList.remove('pressed')
        if (def.action === 'attack') this._input.setVirtualMouseDown(0, false)
      }, { passive: false })

      btn.addEventListener('touchcancel', () => {
        btn.classList.remove('pressed')
        if (def.action === 'attack') this._input.setVirtualMouseDown(0, false)
      })

      btnWrap.appendChild(btn)
    }
  }

  _destroyUI() {
    this._container?.remove()
    this._container = null
    this._thumb = null
  }

  // ── Joystick ────────────────────────────────────────────
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
      if (t.identifier === this._touchId) this._moveStick(t.clientX, t.clientY)
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
    const clamped = Math.min(dist, this._stickRadius)
    const angle = Math.atan2(dy, dx)

    if (this._thumb) {
      this._thumb.style.transform =
        `translate(calc(-50% + ${Math.cos(angle) * clamped}px), calc(-50% + ${Math.sin(angle) * clamped}px))`
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
