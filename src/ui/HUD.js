import { bus } from '../EventBus.js'
import { EVENTS, NIGHT_WARNING_AT, DAY_DURATION, NIGHT_DURATION } from '../constants.js'

export class HUD {
  constructor() {
    this._el = {
      health:    document.getElementById('hud-health-fill'),
      healthTxt: document.getElementById('hud-health-txt'),
      wood:      document.getElementById('hud-wood'),
      stone:     document.getElementById('hud-stone'),
      metal:     document.getElementById('hud-metal'),
      gold:      document.getElementById('hud-gold'),
      day:       document.getElementById('hud-day'),
      phase:     document.getElementById('hud-phase'),
      timer:     document.getElementById('hud-timer'),
      wave:      document.getElementById('hud-wave'),
      alert:     document.getElementById('hud-alert'),
      weapon:    document.getElementById('hud-weapon'),
      controls:  document.getElementById('hud-controls'),
    }
    this._alertTimer = 0

    bus.on(EVENTS.WAVE_START, ({ day }) => this._showAlert(`🌙 NIGHT ${day} — Survive the wave!`, 3))
    bus.on(EVENTS.WAVE_COMPLETE, () => this._showAlert('☀️ Wave cleared! Gather resources...', 3))
    bus.on(EVENTS.DAY_START, () => this._showAlert('☀️ New Day — Build and gather!', 2.5))
  }

  update(player, dayNight, waveManager, delta) {
    if (!player || !dayNight) return

    // Health
    const pct = (player.health / player.maxHealth) * 100
    if (this._el.health) {
      this._el.health.style.width = pct + '%'
      this._el.health.style.background = pct > 50 ? '#22cc44' : pct > 25 ? '#ccaa00' : '#cc2200'
    }
    if (this._el.healthTxt) this._el.healthTxt.textContent = `${Math.round(player.health)}/${player.maxHealth}`

    // Resources
    if (this._el.wood)  this._el.wood.textContent  = player.inventory.wood  || 0
    if (this._el.stone) this._el.stone.textContent = player.inventory.stone || 0
    if (this._el.metal) this._el.metal.textContent = player.inventory.metal || 0
    if (this._el.gold)  this._el.gold.textContent  = player.gold || 0

    // Phase + day
    if (this._el.day)   this._el.day.textContent   = `Day ${waveManager.currentDay || 1}`
    if (this._el.phase) {
      const isNight = dayNight.phase === 'night'
      this._el.phase.textContent = isNight ? '🌙 Night' : '☀️ Day'
      this._el.phase.style.color = isNight ? '#8899ff' : '#ffee44'
    }

    // Timer
    const t = Math.ceil(dayNight.timeRemaining)
    if (this._el.timer) {
      this._el.timer.textContent = `${t}s`
      const warn = dayNight.phase === 'day' && t <= NIGHT_WARNING_AT
      this._el.timer.style.color = warn ? '#ff4444' : '#ffffff'
    }

    // Wave counter
    if (this._el.wave) {
      const alive = waveManager.zombiesAlive
      if (dayNight.phase === 'night') {
        this._el.wave.textContent = `Zombies: ${alive}`
        this._el.wave.style.display = 'block'
      } else {
        this._el.wave.style.display = 'none'
      }
    }

    // Weapon
    if (this._el.weapon) this._el.weapon.textContent = `[${player.equippedWeapon === 'melee' ? '1' : '2'}] ${player.equippedWeapon}`

    // Alert fade
    if (this._alertTimer > 0) {
      this._alertTimer -= delta
      if (this._el.alert) {
        this._el.alert.style.opacity = Math.min(1, this._alertTimer)
        if (this._alertTimer <= 0) this._el.alert.style.display = 'none'
      }
    }
  }

  _showAlert(msg, duration = 3) {
    this._alertTimer = duration
    if (this._el.alert) {
      this._el.alert.textContent = msg
      this._el.alert.style.display = 'block'
      this._el.alert.style.opacity = '1'
    }
  }

  showBuildMode(active) {
    const panel = document.getElementById('build-panel')
    const label = document.getElementById('build-mode-label')
    if (panel) panel.style.display = active ? 'flex' : 'none'
    if (label) label.style.display = active ? 'block' : 'none'
  }

  showShop(active) {
    const panel = document.getElementById('shop-panel')
    if (panel) panel.style.display = active ? 'block' : 'none'
  }
}
