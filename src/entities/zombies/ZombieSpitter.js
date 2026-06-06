import * as THREE from 'three'
import { Zombie } from './Zombie.js'
import { SpitProjectile } from '../../projectiles/SpitProjectile.js'

export class ZombieSpitter extends Zombie {
  constructor(scene, assets, pathfinding, player, hpMult, dmgMult) {
    super(scene, assets, 'spitter', pathfinding, player, hpMult, dmgMult)
    this._assets = assets
    this._projectiles = []
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

    // Spitter keeps distance; only attack from range
    if (dist > this.attackRange * 0.85 && this._attackTimer <= 0) {
      this._attackTimer = this._attackInterval
      const dir = new THREE.Vector3(dx, 0.1, dz).normalize()
      const origin = this.position.clone().add(new THREE.Vector3(0, 1.2, 0))
      const spit = new SpitProjectile(this._scene, this._assets, origin, dir, this.damage)
      this._projectiles.push(spit)
    }

    // Move to maintain distance
    if (dist < this.attackRange * 0.5) {
      // Too close — back away
      this.position.x -= (dx / dist) * this.speed * delta
      this.position.z -= (dz / dist) * this.speed * delta
    }
  }

  update(delta, projectiles, scene, assets) {
    super.update(delta, projectiles, scene, assets)
    // Transfer own spit projectiles to the shared list
    for (const p of this._projectiles) {
      if (p.alive) projectiles.push(p)
    }
    this._projectiles = []
  }
}
