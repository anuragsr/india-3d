import React, { useRef, useState, Suspense } from 'react'
import { extend, Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import * as THREE from 'three'
import { l } from './helpers'

// Make OrbitControls known as <orbitControls />
extend({ OrbitControls })

const CameraControls = () => {
  // Get a reference to the Three.js Camera, and the canvas html element.
  // We need these to setup the OrbitControls component.
  const {
    camera,
    gl: { domElement },
    scene
  } = useThree()
  , inspect = () => {
    window.camera = camera
    window.THREE = THREE
    window.scene = scene
  }
  , setControlParams = () => {
    controls.current.minPolarAngle = Math.PI / 4 + .3;
    controls.current.maxPolarAngle = Math.PI / 4 + .5;

    // For Orthographic camera
    controls.current.minZoom = 12;
    controls.current.maxZoom = 24;

    controls.current.enableDamping = true;
    controls.current.dampingFactor = 0.05;
    controls.current.autoRotate = true;
    controls.current.autoRotateSpeed = .2;
    controls.current.enablePan = false;
    controls.current.enableKeys = false;
  }

  // inspect()

  // Ref to the controls, so that we can update them on every frame using useFrame
  const controls = useRef()
  useFrame(() => { controls.current && controls.current.update()})

  // If we need to set parameters for controls
  // controls.current && setControlParams()

  return <orbitControls ref={controls} args={[camera, domElement]} />
}
, Box = props => {
  // This reference will give us direct access to the mesh
  const mesh = useRef()
  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)
  // Rotate mesh every frame, this is outside of React without overhead
  useFrame(() => {
    if(mesh.current)
      mesh.current.rotation.x = mesh.current.rotation.y += 0.01
  })
  return (
    <mesh
      {...props}
      ref={mesh}
      scale={active ? [1.5, 1.5, 1.5] : [1, 1, 1]}
      onClick={(e) => setActive(!active)}
      onPointerOver={(e) => setHover(true)}
      onPointerOut={(e) => setHover(false)}>
      <boxBufferGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  )
}
, States = ({ name, url, position }) => {
  const gltf = useLoader(GLTFLoader, url )
  // l(gltf.scene)

  // return <primitive name={name}
  //   object={gltf.scene}
  //   position={position}
  //   // onPointerOver={() => {
  //   //   // l("over ground", event.object.name, event.object.parent.name)
  //   //   setGuiData(prev => ({ ...prev, activeObject: "None" }))
  //   // }}
  //   />
  return (
    <group name={name} scale={[2,2,2]} position={position}>{gltf.scene.children.map((child, idx) => {
      l(child.name)
      return (
        <mesh
          key={idx}
          { ...child }
          position={position}
          scale={child.name == "mh" || child.name == "ktk" ? [10,50,10]: [10,10,10]}
          >
          <meshStandardMaterial color={child.name == "mh" || child.name == "ktk" ? 0xfff000 : 0x000fff} />
            {/* emissive={guiData.activeObject === name ? 0xff0000 : material.origEmissive} /> */}
        </mesh>
      )})}
    </group>
  )
}

export default function App() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <pointLight position={[-10, -10, -10]} />
      <gridHelper args={[1000, 100]}/>
      <axesHelper args={[500]} /> 
      <CameraControls />
      <Suspense fallback={<Box position={[0, 0, 0]} />}>      
        <States name="States" position={[0, 0, 0]} url="assets/models/states.glb"/>
      </Suspense>
    </Canvas>
  )
}
