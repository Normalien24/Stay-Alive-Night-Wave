import { Building } from './Building.js'
import { BUILDINGS } from '../constants.js'

export class Trap extends Building {
  constructor(scene, assets, gx, gz, grid) {
    super(scene, assets, 'trap', gx, gz, grid, 'trap')
    const cfg = BUILDINGS.trap
    this.health    = cfg.hp
    this.maxHealth = cfg.hp
    this.aoeRadius = cfg.aoeRadius
    this.damage    = cfg.damage
    this.charges   = cfg.charges
    this._cooldown = 0
  }

  update(delta, zombies) {
    super.update(delta)
    if (!this.alive || this.charges <= 0) return
    this._cooldown = Math.max(0, this._cooldown - delta)
    if (this._cooldown > 0) return

    for (const z of zombies) {
      if (!z.alive) continue
      const dx = z.position.x - this.position.x
      const dz = z.position.z - this.position.z
      if (Math.sqrt(dx*dx + dz*dz) <= this.aoeRadius) {
        // Trigger AoE
        for (const zz of zombies) {
          if (!zz.alive) continue
          const dx2 = zz.position.x - this.position.x
          const dz2 = zz.position.z - this.position.z
          if (Math.sqrt(dx2*dx2 + dz2*dz2) <= this.aoeRadius) {
            zz.takeDamage(this.damage)
          }
        }
        this.charges--
        this._cooldown = 2.0
        if (this.charges <= 0) {
          // Dim the mesh to show depleted
          this.mesh.traverse(c => {
            if (c.isMesh) c.material.opacity = 0.4
          })
        }
        break
      }
    }
  }
}
