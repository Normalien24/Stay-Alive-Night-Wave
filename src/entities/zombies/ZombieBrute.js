import { Zombie } from './Zombie.js'
export class ZombieBrute extends Zombie {
  constructor(scene, assets, pathfinding, player, hpMult, dmgMult) {
    super(scene, assets, 'brute', pathfinding, player, hpMult, dmgMult)
  }
}
