import { WORLD_SIZE, CELL_SIZE, GRID_CELLS } from '../constants.js'

export class Grid {
  constructor() {
    this._cells = new Array(GRID_CELLS * GRID_CELLS).fill(null)
    this._origin = -WORLD_SIZE / 2
  }

  worldToCell(x, z) {
    return {
      gx: Math.floor((x - this._origin) / CELL_SIZE),
      gz: Math.floor((z - this._origin) / CELL_SIZE),
    }
  }

  cellToWorld(gx, gz) {
    return {
      x: this._origin + gx * CELL_SIZE + CELL_SIZE / 2,
      z: this._origin + gz * CELL_SIZE + CELL_SIZE / 2,
    }
  }

  _idx(gx, gz) { return gz * GRID_CELLS + gx }

  inBounds(gx, gz) {
    return gx >= 0 && gx < GRID_CELLS && gz >= 0 && gz < GRID_CELLS
  }

  isOccupied(gx, gz) {
    if (!this.inBounds(gx, gz)) return true
    return this._cells[this._idx(gx, gz)] !== null
  }

  setOccupied(gx, gz, entity) {
    if (this.inBounds(gx, gz)) this._cells[this._idx(gx, gz)] = entity
  }

  clearCell(gx, gz) {
    if (this.inBounds(gx, gz)) this._cells[this._idx(gx, gz)] = null
  }

  getOccupant(gx, gz) {
    if (!this.inBounds(gx, gz)) return null
    return this._cells[this._idx(gx, gz)]
  }

  getNeighbors4(gx, gz) {
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]]
    return dirs
      .map(([dx, dz]) => ({ gx: gx + dx, gz: gz + dz }))
      .filter(c => this.inBounds(c.gx, c.gz))
  }
}
