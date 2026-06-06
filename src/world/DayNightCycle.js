import * as THREE from 'three'
import { bus } from '../EventBus.js'
import { DAY_DURATION, NIGHT_DURATION, NIGHT_WARNING_AT, EVENTS } from '../constants.js'

export class DayNightCycle {
  constructor(scene) {
    this._scene = scene
    this.phase = 'day'   // 'day' | 'night'
    this._timer = DAY_DURATION
    this._warnFired = false

    this._ambient = new THREE.AmbientLight(0xffffff, 0.6)
    this._sun = new THREE.DirectionalLight(0xfff0cc, 1.4)
    this._sun.position.set(50, 80, 30)
    this._sun.castShadow = true
    this._sun.shadow.mapSize.set(2048, 2048)
    this._sun.shadow.camera.near = 1
    this._sun.shadow.camera.far = 300
    this._sun.shadow.camera.left = -120
    this._sun.shadow.camera.right = 120
    this._sun.shadow.camera.top = 120
    this._sun.shadow.camera.bottom = -120

    this._moon = new THREE.DirectionalLight(0x8899cc, 0.3)
    this._moon.position.set(-40, 60, -20)
    this._moon.visible = false

    scene.add(this._ambient, this._sun, this._moon)
    this._applyDay(1)
  }

  get timeRemaining() { return this._timer }
  get phaseDuration()  { return this.phase === 'day' ? DAY_DURATION : NIGHT_DURATION }

  update(delta) {
    this._timer -= delta

    if (this.phase === 'day' && this._timer <= NIGHT_WARNING_AT && !this._warnFired) {
      this._warnFired = true
      // HUD picks this up via timeRemaining check
    }

    if (this._timer <= 0) {
      if (this.phase === 'day') {
        this._startNight()
      } else {
        this._startDay()
      }
    }

    const t = 1 - Math.max(0, this._timer / this.phaseDuration)
    if (this.phase === 'day') {
      this._applyDay(t)
    } else {
      this._applyNight(t)
    }
  }

  _startDay() {
    this.phase = 'day'
    this._timer = DAY_DURATION
    this._warnFired = false
    this._sun.visible = true
    this._moon.visible = false
    bus.emit(EVENTS.DAY_START)
    this._scene.background = new THREE.Color(0x87ceeb)
    this._scene.fog = new THREE.Fog(0x87ceeb, 60, 200)
  }

  _startNight() {
    this.phase = 'night'
    this._timer = NIGHT_DURATION
    this._sun.visible = false
    this._moon.visible = true
    bus.emit(EVENTS.NIGHT_START)
    this._scene.background = new THREE.Color(0x0a0a1a)
    this._scene.fog = new THREE.Fog(0x0a0a1a, 30, 120)
  }

  _applyDay(t) {
    const skyDay   = new THREE.Color(0x87ceeb)
    const skyDusk  = new THREE.Color(0xff7040)
    const sky = t < 0.8
      ? new THREE.Color().lerpColors(skyDay, skyDusk, Math.max(0, (t - 0.6) / 0.2))
      : new THREE.Color().lerpColors(skyDusk, new THREE.Color(0x111122), (t - 0.8) / 0.2)
    this._scene.background = sky
    this._scene.fog = new THREE.Fog(sky, 60, 200)
    this._ambient.intensity = THREE.MathUtils.lerp(0.6, 0.15, t > 0.8 ? 1 : 0)
    this._sun.intensity = THREE.MathUtils.lerp(1.4, 0.3, Math.max(0, t - 0.6) / 0.4)
  }

  _applyNight(t) {
    const skyNight = new THREE.Color(0x0a0a1a)
    const skyDawn  = new THREE.Color(0xff5020)
    const sky = t < 0.8
      ? skyNight
      : new THREE.Color().lerpColors(skyNight, skyDawn, (t - 0.8) / 0.2)
    this._scene.background = sky
    this._scene.fog = new THREE.Fog(sky, 30, 120)
    this._ambient.intensity = 0.15
    this._moon.intensity = THREE.MathUtils.lerp(0.3, 0.05, t)
  }

  forceStartNight() {
    this._startNight()
  }
}
