import * as THREE from 'three'
import { bus } from '../EventBus.js'
import { EVENTS } from '../constants.js'

export class Building {
  constructor(scene, assets, type, gx, gz, grid, meshKey) {
    this.type = type
    this.scene = scene
    this.alive = true
    this.gridCells = [{ gx, gz }]

    const factory = assets.get(meshKey || type)
    this.mesh = factory()
    const { x, z } = grid.cellToWorld(gx, gz)
    this.position = new THREE.Vector3(x, 0, z)
    this.mesh.position.copy(this.position)
    scene.add(this.mesh)

    this._healthBar = this._makeHealthBar(scene)
  }

  _makeHealthBar(scene) {
    const canvas = document.createElement('canvas')
    canvas.width = 64; canvas.height = 8
    this._hbCtx = canvas.getContext('2d')
    this._hbTexture = new THREE.CanvasTexture(canvas)
    const mat = new THREE.SpriteMaterial({ map: this._hbTexture, depthTest: false })
    const sprite = new THREE.Sprite(mat)
    sprite.scale.set(1.8, 0.22, 1)
    scene.add(sprite)
    this._updateHealthBar()
    return sprite
  }

  _updateHealthBar() {
    if (!this._hbCtx) return
    const ctx = this._hbCtx
    ctx.clearRect(0, 0, 64, 8)
    ctx.fillStyle = '#300'
    ctx.fillRect(0, 0, 64, 8)
    const pct = Math.max(0, this.health / this.maxHealth)
    ctx.fillStyle = pct > 0.5 ? '#0a0' : pct > 0.25 ? '#aa0' : '#a00'
    ctx.fillRect(1, 1, Math.round(62 * pct), 6)
    this._hbTexture.needsUpdate = true
  }

  takeDamage(amount) {
    if (!this.alive) return
    this.health = Math.max(0, this.health - amount)
    this._updateHealthBar()
    if (this.health <= 0) this._destroy()
  }

  _destroy() {
    this.alive = false
    this.scene.remove(this.mesh)
    this.scene.remove(this._healthBar)
    bus.emit(EVENTS.BUILDING_DESTROYED, { building: this })
  }

  update(delta) {
    if (this.alive) {
      this._healthBar.position.set(this.position.x, this.position.y + 3, this.position.z)
    }
  }
}
