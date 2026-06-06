import * as THREE from 'three'

export class AssetLoader {
  constructor() {
    this._cache = {}
  }

  load() {
    // Build all procedural geometries and materials once
    this._build('player',      this._playerMesh())
    this._build('zombie',      this._zombieMesh(0x55aa44))
    this._build('zombie_runner',  this._zombieMesh(0xaadd22, 0.7))
    this._build('zombie_brute',   this._zombieMesh(0x885511, 1.6))
    this._build('zombie_spitter', this._zombieMesh(0x22aaaa))
    this._build('wall',    this._wallMesh())
    this._build('tower',   this._towerMesh())
    this._build('trap',    this._trapMesh())
    this._build('tree',    this._treeMesh())
    this._build('rock',    this._rockMesh())
    this._build('scrap',   this._scrapMesh())
    this._build('bullet',  this._bulletMesh())
    this._build('spit',    this._spitMesh())
    this._build('gold',    this._goldMesh())
    return Promise.resolve()
  }

  get(name) { return this._cache[name] }

  _build(name, fn) { this._cache[name] = fn }

  _playerMesh() {
    return () => {
      const g = new THREE.Group()
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.2, 0.6),
        new THREE.MeshLambertMaterial({ color: 0x4488ff })
      )
      body.position.y = 0.6
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 8, 6),
        new THREE.MeshLambertMaterial({ color: 0xffccaa })
      )
      head.position.y = 1.55
      g.add(body, head)
      g.castShadow = true
      return g
    }
  }

  _zombieMesh(color, scale = 1) {
    return () => {
      const g = new THREE.Group()
      const mat = new THREE.MeshLambertMaterial({ color })
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.8 * scale, 1.1 * scale, 0.5 * scale), mat)
      body.position.y = 0.55 * scale
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.55 * scale, 0.55 * scale, 0.55 * scale), mat)
      head.position.y = 1.37 * scale
      g.add(body, head)
      g.castShadow = true
      return g
    }
  }

  _wallMesh() {
    return () => {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 0.4),
        new THREE.MeshLambertMaterial({ color: 0xccaa66 })
      )
      m.position.y = 1
      m.castShadow = true
      m.receiveShadow = true
      const g = new THREE.Group()
      g.add(m)
      return g
    }
  }

  _towerMesh() {
    return () => {
      const g = new THREE.Group()
      const mat = new THREE.MeshLambertMaterial({ color: 0x999966 })
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 2.5, 8), mat)
      base.position.y = 1.25
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 6), new THREE.MeshLambertMaterial({ color: 0x444444 }))
      barrel.rotation.x = Math.PI / 2
      barrel.position.set(0, 2.4, 0.7)
      barrel.name = 'barrel'
      g.add(base, barrel)
      g.castShadow = true
      return g
    }
  }

  _trapMesh() {
    return () => {
      const g = new THREE.Group()
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.2, 1.8),
        new THREE.MeshLambertMaterial({ color: 0x884422 })
      )
      base.position.y = 0.1
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.5, 5),
        new THREE.MeshLambertMaterial({ color: 0x666666 })
      )
      spike.position.y = 0.45
      g.add(base, spike)
      return g
    }
  }

  _treeMesh() {
    return () => {
      const g = new THREE.Group()
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 1.5, 7),
        new THREE.MeshLambertMaterial({ color: 0x8B5E3C })
      )
      trunk.position.y = 0.75
      const top = new THREE.Mesh(
        new THREE.ConeGeometry(1.1, 2.4, 7),
        new THREE.MeshLambertMaterial({ color: 0x226622 })
      )
      top.position.y = 2.7
      g.add(trunk, top)
      g.castShadow = true
      return g
    }
  }

  _rockMesh() {
    return () => {
      const m = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.8, 0),
        new THREE.MeshLambertMaterial({ color: 0x888888 })
      )
      m.position.y = 0.5
      const g = new THREE.Group()
      g.add(m)
      return g
    }
  }

  _scrapMesh() {
    return () => {
      const g = new THREE.Group()
      const mat = new THREE.MeshLambertMaterial({ color: 0xaa7722 })
      for (let i = 0; i < 3; i++) {
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35 + Math.random() * 0.2, 0.5), mat)
        box.position.set((i - 1) * 0.55, 0.25, (Math.random() - 0.5) * 0.4)
        box.rotation.y = (Math.random() - 0.5) * 0.8
        g.add(box)
      }
      return g
    }
  }

  _bulletMesh() {
    return () => new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 4, 3),
      new THREE.MeshBasicMaterial({ color: 0xffff00 })
    )
  }

  _spitMesh() {
    return () => new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 4, 3),
      new THREE.MeshBasicMaterial({ color: 0x00ff88 })
    )
  }

  _goldMesh() {
    return () => new THREE.Mesh(
      new THREE.OctahedronGeometry(0.2),
      new THREE.MeshBasicMaterial({ color: 0xffdd00 })
    )
  }
}
