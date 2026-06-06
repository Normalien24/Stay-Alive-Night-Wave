import * as THREE from 'three'
import { WORLD_SIZE } from '../constants.js'
import { ResourceNode } from './ResourceNode.js'

export class WorldMap {
  constructor(scene, assets) {
    this._scene = scene
    this._assets = assets
    this.resourceNodes = []
    this._buildTerrain()
    this._placeResourceNodes()
    this._placeBoundaryMarkers()
  }

  _buildTerrain() {
    const geo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 40, 40)
    const mat = new THREE.MeshLambertMaterial({ color: 0x3a7d44 })
    const ground = new THREE.Mesh(geo, mat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    this._scene.add(ground)

    // Grid lines for visual clarity
    const gridHelper = new THREE.GridHelper(WORLD_SIZE, 50, 0x000000, 0x000000)
    gridHelper.material.opacity = 0.08
    gridHelper.material.transparent = true
    this._scene.add(gridHelper)
  }

  _placeResourceNodes() {
    const positions = [
      // Trees
      ...this._scatter('tree', 18, 15, 90),
      // Rocks
      ...this._scatter('rock', 12, 20, 85),
      // Scrap
      ...this._scatter('scrap', 8, 25, 80),
    ]
    for (const { type, x, z } of positions) {
      const node = new ResourceNode(this._scene, this._assets, type, x, z)
      this.resourceNodes.push(node)
    }
  }

  _scatter(type, count, minDist, maxDist) {
    const results = []
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.8
      const dist = minDist + Math.random() * (maxDist - minDist)
      results.push({ type, x: Math.cos(angle) * dist, z: Math.sin(angle) * dist })
    }
    return results
  }

  _placeBoundaryMarkers() {
    // Visual boundary fence posts
    const mat = new THREE.MeshLambertMaterial({ color: 0x553311 })
    const half = WORLD_SIZE / 2 - 1
    for (let i = -half; i <= half; i += 10) {
      for (const [x, z] of [[i, -half], [i, half], [-half, i], [half, i]]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2, 5), mat)
        post.position.set(x, 1, z)
        this._scene.add(post)
      }
    }
  }

  getSpawnRing() {
    // Returns positions just inside the boundary for zombie spawning
    const positions = []
    const radius = WORLD_SIZE / 2 - 3
    const count = 32
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      positions.push({ x: Math.cos(angle) * radius, z: Math.sin(angle) * radius })
    }
    return positions
  }

  update(delta) {
    for (const node of this.resourceNodes) node.update(delta)
  }
}
