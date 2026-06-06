import { GRID_CELLS } from '../constants.js'

export class PathfindingSystem {
  constructor(grid) {
    this._grid = grid
    this._field = new Array(GRID_CELLS * GRID_CELLS).fill(null)
    this._obstacles = new Set()
  }

  _idx(gx, gz) { return gz * GRID_CELLS + gx }

  markObstacle(gx, gz) { this._obstacles.add(this._idx(gx, gz)) }
  clearObstacle(gx, gz) { this._obstacles.delete(this._idx(gx, gz)) }

  isObstacle(gx, gz) {
    if (!this._grid.inBounds(gx, gz)) return true
    return this._obstacles.has(this._idx(gx, gz))
  }

  computeFlowField(targetCells) {
    const dist = new Float32Array(GRID_CELLS * GRID_CELLS).fill(Infinity)
    this._field = new Array(GRID_CELLS * GRID_CELLS).fill(null)

    // BFS queue — plain array used as FIFO (shift is O(n) but field is small)
    const queue = []
    for (const { gx, gz } of targetCells) {
      if (!this._grid.inBounds(gx, gz)) continue
      const i = this._idx(gx, gz)
      dist[i] = 0
      this._field[i] = { dx: 0, dz: 0 }
      queue.push({ gx, gz })
    }

    let head = 0
    while (head < queue.length) {
      const { gx, gz } = queue[head++]
      const d = dist[this._idx(gx, gz)]
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]]
      for (const [ddx, ddz] of dirs) {
        const nx = gx + ddx, nz = gz + ddz
        if (!this._grid.inBounds(nx, nz)) continue
        if (this.isObstacle(nx, nz)) continue
        const ni = this._idx(nx, nz)
        if (d + 1 < dist[ni]) {
          dist[ni] = d + 1
          // Direction points FROM neighbor TOWARD current (i.e., toward goal)
          this._field[ni] = {
            dx: gx - nx,
            dz: gz - nz,
          }
          queue.push({ gx: nx, gz: nz })
        }
      }
    }
  }

  getDirectionAt(worldX, worldZ) {
    const { gx, gz } = this._grid.worldToCell(worldX, worldZ)
    if (!this._grid.inBounds(gx, gz)) return null
    return this._field[this._idx(gx, gz)]
  }
}
