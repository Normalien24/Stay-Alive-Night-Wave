import * as THREE from 'three'
import { Entity } from './Entity.js'
import { bus } from '../EventBus.js'
import {
  PLAYER_SPEED, PLAYER_MAX_HEALTH, HARVEST_RANGE,
  MELEE_RANGE, MELEE_DAMAGE, RANGED_DAMAGE, ATTACK_COOLDOWN,
  EVENTS, WORLD_SIZE,
} from '../constants.js'

export class Player extends Entity {
  constructor(scene, assets) {
    super(scene)
    this.health = PLAYER_MAX_HEALTH
    this.maxHealth = PLAYER_MAX_HEALTH
    this.speed = PLAYER_SPEED
    this.meleeDamage = MELEE_DAMAGE
    this.rangedDamage = RANGED_DAMAGE
    this.inventory = { wood: 0, stone: 0, metal: 0 }
    this.gold = 0
    this.equippedWeapon = 'ranged'
    this._attackCooldown = 0
    this._dead = false

    const factory = assets.get('player')
    this.mesh = factory()
    this.position.set(0, 0, 0)
    this.addToScene()
  }

  update(delta, input, resourceNodes, combatSystem) {
    if (this._dead) return

    this._move(delta, input)
    this._attackCooldown = Math.max(0, this._attackCooldown - delta)

    // Switch weapon
    if (input.wasPressed('Digit1')) { this.equippedWeapon = 'melee'; input.consumePress('Digit1') }
    if (input.wasPressed('Digit2')) { this.equippedWeapon = 'ranged'; input.consumePress('Digit2') }

    // Harvest nearby resources on E
    if (input.wasPressed('KeyE')) {
      input.consumePress('KeyE')
      this._tryHarvest(resourceNodes)
    }

    this.mesh.position.copy(this.position)
  }

  tryMeleeAttack(zombies) {
    if (this._attackCooldown > 0) return false
    if (this.equippedWeapon !== 'melee') return false
    this._attackCooldown = ATTACK_COOLDOWN
    return true  // CombatSystem handles hit detection
  }

  tryRangedAttack(camera) {
    if (this._attackCooldown > 0) return null
    if (this.equippedWeapon !== 'ranged') return null
    this._attackCooldown = ATTACK_COOLDOWN

    // Return direction from camera forward
    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    dir.y = 0
    if (dir.lengthSq() < 0.001) dir.set(0, 0, 1)
    dir.normalize()
    return dir
  }

  takeDamage(amount) {
    if (this._dead) return
    this.health = Math.max(0, this.health - amount)
    bus.emit(EVENTS.PLAYER_HIT, { damage: amount })
    if (this.health <= 0) {
      this._dead = true
      bus.emit(EVENTS.PLAYER_DIED)
    }
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount)
  }

  addResource(type, amount) {
    this.inventory[type] = (this.inventory[type] || 0) + amount
  }

  hasResources(cost) {
    for (const [k, v] of Object.entries(cost)) {
      if ((this.inventory[k] || 0) < v) return false
    }
    return true
  }

  spendResources(cost) {
    for (const [k, v] of Object.entries(cost)) this.inventory[k] -= v
  }

  addGold(amount) {
    this.gold += amount
    bus.emit(EVENTS.GOLD_CHANGED, { amount: this.gold })
  }

  spendGold(amount) {
    if (this.gold < amount) return false
    this.gold -= amount
    bus.emit(EVENTS.GOLD_CHANGED, { amount: this.gold })
    return true
  }

  _move(delta, input) {
    const dir = new THREE.Vector3()
    if (input.isDown('KeyW') || input.isDown('ArrowUp'))    dir.z += 1
    if (input.isDown('KeyS') || input.isDown('ArrowDown'))  dir.z -= 1
    if (input.isDown('KeyA') || input.isDown('ArrowLeft'))  dir.x -= 1
    if (input.isDown('KeyD') || input.isDown('ArrowRight')) dir.x += 1

    if (dir.lengthSq() > 0) {
      dir.normalize().multiplyScalar(this.speed * delta)
      this.position.x = Math.max(-WORLD_SIZE / 2 + 1, Math.min(WORLD_SIZE / 2 - 1, this.position.x + dir.x))
      this.position.z = Math.max(-WORLD_SIZE / 2 + 1, Math.min(WORLD_SIZE / 2 - 1, this.position.z + dir.z))
    }
  }

  _tryHarvest(resourceNodes) {
    for (const node of resourceNodes) {
      if (!node.alive) continue
      const dx = node.position.x - this.position.x
      const dz = node.position.z - this.position.z
      if (Math.sqrt(dx*dx + dz*dz) <= HARVEST_RANGE) {
        node.harvest(this)
        break
      }
    }
  }
}
