import * as THREE from 'three'
import { Entity } from '../entities/Entity.js'

export class Projectile extends Entity {
  constructor(scene, mesh, origin, direction, speed, damage, lifetime, damageType, owner) {
    super(scene)
    this.mesh = mesh
    this.velocity = direction.clone().normalize().multiplyScalar(speed)
    this.damage = damage
    this.damageType = damageType
    this.owner = owner    // 'player' | 'tower' | 'zombie'
    this._lifetime = lifetime
    this.position.copy(origin)
    this.addToScene()
  }

  update(delta) {
    this._lifetime -= delta
    if (this._lifetime <= 0) {
      this.destroy()
      return
    }
    this.position.addScaledVector(this.velocity, delta)
    this.mesh.position.copy(this.position)
  }
}
