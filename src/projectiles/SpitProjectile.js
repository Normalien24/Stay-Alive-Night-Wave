import { Projectile } from './Projectile.js'

export class SpitProjectile extends Projectile {
  constructor(scene, assets, origin, direction, damage) {
    const mesh = assets.get('spit')()
    super(scene, mesh, origin, direction, 10, damage, 4.0, 'ranged', 'zombie')
  }
}
