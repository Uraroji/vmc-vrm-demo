import * as THREE from 'three'
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRM } from '@pixiv/three-vrm'
import * as OSC from 'osc-js'

let renderer: THREE.WebGLRenderer
const scene = new THREE.Scene()
const time = new THREE.Clock()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 1.5
camera.position.y = 1

let model: VRM;
const loader = new GLTFLoader();
loader.load(
	'/models/6865634504698078574.vrm',
	( gltf ) => {
		VRM.from( gltf ).then((vrm) => {
      model = vrm
			scene.add(model.scene)
      vrm.scene.rotation.y = Math.PI
		})
	},
	( progress ) => console.log( 'Loading model...', 100.0 * ( progress.loaded / progress.total ), '%' ),
	( error ) => console.error( error )
)

let textModel: GLTF
loader.load(
  '/models/konnakanji.glb',
  ( gltf ) => {
    textModel = gltf
    textModel.scene.scale.x = 0.01
    textModel.scene.scale.y = 0.01
    textModel.scene.scale.z = 0.01
    textModel.scene.rotation.x = Math.PI/2
    textModel.scene.position.y = 1.8
    scene.add(textModel.scene)
  },
  ( progress ) => console.log( 'Loading model...', 100.0 * ( progress.loaded / progress.total ), '%' ),
	( error ) => console.error( error )
)

const dirLight = new THREE.DirectionalLight(0xffffff)
dirLight.position.set(3, 10, 10)
scene.add(dirLight)

onload = () => {
  renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    canvas: document.querySelector('#main-canvas') as HTMLCanvasElement
  })
  resize()
  animate()
}

const animate = () => {
  requestAnimationFrame(animate)
  textModel.scene.rotation.z += Math.PI/2 * time.getDelta()
  renderer.render(scene, camera)
}

const resize = () => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
}

window.addEventListener('resize', resize)

const osc = new OSC()

osc.on('open', () => {
  console.log('open')
})

// @ts-ignore
osc.on('/VMC/Ext/*', message => {
  console.log(message);
  
  if (message.address === '/VMC/Ext/Bone/Pos') {
    let bone = message.args[0]
    bone = bone.slice(0, 1).toLowerCase() + bone.slice(1)
    if (model != null)
    {
      if ((model.humanoid?.humanBones as any)[bone].length > 0) {
        const q = new THREE.Quaternion(-message.args[4], -message.args[5], message.args[6], message.args[7]);
        (model.humanoid?.humanBones as any)[bone][0].node.setRotationFromQuaternion(q)
      }
    }
  } else if (message.address === '/VMC/Ext/Bone/Pos') {
    let bone = message.args[0]
    bone = bone.slice(0, 1).toLowerCase() + bone.slice(1)
    if (model != null)
    {
      if ((model.humanoid?.humanBones as any)[bone].length > 0) {
        const e = new THREE.Euler(message.args[1], message.args[2], message.args[3])
        {
          (model.humanoid?.humanBones as any)[bone][0].node.setRotationFromEuler(e)
        }
      }
    }
  }
})

osc.open({ host: '10.0.1.2', port: 8080})