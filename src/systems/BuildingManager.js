import * as THREE from 'three'
import { bus } from '../EventBus.js'
import { EVENTS, BUILDINGS, CELL_SIZE } from '../constants.js'
import { Wall }  from '../buildings/Wall.js'
import { Tower } from '../buildings/Tower.js'
import { Trap }  from '../buildings/Trap.js'

const GHOST_VALID   = 0x00ff88
const GHOST_INVALID = 0xff2200

export class BuildingManager {
  constructor(scene, assets, grid, pathfinding, player) {
    this._scene      = scene
    this._assets     = assets
    this._grid       = grid
    this._pathfinding = pathfinding
    this._player     = player

    this.buildings   = []
    this.active      = false
    this._selectedType = null
    this._ghost      = null
    this._ghostValid = false

    bus.on(EVENTS.BUILDING_DESTROYED, ({ building }) => {
      this.buildings = this.buildings.filter(b => b !== building)
      for (const { gx, gz } of building.gridCells) {
        this._grid.clearCell(gx, gz)
        this._pathfinding.clearObstacle(gx, gz)
      }
      this._recomputeFlowField()
    })
  }

  enterBuildMode(type) {
    this.active = true
    this._selectedType = type
    this._createGhost(type)
  }

  exitBuildMode() {
    this.active = false
    this._selectedType = null
    if (this._ghost) {
      this._scene.remove(this._ghost)
      this._ghost = null
    }
  }

  update(delta, buildCamera, input, rendererWidth, rendererHeight) {
    if (!this.active) return
    const worldPos = buildCamera.screenToWorld(
      input.mousePos.x, input.mousePos.y, rendererWidth, rendererHeight
    )
    if (!worldPos) return

    const { gx, gz } = this._grid.worldToCell(worldPos.x, worldPos.z)
    const snapped = this._grid.cellToWorld(gx, gz)
    this._ghost.position.set(snapped.x, 0, snapped.z)

    const cost = BUILDINGS[this._selectedType]?.cost || {}
    this._ghostValid = !this._grid.isOccupied(gx, gz) && this._player.hasResources(cost)

    const color = this._ghostValid ? GHOST_VALID : GHOST_INVALID
    this._ghost.traverse(c => {
      if (c.isMesh) {
        c.material.color.setHex(color)
        c.material.opacity = 0.65
      }
    })
  }

  tryPlace(gx, gz) {
    const cost = BUILDINGS[this._selectedType]?.cost || {}
    if (!this._grid.isOccupied(gx, gz) && this._player.hasResources(cost)) {
      this._place(gx, gz)
      return true
    }
    return false
  }

  _place(gx, gz) {
    const type = this._selectedType
    const cost = BUILDINGS[type]?.cost || {}
    this._player.spendResources(cost)

    let building
    if (type === 'wall')  building = new Wall(this._scene, this._assets, gx, gz, this._grid)
    if (type === 'tower') building = new Tower(this._scene, this._assets, gx, gz, this._grid)
    if (type === 'trap')  building = new Trap(this._scene, this._assets, gx, gz, this._grid)
    if (!building) return

    this._grid.setOccupied(gx, gz, building)
    this._pathfinding.markObstacle(gx, gz)
    building.gridCells = [{ gx, gz }]
    this.buildings.push(building)
    this._recomputeFlowField()
    bus.emit(EVENTS.BUILDING_PLACED, { building })
  }

  _createGhost(type) {
    if (this._ghost) this._scene.remove(this._ghost)
    const factory = this._assets.get(type)
    this._ghost = factory()
    this._ghost.traverse(c => {
      if (c.isMesh) {
        c.material = c.material.clone()
        c.material.transparent = true
        c.material.opacity = 0.65
      }
    })
    this._scene.add(this._ghost)
  }

  _recomputeFlowField() {
    // Target: all building cells + player base area
    const targets = [{ gx: 50, gz: 50 }]  // grid center = map center
    for (const b of this.buildings) {
      for (const cell of b.gridCells) targets.push(cell)
    }
    this._pathfinding.computeFlowField(targets)
  }

  getAllBullets() {
    const bullets = []
    for (const b of this.buildings) {
      if (b._bullets) {
        bullets.push(...b._bullets)
        b._bullets = []
      }
    }
    return bullets
  }
}
