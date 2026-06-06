import * as THREE from 'three'
import { Building } from './Building.js'
import { BUILDINGS } from '../constants.js'
import { Bullet } from '../projectiles/Bullet.js'

export class Tower extends Building {
  constructor(scene, assets, gx, gz, grid) {
    super(scene, assets, 'tower', gx, gz, grid, 'tower')
    const cfg = BUILDINGS.tower
    this.health    = cfg.hp
    this.maxHealth = cfg.hp
    this.range     = cfg.range
    this.fireRate  = cfg.fireRate
    this.damage    = cfg.damage
    this.level     = 1
    this._shootTimer = 0
    this._assets   = assets
    this._bullets  = []  // will be merged into Game's bullet list
  }

  update(delta, zombies, scene) {
    super.update(delta)
    if (!this.alive) return
    this._shootTimer = Math.max(0, this._shootTimer - delta)

    if (this._shootTimer > 0) return

    // Find nearest zombie in range
    let nearest = null
    let nearestDist = Infinity
    for (const z of zombies) {
      if (!z.alive) continue
      const dx = z.position.x - this.position.x
      const dz = z.position.z - this.position.z
      const d = Math.sqrt(dx*dx + dz*dz)
      if (d < this.range && d < nearestDist) {
        nearestDist = d
        nearest = z
      }
    }

    if (nearest) {
      this._shootTimer = 1 / this.fireRate
      const dir = new THREE.Vector3(
        nearest.position.x - this.position.x,
        0,
        nearest.position.z - this.position.z
      ).normalize()
      const origin = this.position.clone().add(new THREE.Vector3(0, 2.5, 0))
      const bullet = new Bullet(scene, this._assets, origin, dir, this.damage, 'tower')
      this._bullets.push(bullet)

      // Rotate barrel toward target
      const barrel = this.mesh.getObjectByName('barrel')
      if (barrel) {
        this.mesh.rotation.y = -Math.atan2(dir.x, dir.z)
      }
    }
  }

  upgrade(upg) {
    this.level     += 1
    this.range     += upg.rangeBonus
    this.damage    += upg.damageBonus
    this.fireRate  += upg.fireRateBonus
    // Tint mesh to indicate level
    const colors = [0x999966, 0x66aaff, 0xff8822]
    this.mesh.traverse(c => {
      if (c.isMesh && c.material) c.material.color.setHex(colors[this.level - 1] || 0xff8822)
    })
  }
}
