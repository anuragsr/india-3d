import React, { useRef, useState, useEffect, Suspense, setGlobal, useGlobal } from 'reactn'
import { extend, Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { animated, useSpring } from '@react-spring/three'
import * as THREE from 'three'

import StatesData from './helpers/indiaStatesObj'
import HttpService from './helpers/HttpService'

// Debug
import DatGui, { DatBoolean, DatString } from 'react-dat-gui'
import 'react-dat-gui/dist/index.css'
import FPSStats from 'react-fps-stats'
import { l } from './helpers'

// Make OrbitControls known as <orbitControls />
extend({ OrbitControls })

setGlobal({ a: false, b: true, c: false })

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
, Box = ({ position }) => {
  // This reference will give us direct access to the mesh
  const mesh = useRef()
  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)
  // Rotate mesh every frame, this is outside of React without overhead
  useFrame(() => {
    if(mesh.current) mesh.current.rotation.x = mesh.current.rotation.y += 0.01
  })

  return (
    <mesh
      ref={mesh}
      position={position}
      scale={active ? [1.5, 1.5, 1.5] : [1, 1, 1]}
      onClick={(e) => setActive(!active)}
      onPointerOver={(e) => setHover(true)}
      onPointerOut={(e) => setHover(false)}>
      <boxBufferGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'green'} />
    </mesh>
  )
}
, BoxSpring = ({ position, label }) => {
  const [aVal, setaVal] = useGlobal(label)
  // const [active, setActive] = useState(false)
  , config = { mass: 5, tension: 400, friction: 50, precision: 0.0001 }
  , props = useSpring({
    from: {
      color: new THREE.Color("hsl(195, 100%, 10%)"),
      scale: 2,
      rotationY: 0
    },
    to: {
      color: new THREE.Color("hsl(195, 100%, 90%)"),
      scale: 1,
      rotationY: Math.PI
    },
    reset: true,
    reverse: aVal,
    config
    // delay: 200,
    // config: config.molasses,
    // onRest: () => setActive(!active),
  })

  return (
    <animated.mesh
      position={position}
      scale={props.scale}
      rotation-y={props.rotationY}
      // onClick={(e) => setActive(!active)}
      >
      <boxBufferGeometry args={[1, 1, 1]} />
      <animated.meshStandardMaterial transparent color={props.color} />
    </animated.mesh>
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
, States = ({ name, url, position }) => {
  const gltf = useLoader(GLTFLoader, url )
  // , stateArr = [
  //   "DL", "GA", "TR", "MZ", "MN", "NL", "ML", "AS", "AR", "AP",
  //   "TN", "KL",  "KA", "TS", "OD" , "CG", "JH", "WB",
  //   "UK", "HP", "JK", "MH", "LA", "DN", "DD", "PY", "AN", "LD",
  //   "SK", "BR", "MP", "GJ", "RJ", "CH", "UP", "HR", "PB",
  // ]
  // scale={stateArr.includes(child.name) ? [10,20,10]: [10,10,10]}
  // color={stateArr.includes(child.name) ? 0xfff000 : 0x000fff}

  // viewport -> canvas in 3d units (meters)
  // const { viewport } = useThree()
  // , ref = useRef()
  // useFrame(({ mouse }) => {
  //   const x = (mouse.x * viewport.width) / 300
  //   const y = (mouse.y * viewport.height) / 300
  //   ref.current && ref.current.rotation.set(-y, x, 0)
  // })

  return (
    <group name={name} position={position}>
      {gltf.scene.children.map((child, idx) => (
        <StateSingleN key={idx} {...child}/>
      ))}
    </group>
  )
}
, StateSingle = child => {
  const [active, setActive] = useState(false)
  , config = { mass: 5, tension: 400, friction: 50, precision: 0.0001 }
  , { color, scaleY } = useSpring({
    from: {
      color: new THREE.Color("hsl(195, 100%, 20%)"),
      scaleY: 1000,
    },
    to: {
      color: StatesData[child.name].color,
      scaleY: 2,
    },
    reset: true,
    reverse: active,
    config
    // , delay: 200
    // , onRest: () => setActive(!active)
  })

  return (
    <animated.mesh { ...child }
      onClick={(e) => {l("click"); setActive(!active)}}
      // onPointerOver={(e) => l("In", e.eventObject.name)}
      // onPointerOut={(e) => l("Out", e.eventObject.name)}
      scale-y={scaleY}>
      <animated.meshPhongMaterial side={THREE.DoubleSide} color={color} />
    </animated.mesh>
  )
}
, StateSingleN = child => {
  // const [active, setActive] = useState(false)
  // , config = { mass: 5, tension: 400, friction: 50, precision: 0.0001 }
  // , { color, scaleY } = useSpring({
  //   from: {
  //     color: new THREE.Color("hsl(195, 100%, 20%)"),
  //     scaleY: 1000,
  //   },
  //   to: {
  //     color: StatesData[child.name].color,
  //     scaleY: 2,
  //   },
  //   reset: true,
  //   reverse: active,
  //   config
  //   // , delay: 200
  //   // , onRest: () => setActive(!active)
  // })
  const color = StatesData[child.name].color
  return (
    <mesh
      // onClick={(e) => {l("click"); setActive(!active)}}
      // onPointerOver={(e) => l("In", e.eventObject.name)}
      // onPointerOut={(e) => l("Out", e.eventObject.name)}
      // scale-y={scaleY}
       { ...child }>
      <meshPhongMaterial side={THREE.DoubleSide} color={color} />
    </mesh>
  )
}
, Text3DHindi = ({ text, color, fontUrl, position, rotation }) => {
  const [shapes, setShapes] = useState([])
  , [offset, setOffset] = useState(0)
  , geoRef = useRef(null)
  , extrudeSettings = {
    steps: 1,
    amount: 10,
    bevelEnabled: true,
    bevelThickness: 1,
    bevelSize: 1,
    bevelSegments: 1
  }

  useEffect(() => {
    harfbuzz.createFont(fontUrl, 150, font => {
      const allCommands = harfbuzz.commands(font, text, 150, 0, 0)
      let shapes = []
      for(let i = 0; i < allCommands.length; i++) {
        let path = new THREE.ShapePath(), commands = allCommands[i]
        for(let j = 0; j < commands.length; j++) {
          let command = commands[j]
          switch(command.type) {
            case "M": path.moveTo(command.x, command.y); break;
            case "L": path.lineTo(command.x, command.y); break;
            case "Q": path.quadraticCurveTo(command.x1, command.y1, command.x, command.y); break;
            case "Z": path.currentPath = new THREE.Path(); path.subPaths.push( path.currentPath ); break;
            default: throw "Unsupported command " + JSON.stringify(command)
          }
        }
        shapes = shapes.concat( path.toShapes(true, false) )
      }
      setShapes(shapes)
    })
  }, [])

  useEffect(() => {
    const geo = geoRef.current
    if(geo){
      geo.computeBoundingBox()
      setOffset(-0.5 * ( geo.boundingBox.max.x - geo.boundingBox.min.x ))
    }
  }, [shapes.length])

  return (
    shapes.length ?
    <group position={position} rotation={rotation} scale={.015}>
      <mesh
        position={[offset, 0, 0]}
        rotation={[0, Math.PI * 2, 0]}
        scale={[1, -1, 1]}>
        <extrudeBufferGeometry ref={geoRef} args={[shapes, extrudeSettings]} />
        <meshPhongMaterial side={THREE.DoubleSide} color={color} />
      </mesh>
    </group> :  null
  )
}

export default function App() {
  const [guiData, setGuiData] = useState({ activeObject: "None", showHelpers: true })
  // const { a, b, c} = useGlobal()
  const [global, setGlobal] = useGlobal()
  // , [aVal, setaVal] = useGlobal('a')
  , setGlobalValue = val => {
    // l(val, aVal)
    // setGlobal(prev => ({ ...prev, aVal : !aVal }))
    // setaVal(!aVal)

    setGlobal({ [val]: !global[val] })
  }

  return (<>
    <DatGui data={guiData} onUpdate={setGuiData}>
      <DatBoolean path='showHelpers' label='Show Helpers' />
      <DatString path='activeObject' label='Active Object' />
    </DatGui>
    {guiData.showHelpers && <FPSStats bottom={50} left={30} top={"unset"}/>}
    <Canvas camera={{ position: [0, 0, 15] }}>
      <ambientLight intensity={.3} />
      <PointLightWithHelper
        visible={guiData.showHelpers}
        color={0xffffff}
        intensity={1}
        position={[100, 50, 50]}
        />
      {guiData.showHelpers && <>
        <gridHelper args={[1000, 100]}/>
        <axesHelper args={[500]} />
      </>}
      <CameraControls />
      <BoxSpring label="a" position={[-10, 7, 0]} />
      <BoxSpring label="b" position={[-10, 5, 0]} />
      <BoxSpring label="c" position={[-10, 3, 0]} />
      <Suspense fallback={<Box position={[0, 0, 0]} />}>
        {/*<Text3DHindi
          fontUrl="assets/fonts/NotoSans-Regular.ttf"
          text="अपराध दर"
          color="yellow"
          position={[14, 2.75, 0]}/>
        <Text3DHindi
          fontUrl="assets/fonts/NotoSans-Regular.ttf"
          text="गरीबी"
          color="green"
          position={[13, 0, 0]}/>
        <Text3DHindi
          fontUrl="assets/fonts/NotoSans-Regular.ttf"
          text="साक्षरता"
          color="blue"
          position={[14, 5, 0]}/>
        <Text3DHindi
          fontUrl="assets/fonts/NotoSans-Regular.ttf"
          text="जनसंख्या"
          color="red"
          position={[12, 7, 0]}
          // rotation={[0, -.2, 0]}
        />
        <Text3DHindi
          fontUrl="assets/fonts/NotoSans-Regular.ttf"
          text="क्षेत्र"
          color="orange"
          position={[12, -6, 0]}
        />
        <Text3DHindi
          fontUrl="assets/fonts/NotoSans-Regular.ttf"
          text="वन क्षेत्र"
          color="purple"
          position={[12, -9, 0]}
        />
        <Text3DHindi
          fontUrl="assets/fonts/NotoSans-Regular.ttf"
          text="लिंग अनुपात"
          color="yellowgreen"
          position={[12, -3, 0]}
        />*/}
        <States name="States" position={[0, 0, 0]} url="assets/models/states.glb"/>
      </Suspense>
    </Canvas>
    <div className="ctn-btn">
      <button onClick={() => setGlobalValue("a")}>a</button>
      <button onClick={() => setGlobalValue("b")}>b</button>
      <button onClick={() => setGlobalValue("c")}>c</button>
    </div>
  </>)
}
