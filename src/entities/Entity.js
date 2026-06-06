import * as THREE from 'three'

let _nextId = 1

export class Entity {
  constructor(scene) {
    this._id = _nextId++
    this._scene = scene
    this.mesh = null
    this.position = new THREE.Vector3()
    this.alive = true
  }

  get id() { return this._id }

  addToScene() {
    if (this.mesh) {
      this.mesh.position.copy(this.position)
      this._scene.add(this.mesh)
    }
  }

  removeFromScene() {
    if (this.mesh) this._scene.remove(this.mesh)
  }

  update(delta) {}

  destroy() {
    this.alive = false
    this.removeFromScene()
  }
}
