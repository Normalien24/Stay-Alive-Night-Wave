import { Zombie } from './Zombie.js'
export class ZombieBasic extends Zombie {
  constructor(scene, assets, pathfinding, player, hpMult, dmgMult) {
    super(scene, assets, 'basic', pathfinding, player, hpMult, dmgMult)
  }
}
