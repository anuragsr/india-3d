import React, { useRef, useState } from 'react'
import { extend, Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as THREE from 'three'

// Debug
import DatGui, { DatBoolean, DatString } from 'react-dat-gui'
import 'react-dat-gui/dist/index.css'
import FPSStats from 'react-fps-stats'

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
  useFrame(() => { controls.current.update()})

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
, PointLightWithHelper = ({ color, position, visible, intensity }) => {
  const lightProps = { color, position, intensity }
  return (
    <pointLight {...lightProps}>
      <mesh visible={visible}>
        <sphereBufferGeometry/>
        <meshStandardMaterial color={0x0000ff} />
      </mesh>
    </pointLight>
  )
}

export default function App() {
  const [guiData, setGuiData] = useState({ activeObject: "None", showHelpers: true })
  return (<>
      <DatGui data={guiData} onUpdate={setGuiData}>
        <DatBoolean path='showHelpers' label='Show Helpers' />
        <DatString path='activeObject' label='Active Object' />
      </DatGui>
      {guiData.showHelpers && <FPSStats bottom={50} left={30} top={"unset"}/>}
      <Canvas>
        <ambientLight intensity={0.5} />
        <PointLightWithHelper 
          visible={guiData.showHelpers} 
          color={0xffffff} 
          intensity={1}
          position={[70, 50, 5]}/>
        {guiData.showHelpers && <>
          <gridHelper args={[1000, 100]}/>
          <axesHelper args={[500]} /> 
        </>}
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <CameraControls />
        <Box position={[0, 0, 0]} />
      </Canvas>
    </>
  )
}
