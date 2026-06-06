import * as THREE from 'three'
import { Entity } from '../entities/Entity.js'
import { bus } from '../EventBus.js'
import { EVENTS, RESOURCE_NODES } from '../constants.js'

export class ResourceNode extends Entity {
  constructor(scene, assets, type, x, z) {
    super(scene)
    this.type = type
    const cfg = RESOURCE_NODES[type]
    this._hp = cfg.hp
    this._maxHp = cfg.hp
    this._yieldType = cfg.yieldType
    this._yieldAmount = cfg.yieldAmount
    this._respawnTime = cfg.respawn
    this._respawnTimer = 0
    this._depleted = false

    const factory = assets.get(type)
    this.mesh = factory()
    this.position.set(x, 0, z)
    this.addToScene()
  }

  harvest(player) {
    if (this._depleted) return

    this._hp--
    // Shrink slightly on each hit
    const s = 0.7 + (this._hp / this._maxHp) * 0.3
    this.mesh.scale.setScalar(s)

    const yieldAmount = Math.ceil(this._yieldAmount / this._maxHp)
    player.addResource(this._yieldType, yieldAmount)
    bus.emit(EVENTS.RESOURCE_HARVESTED, { type: this._yieldType, amount: yieldAmount })

    if (this._hp <= 0) {
      this._depleted = true
      this.mesh.visible = false
    }
  }

  update(delta) {
    if (!this._depleted) return
    this._respawnTimer += delta
    if (this._respawnTimer >= this._respawnTime) {
      this._respawnTimer = 0
      this._depleted = false
      this._hp = this._maxHp
      this.mesh.scale.setScalar(1)
      this.mesh.visible = true
    }
  }
}
