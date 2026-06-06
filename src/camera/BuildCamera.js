import * as THREE from 'three'
import { WORLD_SIZE } from '../constants.js'

export class BuildCamera {
  constructor(camera) {
    this._camera = camera
    this._pos = new THREE.Vector3(0, 45, 0.01)
    this._panSpeed = 22
    this._groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    this._raycaster = new THREE.Raycaster()
  }

  activate() {
    this._camera.position.copy(this._pos)
    this._camera.lookAt(0, 0, 0)
  }

  update(delta, input) {
    const spd = this._panSpeed * delta
    const half = WORLD_SIZE / 2 - 5
    if (input.isDown('KeyW') || input.isDown('ArrowUp'))    this._pos.z -= spd
    if (input.isDown('KeyS') || input.isDown('ArrowDown'))  this._pos.z += spd
    if (input.isDown('KeyA') || input.isDown('ArrowLeft'))  this._pos.x -= spd
    if (input.isDown('KeyD') || input.isDown('ArrowRight')) this._pos.x += spd

    this._pos.x = Math.max(-half, Math.min(half, this._pos.x))
    this._pos.z = Math.max(-half, Math.min(half, this._pos.z))

    const scroll = input.scrollDelta
    if (scroll !== 0) {
      this._pos.y += scroll * 0.04
      this._pos.y = Math.max(15, Math.min(70, this._pos.y))
    }

    this._camera.position.set(this._pos.x, this._pos.y, this._pos.z + 0.01)
    this._camera.lookAt(this._pos.x, 0, this._pos.z)
  }

  screenToWorld(mouseX, mouseY, rendererWidth, rendererHeight) {
    const ndc = new THREE.Vector2(
      (mouseX / rendererWidth) * 2 - 1,
      -(mouseY / rendererHeight) * 2 + 1,
    )
    this._raycaster.setFromCamera(ndc, this._camera)
    const target = new THREE.Vector3()
    this._raycaster.ray.intersectPlane(this._groundPlane, target)
    return target
  }
}
