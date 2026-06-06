import { Zombie } from './Zombie.js'
export class ZombieRunner extends Zombie {
  constructor(scene, assets, pathfinding, player, hpMult, dmgMult) {
    super(scene, assets, 'runner', pathfinding, player, hpMult, dmgMult)
  }
}
