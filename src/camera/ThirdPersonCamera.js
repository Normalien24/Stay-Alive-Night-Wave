import * as THREE from 'three'

export class ThirdPersonCamera {
  constructor(camera) {
    this._camera = camera
    this._yaw = 0
    this._pitch = 0.45
    this._distance = 14
    this._target = new THREE.Vector3()
    this._currentPos = new THREE.Vector3()
  }

  update(delta, playerPos, input) {
    // Right-mouse drag to orbit
    if (input.isMouseDown(2)) {
      this._yaw   -= input.mouseDelta.x * 0.005
      this._pitch -= input.mouseDelta.y * 0.005
      this._pitch = Math.max(0.15, Math.min(1.2, this._pitch))
    }

    const sinY = Math.sin(this._yaw)
    const cosY = Math.cos(this._yaw)
    const cosP = Math.cos(this._pitch)
    const sinP = Math.sin(this._pitch)

    const idealPos = new THREE.Vector3(
      playerPos.x + sinY * cosP * -this._distance,
      playerPos.y + sinP * this._distance,
      playerPos.z + cosY * cosP * -this._distance,
    )

    this._currentPos.lerp(idealPos, 1 - Math.exp(-12 * delta))
    this._camera.position.copy(this._currentPos)

    this._target.lerp(playerPos, 1 - Math.exp(-12 * delta))
    this._camera.lookAt(this._target)
  }

  getForwardXZ() {
    const dir = new THREE.Vector3()
    this._camera.getWorldDirection(dir)
    dir.y = 0
    return dir.normalize()
  }

  get yaw() { return this._yaw }
}
