import { Building } from './Building.js'
import { BUILDINGS } from '../constants.js'

export class Wall extends Building {
  constructor(scene, assets, gx, gz, grid) {
    super(scene, assets, 'wall', gx, gz, grid, 'wall')
    const cfg = BUILDINGS.wall
    this.health    = cfg.hp
    this.maxHealth = cfg.hp
  }
}
