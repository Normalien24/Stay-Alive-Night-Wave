import { Projectile } from './Projectile.js'
import { BULLET_SPEED, BULLET_LIFETIME } from '../constants.js'

export class Bullet extends Projectile {
  constructor(scene, assets, origin, direction, damage, owner) {
    const mesh = assets.get('bullet')()
    super(scene, mesh, origin, direction, BULLET_SPEED, damage, BULLET_LIFETIME, 'ranged', owner)
  }
}
