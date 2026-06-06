import * as THREE from 'three'
import { WEAKNESSES, MELEE_RANGE, EVENTS } from '../constants.js'
import { bus } from '../EventBus.js'

export class CombatSystem {
  dealDamage(target, amount, damageType = 'ranged') {
    const mult = this._getWeaknessMultiplier(target, damageType)
    target.takeDamage(Math.round(amount * mult))
  }

  _getWeaknessMultiplier(target, damageType) {
    if (!target.zombieType) return 1
    const row = WEAKNESSES[target.zombieType]
    return row ? (row[damageType] ?? 1) : 1
  }

  checkMeleeHit(playerPos, zombies, damage) {
    const hit = []
    for (const z of zombies) {
      if (!z.alive) continue
      const dx = z.position.x - playerPos.x
      const dz = z.position.z - playerPos.z
      if (Math.sqrt(dx*dx + dz*dz) <= MELEE_RANGE) {
        this.dealDamage(z, damage, 'melee')
        hit.push(z)
      }
    }
    return hit
  }

  checkBulletCollisions(bullets, zombies, buildings) {
    for (const b of bullets) {
      if (!b.alive) continue
      // vs zombies
      for (const z of zombies) {
        if (!z.alive) continue
        const dx = b.position.x - z.position.x
        const dz = b.position.z - z.position.z
        if (Math.sqrt(dx*dx + dz*dz) < 0.8) {
          this.dealDamage(z, b.damage, b.damageType)
          b.destroy()
          break
        }
      }
    }
  }

  checkSpitCollisions(projectiles, player) {
    for (const p of projectiles) {
      if (!p.alive || p.owner !== 'zombie') continue
      const dx = p.position.x - player.position.x
      const dz = p.position.z - player.position.z
      if (Math.sqrt(dx*dx + dz*dz) < 0.8) {
        player.takeDamage(p.damage)
        p.destroy()
      }
    }
  }

  checkZombieAttacksBuildings(zombies, buildings) {
    for (const z of zombies) {
      if (!z.alive || z.state !== 'attacking') continue
      if (z._attackTarget && z._attackTarget.alive) continue  // already has a target
      for (const b of buildings) {
        if (!b.alive) continue
        const dx = z.position.x - b.position.x
        const dz = z.position.z - b.position.z
        if (Math.sqrt(dx*dx + dz*dz) <= z.attackRange + 1.2) {
          z._attackTarget = b
          break
        }
      }
    }
  }
}
