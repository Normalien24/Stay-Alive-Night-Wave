import * as THREE from 'three'
import { Entity } from '../Entity.js'
import { bus } from '../../EventBus.js'
import { EVENTS, ZOMBIE_STATS } from '../../constants.js'

export class Zombie extends Entity {
  constructor(scene, assets, type, pathfinding, player, hpMult = 1, dmgMult = 1) {
    super(scene)
    this.zombieType = type
    const cfg = ZOMBIE_STATS[type]

    this.health      = Math.round(cfg.hp * hpMult)
    this.maxHealth   = this.health
    this.speed       = cfg.speed
    this.damage      = Math.round(cfg.damage * dmgMult)
    this.attackRange = cfg.range
    this.goldDrop    = cfg.goldDrop
    this._attackInterval = cfg.attackInterval
    this._attackTimer    = 0
    this.state      = 'seeking'
    this._target    = player
    this._attackTarget  = null
    this._pathfinding   = pathfinding
    this._player        = player

    const factory = assets.get(`zombie_${type}`) || assets.get('zombie')
    this.mesh = factory()
    this.addToScene()

    // Health bar (sprite)
    this._healthBar = this._makeHealthBar()
    this._scene.add(this._healthBar)
  }

  _makeHealthBar() {
    const canvas = document.createElement('canvas')
    canvas.width = 64; canvas.height = 8
    this._hbCanvas = canvas
    this._hbCtx = canvas.getContext('2d')
    this._hbTexture = new THREE.CanvasTexture(canvas)
    const mat = new THREE.SpriteMaterial({ map: this._hbTexture, depthTest: false })
    const sprite = new THREE.Sprite(mat)
    sprite.scale.set(1.5, 0.22, 1)
    this._updateHealthBar()
    return sprite
  }

  _updateHealthBar() {
    const ctx = this._hbCtx
    ctx.clearRect(0, 0, 64, 8)
    ctx.fillStyle = '#300'
    ctx.fillRect(0, 0, 64, 8)
    const pct = Math.max(0, this.health / this.maxHealth)
    ctx.fillStyle = pct > 0.5 ? '#0f0' : pct > 0.25 ? '#ff0' : '#f00'
    ctx.fillRect(1, 1, Math.round(62 * pct), 6)
    this._hbTexture.needsUpdate = true
  }

  update(delta, projectiles, scene, assets) {
    if (!this.alive) return
    this._attackTimer = Math.max(0, this._attackTimer - delta)

    // Rotate toward movement direction
    if (this.state === 'seeking') {
      this._seek(delta)
    } else {
      this._attack(delta)
    }

    this.mesh.position.copy(this.position)
    this._healthBar.position.set(this.position.x, this.position.y + 2.2, this.position.z)
  }

  _seek(delta) {
    // Check if player is in melee range → switch to attack
    const px = this._player.position.x - this.position.x
    const pz = this._player.position.z - this.position.z
    const distToPlayer = Math.sqrt(px*px + pz*pz)

    if (distToPlayer <= this.attackRange) {
      this.state = 'attacking'
      this._attackTarget = this._player
      return
    }

    // Try flow field
    const dir = this._pathfinding.getDirectionAt(this.position.x, this.position.z)
    if (dir && (dir.dx !== 0 || dir.dz !== 0)) {
      this.position.x += dir.dx * this.speed * delta
      this.position.z += dir.dz * this.speed * delta
    } else {
      // Fallback: direct to player
      const len = Math.sqrt(px*px + pz*pz)
      if (len > 0.01) {
        this.position.x += (px / len) * this.speed * delta
        this.position.z += (pz / len) * this.speed * delta
      }
    }

    // If we hit a building, switch to attack it
    if (this._attackTarget && this._attackTarget.alive) {
      this.state = 'attacking'
    }
  }

  _attack(delta) {
    const t = this._attackTarget
    if (!t || !t.alive) {
      this.state = 'seeking'
      this._attackTarget = null
      return
    }

    const dx = t.position.x - this.position.x
    const dz = t.position.z - this.position.z
    const dist = Math.sqrt(dx*dx + dz*dz)
    const range = this.attackRange + (t === this._player ? 0 : 1.2)

    if (dist > range) {
      // Move toward target
      this.position.x += (dx / dist) * this.speed * delta
      this.position.z += (dz / dist) * this.speed * delta
    } else if (this._attackTimer <= 0) {
      this._attackTimer = this._attackInterval
      t.takeDamage(this.damage)
    }
  }

  takeDamage(amount) {
    if (!this.alive) return
    this.health -= amount
    this._updateHealthBar()
    if (this.health <= 0) this._die()
  }

  _die() {
    this.alive = false
    this.removeFromScene()
    this._scene.remove(this._healthBar)
    bus.emit(EVENTS.ZOMBIE_DIED, { zombie: this, position: this.position.clone() })
  }

  destroy() {
    if (!this.alive) return
    this.alive = false
    this.removeFromScene()
    this._scene.remove(this._healthBar)
    // Don't emit ZOMBIE_DIED — this is a forced cleanup, not a kill
  }
}
