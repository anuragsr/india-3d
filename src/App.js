import React, { useRef, useState, useEffect, Suspense, useMemo } from 'react'
import { extend, Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { animated, useSpring } from '@react-spring/three'
import * as THREE from 'three'

import StatesData from './helpers/indiaStatesObj'
import HttpService from './helpers/HttpService'

// Debug
import DatGui, { DatBoolean, DatString, DatButton } from 'react-dat-gui'
import 'react-dat-gui/dist/index.css'
import FPSStats from 'react-fps-stats'
import { l, cl } from './helpers'

// Make OrbitControls known as <orbitControls />
extend({ OrbitControls })

const total = {
  population: 0,
  area: 0,
  crimeRate: 0,
  cases: 0
}
, filters = [
  { name: "Covid 19 Cases", hin: "कोविड 19 केस", color: "hsl(16, 100%, 20%)" },
  { name: "Population",     hin: "जनसंख्या",      color: "hsl(195, 100%, 20%)" },
  { name: "Area",           hin: "क्षेत्र",           color: "hsl(55, 100%, 20%)" },
  { name: "Crime Rate",     hin: "अपराध दर",     color: "hsl(0, 100%, 20%)" },
  { name: "Literacy",       hin: "साक्षरता",       color: "hsl(288, 80%, 20%)" },
  { name: "Poverty",        hin: "गरीबी",         color: "hsl(28, 100%, 20%)" },
  { name: "Sex Ratio",      hin: "लिंग अनुपात",   color: "hsl(239, 80%, 20%)" },
  { name: "Forest Cover",   hin: "वन क्षेत्र",       color: "hsl(124, 100%, 20%)" },
]

for(const state in StatesData){
  total.population += StatesData[state].population
  total.area       += StatesData[state].area
  total.crimeRate  += StatesData[state].crimeRate

  StatesData[state].currColor = {...StatesData[state].color}
  StatesData[state].currScale = 40
}

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
, States = ({ name, url, position, param }) => {
  const gltf = useLoader(GLTFLoader, url )
  , ref = useRef()
  , { viewport } = useThree() // viewport -> canvas in 3d units (meters)

  // useFrame(({ mouse }) => {
  //   const x = (mouse.x * viewport.width) / 200
  //   , y = (mouse.y * viewport.height) / 200
  //
  //   if (ref.current) {
  //     ref.current.rotation.set(-y, x, 0)
  //     // ref.current.rotation.set(2*y, -2*x, 0)
  //     // ref.current.position.set(x*15, y*10, 0)
  //   }
  // })

  return (
    <group ref={ref} name={name} position={position}>{
      gltf.scene.children.map((child, idx) => (
        <StateSingle key={idx} param={param} {...child}/>
      ))
    }</group>
  )
}
, StateSingle = child => {
  const label = child.name
  , config = { mass: 5, tension: 400, friction: 50, precision: 0.0001 }
  , from = {
    color: StatesData[label].currColor,
    scaleY: StatesData[label].currScale,
  }

  let scaleY = 40, color = StatesData[label].color

  switch(child.param){
    case 'Covid 19 Cases':
      scaleY = Math.max(StatesData[label].cases / 5000, 60)
      color = new THREE.Color(`hsl(16, 100%, ${Math.round(StatesData[label].cases*100/total.cases)}%)`)
    break;

    case 'Population':
      scaleY = Math.max(StatesData[label].population / 100000, 60)
      color = new THREE.Color(`hsl(195, 100%, ${Math.round(StatesData[label].population*100/total.population)}%)`)
    break;

    case 'Area':
      scaleY = Math.max(StatesData[label].area / 250, 60)
      color = new THREE.Color(`hsl(55, 100%, ${Math.round(StatesData[label].area*100/total.area)}%)`)
    break;

    case 'Crime Rate':
      scaleY = Math.max(StatesData[label].crimeRate / 5, 60)
      color = new THREE.Color(`hsl(360, 100%, ${Math.round(StatesData[label].crimeRate*100/total.crimeRate)}%)`)
    break;

    case 'Literacy':
      scaleY = Math.max(StatesData[label].literacy * 15, 60)
      color = new THREE.Color(`hsl(288, 80%, ${Math.round(100 - StatesData[label].literacy)}%)`)
    break;

    case 'Poverty':
      scaleY = Math.max(StatesData[label].poverty * 30, 60)
      color = new THREE.Color(`hsl(28, 100%, ${Math.round(StatesData[label].poverty)}%)`)
    break;

    case 'Sex Ratio':
      scaleY = Math.max(StatesData[label].sexRatio * .75, 60)
      color = new THREE.Color(`hsl(239, 83%, ${102 - Math.min(Math.round(StatesData[label].sexRatio/10), 100)}%)`)
    break;

    case 'Forest Cover':
      scaleY = Math.max(StatesData[label].forest * 20, 60)
      let perc = 95 - Math.round(StatesData[label].forest)
      if(perc === 95) perc = 20
      color = new THREE.Color(`hsl(124, 100%, ${perc}%)`)
      // l(label, perc)
    break;

    default:break;
  }
  // l(label, color, scaleY)

  const to = { color, scaleY }
  , { color: colorVal, scaleY: scaleYVal } = useSpring({ from, to, config })

  return (
    <animated.mesh { ...child }
      // onPointerOver={(e) => {
      //   e.stopPropagation()
      //   l("In", e.eventObject.name)
      //   // StatesData[e.eventObject.name]
      // }}
      // onPointerOut={(e) => {
      //   e.stopPropagation()
      //   l("Out", e.eventObject.name)
      // }}
      scale-y={scaleYVal}>
      <animated.meshPhongMaterial side={THREE.DoubleSide} color={colorVal} />
    </animated.mesh>
  )
}
, Text3DHindi = ({ text, color, extrudeConfig }) => {
  const [shapes, setShapes] = useState([])
  , [offset, setOffset] = useState(0)
  , geoRef = useRef(null)

  useEffect(() => {
    harfbuzz.createFont("assets/fonts/NotoSans-Regular.ttf", 150, font => {
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
    <group scale={.015}>
      <mesh
        position={[offset, 60, 0]}
        rotation={[0, Math.PI * 2, 0]}
        scale={[1, -1, 1]}>
        <extrudeBufferGeometry ref={geoRef} args={[shapes, extrudeConfig]} />
        <meshPhongMaterial side={THREE.DoubleSide} color={color} />
      </mesh>
    </group> :  null
  )
}
, Text3D = ({ text, color, extrudeConfig }) => {
  const font = useLoader(THREE.FontLoader, "assets/fonts/Noto Sans_Regular.json")
  , config = useMemo(() => ({ font, ...extrudeConfig }), [font])
  , [offset, setOffset] = useState(0)
  , geoRef = useRef(null)

  useEffect(() => {
    const geo = geoRef.current
    if(geo){
      geo.computeBoundingBox()
      setOffset(-0.5 * ( geo.boundingBox.max.x - geo.boundingBox.min.x ))
    }
  }, [geoRef])

  return (
    <group scale={.008}>
      <mesh position={[offset, -60, 0]}>
        <textBufferGeometry ref={geoRef} args={[text, config]} />
        <meshPhongMaterial side={THREE.DoubleSide} color={color} />
      </mesh>
    </group>
  )
}
, TextGroup = ({ visible, hin, eng, color, position }) => {
  const extrudeConfig = {
    steps: 1,
    amount: 10,
    bevelEnabled: true,
    bevelThickness: 1,
    bevelSize: 1,
    bevelSegments: 1
  }
  , springConfig = { mass: 5, tension: 400, friction: 50, precision: 0.0001 }
  , { rotationY } = useSpring({
    from: { rotationY: Math.PI/2 },
    to: { rotationY: 0 },
    reset: true,
    config: springConfig
  })

  return(
    <animated.group position={position} visible={visible} rotation-y={rotationY}>
      <Text3DHindi
        text={hin}
        color={color}
        extrudeConfig={extrudeConfig}
      />
      <Text3D
        text={eng}
        color={color}
        extrudeConfig={extrudeConfig}
      />
    </animated.group>
  )
}
, CanvasGroup = props => {
  const { guiData, param } = props
  return (
    <Canvas camera={{ position: [0, 0, 20] }} {...props}>
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
      <Suspense fallback={<Box position={[0, 0, 0]} />}>
        <TextGroup visible={param === "Covid 19 Cases"} hin="कोविड 19 केस" eng="Covid 19 Cases" color={new THREE.Color("hsl(16, 100%, 20%)")} position={[12, 7, 0]} />
        <TextGroup visible={param === "Population"} hin="जनसंख्या" eng="Population" color={new THREE.Color("hsl(195, 100%, 20%)")} position={[12, 7, 0]} />
        <TextGroup visible={param === "Area"} hin="क्षेत्र" eng="Area" color={new THREE.Color("hsl(55, 100%, 20%)")} position={[12, 7, 0]} />
        <TextGroup visible={param === "Crime"} hin="अपराध दर" eng="Crime Rate" color={new THREE.Color("hsl(0, 100%, 20%)")} position={[12, 7, 0]} />
        <TextGroup visible={param === "Literacy"} hin="साक्षरता" eng="Literacy" color={new THREE.Color("hsl(288, 80%, 20%)")} position={[12, 7, 0]} />
        <TextGroup visible={param === "Poverty"} hin="गरीबी" eng="Poverty" color={new THREE.Color("hsl(28, 100%, 20%)")} position={[12, 7, 0]} />
        <TextGroup visible={param === "Sex Ratio"} hin="लिंग अनुपात" eng="Sex Ratio" color={new THREE.Color("hsl(239, 80%, 20%)")} position={[12, 7, 0]} />
        <TextGroup visible={param === "Forest Cover"} hin="वन क्षेत्र" eng="Forest Cover" color={new THREE.Color("hsl(124, 100%, 20%)")} position={[12, 7, 0]} />
        <States param={param} name="States" position={[0, 0, 0]} url="assets/models/states.glb"/>
      </Suspense>
    </Canvas>
  )
}
, Table = ({ param, data }) => {
  l(data)
  return (
    <div>{param}</div>
  )
}

export default function App() {
  cl(); l(total)

  const [guiData, setGuiData] = useState({ activeObject: "None", showHelpers: true })
  , [param, setParam] = useState(null)
  , [camera, setCamera] = useState(null)
  , getStateData = type => {
    return Object.entries(StatesData).sort((a, b) => {
      let field = ""

      switch(type){
        case 'C': break;
      }

      return -1
    })
  }

  useEffect(() => {
    new HttpService()
    .get('https://api.covid19india.org/data.json')
    .then(res => {
      const data = res.data.statewise
      total.cases = parseInt(data[0].confirmed)

      data.shift()
      // l(data)
      data.forEach((item, i) => {
        // l(item.statecode)
        if(item.statecode === "CT") item.statecode = "CG"
        else if(item.statecode === "OR") item.statecode = "OD"
        else if(item.statecode === "UN") item.statecode = "UK"
        else if(item.statecode === "TG") item.statecode = "TS"

        if(item.statecode !== "UT"){
          StatesData[item.statecode].cases = parseInt(item.confirmed)
          StatesData[item.statecode].covidData = item
        }
      })
      // l(StatesData)
    })
  }, [])

  return (<>
    <DatGui data={guiData} onUpdate={setGuiData}>
      <DatBoolean path='showHelpers' label='Show Helpers' />
      <DatString path='activeObject' label='Active Object' />
    </DatGui>
    {guiData.showHelpers && <FPSStats bottom={50} left={30} top={"unset"}/>}
    <CanvasGroup guiData={guiData} param={param} onCreated={({ camera }) => setCamera(camera)}/>
    <div className="ctn-table">
      {param !== null && <Table param={param} data={getStateData(param)} />}
      <pre>{JSON.stringify(Object.entries(StatesData), null, 2)}</pre>
    </div>
    <div className="ctn-btn">
      <button onClick={() => { setParam("Covid 19 Cases"); }}>Covid 19</button>
      <button onClick={() => { setParam("Population"); }}>Population</button>
      <button onClick={() => { setParam("Area"); }}>Area</button>
      <button onClick={() => { setParam("Crime Rate"); }}>Crime</button>
      <button onClick={() => { setParam("Literacy"); }}>Literacy</button>
      <button onClick={() => { setParam("Poverty"); }}>Poverty</button>
      <button onClick={() => { setParam("Sex Ratio"); }}>Sex Ratio</button>
      <button onClick={() => { setParam("Forest Cover"); }}>Forest</button>
      <button onClick={() => { setParam(null); }}>Normal</button>
      {/*<button onClick={() => {
        camera.position.set(0, 0, 0);
        camera.rotation.set(0, 0, 0);
        l(camera.quaternion)
      }}>Reset Camera</button>*/}
    </div>
  </>)
}
