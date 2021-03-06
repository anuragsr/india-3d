import React, { useRef, useState, useEffect, useMemo, setGlobal, useGlobal, Suspense } from 'reactn'
import { animated as animatedHtml } from 'react-spring'
import { extend, Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { animated, useSpring } from '@react-spring/three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import * as THREE from 'three'
import NProgress from 'nprogress'

import StatesData from 'helpers/indiaStatesObj'
import CovidData from 'helpers/data.min.json'
import HttpService from 'helpers/HttpService'

// Debug
import DatGui, { DatBoolean, DatFolder, DatButton } from 'react-dat-gui'
import 'react-dat-gui/dist/index.css'
import FPSStats from 'react-fps-stats'
import { l, cl } from 'helpers'

// Make OrbitControls known as <orbitControls />
extend({ OrbitControls })
setGlobal({ selectedState: null })

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
, rotYTable = -.2
// , rotYTable = 0

let currPos, finalPos

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
, States = ({ name, url, position, filter, showInfo }) => {
  if(!filter.name.length) currPos = -4, finalPos = 0
  else currPos = 0, finalPos = -4

  const gltf = useLoader(GLTFLoader, url )
  , ref = useRef()
  , infoRef = useRef()
  , { viewport } = useThree() // viewport -> canvas in 3d units (meters)
  , from = { pos: currPos }
  , to = { pos: finalPos }
  , config = { mass: 5, tension: 400, friction: 70, precision: 0.0001 }
  , { pos } = useSpring({ from, to, config })
  , [selectedState, set] = useGlobal('selectedState')

  NProgress.done()
  document.querySelector(".overlay .ctn-btn").classList.add("enabled")

  useFrame(({ mouse }) => {
    const x = (mouse.x * viewport.width) / 1000
    , y = (mouse.y * viewport.height) / 1000

    if(filter.name.length && ref.current) ref.current.rotation.set(-y, x + .25, 0)
    infoRef.current && infoRef.current.position.set(mouse.x * viewport.width/2, mouse.y * viewport.height/2, 0)
  })

  return (
    <animated.group ref={ref} name={name} position-x={pos}>
      {gltf.scene.children.map((child, idx) => <StateSingle key={idx} filter={filter} {...child}/>)}
      <group ref={infoRef}>
        <Html style={{ pointerEvents: "none" }}>
          <div className={`ctn-info-box ${!selectedState ? "hidden" : ""}`}>
            {selectedState && <div>
              <div className="hin">राज्य / यू.टी. : {selectedState.state.hin}</div>
              <div className="hin">राजधानी : {selectedState.capital.hin}</div>
              <hr />
              <div>State / U.T. : {selectedState.state.eng}</div>
              <div>Capital : {selectedState.capital.eng}</div>
            </div>}
          </div>
        </Html>
      </group>
    </animated.group>
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

  switch(child.filter.name){
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
  , [selectedState, set] = useGlobal('selectedState')
  , [hovered, setHovered] = useState(false)
  , { opacity } = useSpring({ opacity: hovered ? .6 : 1 })

  return (
    <animated.mesh { ...child }
      onPointerOver={(e) => {
        e.stopPropagation()
        // l("In", e.eventObject.name)
        if(!child.filter.name.length){
          set(StatesData[e.eventObject.name])
          setHovered(true)
        }
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        // l("Out", e.eventObject.name)
        if(!child.filter.name.length){
          set(null)
          setHovered(false)
        }
      }}
      scale-y={scaleYVal}>
      <animated.meshPhongMaterial side={THREE.DoubleSide} color={colorVal} transparent={true} opacity={opacity}/>
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
    from: { rotationY: Math.PI/2 + rotYTable},
    to: { rotationY: 0 + rotYTable},
    reset: true,
    config: springConfig
  })

  return (
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
      <mesh position={[0, 1.25, -.2]}>
        <planeBufferGeometry args={[14, 5]} />
        <meshPhongMaterial color={'black'} transparent={true} opacity={.9} />
      </mesh>
    </animated.group>
  )
}
, Table = ({ filter, position, data }) => {
  // l(data)
  const config = { mass: 5, tension: 400, friction: 50, precision: 0.0001 }
  , { rotationY } = useSpring({
    from: { rotationY: Math.PI/2 + rotYTable },
    to: { rotationY: 0 + rotYTable },
    delay: 50,
    reset: true,
    config
  })

  // {/*<pre>{JSON.stringify(data, null, 2)}</pre>*/}
  return (
    <animated.group position={position} rotation-y={rotationY}>
      {filter.name !== "" ?
      <Html transform={true}>
        <div className="ctn-table">
          <div className="t-title">राज्य अनुसार सूची <span>State wise list</span></div><hr/><br/>
          <div className="t-head">
            <div className="name"
              style={{ width: filter.name === filters[0].name ? 150 : 200 }}>
              राज्य<br/><span>State</span></div>
            <TableHead filter={filter}/>
          </div>
          {data.map((item, i) => (
            <div key={i} className="t-row" style={{ backgroundColor: filter.color }}>
              <div className="name"
                style={{ width: filter.name === filters[0].name ? 150 : 250 }}>
                {item[1].state.hin}<br/><span>{item[1].state.eng}</span>
              </div>
              <TableRow filter={filter} state={item[1]}/>
            </div>
          ))}
        </div>
      </Html> : null}
    </animated.group>
  )
}
, TableHead = ({ filter }) => {
  let head = ""
  switch (filter.name) {
    case 'Covid 19 Cases':
      head = <>
        <div>परीक्षण<br/><span>Tested</span></div>
        <div>पुष्टीकृत<br/><span>Confirmed</span></div>
        <div>स्वस्थ हुए<br/><span>Recovered</span></div>
      </>
    break;
    case 'Area':          head = <div>{filter.hin} (वर्ग किमी)<br/><span>{filter.name} (km<sup>2</sup>)</span></div>; break;
    case 'Crime Rate':    head = <div>रिपोर्ट किए गए अपराध<br/><span>Crimes Reported (2018)</span></div>; break;
    case 'Literacy':
    case 'Poverty':       head = <div>{filter.hin} (%)<br/><span>{filter.name} (%)</span></div>; break;
    case 'Sex Ratio':     head = <div>महिलाएं प्रति 1,000 पुरुष<br/><span>Females per 1,000 Males</span></div>; break;
    case 'Forest Cover':  head = <div>राज्य क्षेत्र का प्रतिशत<br/><span>Percent of State Area</span></div>; break;
    default:              head = <div>{filter.hin}<br/><span>{filter.name}</span></div>; break;
  }

  return head
}
, TableRow = ({ filter, state }) => {
  const format = n => parseInt(n).toLocaleString('en-IN')
  let row = ""

  switch (filter.name) {
    case 'Covid 19 Cases':
      row = state.covidData ? <>
          <div><span>{format(state.covidData.total.tested)}</span></div>
          <div><span>{format(state.covidData.total.confirmed)}</span></div>
          <div><span>{format(state.covidData.total.recovered)}</span></div>
        </> : <>
          <div><span>N/A</span></div>
          <div><span>N/A</span></div>
          <div><span>N/A</span></div>
        </>
    break;
    case 'Population':  row = <div><span>{format(state.population)}</span></div>; break;
    case 'Area':        row = <div><span>{format(state.area)}</span></div>; break;
    case 'Crime Rate':  row = <div><span>{state.crimeRate === 0 ? "N/A" : format(state.crimeRate)}</span></div>; break;
    case 'Literacy':    row = <div><span>{state.literacy}</span></div>; break;
    case 'Poverty':     row = <div><span>{state.poverty}</span></div>; break;
    case 'Sex Ratio':   row = <div><span>{format(state.sexRatio)}</span></div>; break;
    case 'Forest Cover':row = <div><span>{state.forest}</span></div>; break;
    default:break;
  }
  return row
}
, Sound = ({ url }) => {
  const soundRef = useRef()
  , { camera } = useThree()
  , [listener] = useState(() => new THREE.AudioListener())
  , buffer = useLoader(THREE.AudioLoader, url)

  useEffect(() => {
    const sound = soundRef.current
    sound.setBuffer(buffer)
    sound.setVolume(.3)
    sound.setLoop(true)
    sound.play()
  }, [])

  return <positionalAudio ref={soundRef} args={[listener]} />
}
, THREEScene = props => {
  const { guiData, filter } = props
  , position = [15.5, 7, 0]
  , getStateData = type => Object.entries(StatesData).sort((a, b) => {
    let field = ""
    switch(type){
      case 'Covid 19 Cases':  field = "cases";      break;
      case 'Population':      field = "population"; break;
      case 'Area':            field = "area";       break;
      case 'Crime Rate':      field = "crimeRate";  break;
      case 'Literacy':        field = "literacy";   break;
      case 'Poverty':         field = "poverty";    break;
      case 'Sex Ratio':       field = "sexRatio";   break;
      case 'Forest Cover':    field = "forest";     break;
      default:                field = "Rank";       break;
    }
    return a[1][field] < b[1][field] ? 1 : -1
  })
  , env = process.env.REACT_APP_ENV_TYPE

  return (
    <Canvas className="ctn-canvas" camera={{ position: [0, 0, 19] }} {...props}>
      <ambientLight intensity={.3} />
      <PointLightWithHelper visible={guiData.showHelpers} color={0xffffff} intensity={.3} position={[10, 0, 50]}/>
      {guiData.showHelpers && <><gridHelper args={[1000, 100]}/><axesHelper args={[500]} /></>}
      {env === "dev" && <CameraControls />}
      <Suspense fallback={<Box position={[0, 0, 0]} />}>
        {filters.map((item, i) => (
          <TextGroup key={i} visible={filter ? filter.name === item.name : 0} hin={item.hin} eng={item.name} color={new THREE.Color(item.color)} position={position} />
        ))}
        <States showInfo={false} filter={filter} name="States" position={[0, 0, 0]} url="assets/models/states.glb"/>
        <Sound url="assets/sound/bg.mp3" />
        <Table filter={filter} position={[15.5, -2, 0]} data={getStateData(filter.name)} />
      </Suspense>
    </Canvas>
  )
}

export default function App() {
  cl(); l(total)

  const env = process.env.REACT_APP_ENV_TYPE
  , [guiData, setGuiData] = useState({ showHelpers: !true })
  , [filter, setFilter] = useState({ name: "" })
  , { showHelpers } = guiData
  , hideOverlay = () => {
    const arr = [".overlay", ".overlay .ctn-btn", ".overlay .l", ".overlay .r"]
    document.querySelectorAll(arr.join(",")).forEach(el => el.classList.toggle("hidden"))
    document.querySelector(".ctn-canvas").classList.add("shown")
    document.querySelector(".ctn-html").classList.add("shown")
  }
  , { opacity } = useSpring({ opacity: !filter.name.length ? 1 : 0 })
  , prepareStatesData = data => {
    // l(data)
    total.cases = parseInt(data['TT'].total.confirmed)
    Object.entries(data).forEach((value, i) => {
      // l(value)
      let item = value[0]
      if(item === "TT") return

      if(item === "CT") item = "CG"
      else if(item === "OR") item = "OD"
      else if(item === "UT") item = "UK"
      else if(item === "TG") item = "TS"

      if(item !== "UN"){
        StatesData[item].cases = parseInt(value[1].total.confirmed)
        StatesData[item].covidData = value[1]
      }
    })
  }
  , makeRequest = async url => {
    const res = await new HttpService().get(url)
    // l(res)
    if(res.status === 200) prepareStatesData(res.data)
    else prepareStatesData(CovidData)
  }

  useEffect(() => {
    NProgress.start()
    makeRequest('https://data.covid19india.org/v4/min/data.min.json')
  }, [])

  return (<>
    {env === "dev" && <>
      <DatGui data={guiData} onUpdate={setGuiData}>
        <DatBoolean path='showHelpers' label='Show Helpers' />
        <DatButton label='Intro' onClick={hideOverlay} />
        <DatFolder title='Filters' closed={!false}>
          {filters.map((filter, i) => <DatButton key={i} label={filter.name} onClick={() => { setFilter(filter) }} />)}
          <DatButton label='Normal' onClick={() => { setFilter({ name: "" }); }} />
        </DatFolder>
      </DatGui>
      {showHelpers && <FPSStats bottom={20} left={16} top={"unset"}/>}
    </>}
    <div className="overlay">
      <div className="ctn-btn" onClick={hideOverlay}>
        <div className="sm sm1">प्रवेश</div>
        <img src="assets/images/Ashoka_Chakra.svg" alt=""/>
        <div className="sm sm2">Enter</div>
      </div>
      <div className="l">
        <div className="inner">
          <div className="ctn-text shown">
            <h1>India 3D</h1>
            <p>A land of many cultures..a melting pot of<br/> religious, social & ecological diversity.</p>
            <p>This project is a state-wise graphical representation<br/> of the country based on 8 different criteria.</p>
            <p>An informative, educational initiative.</p>
            <p>Use <img src="assets/images/headphone-tr.png" alt="" /> for better experience.</p>
          </div>
        </div>
      </div>
      <div className="r">
        <div className="inner">
          <div className="ctn-text shown">
            <h1>भारत 3D</h1>
            <p>कई संस्कृतियों की भूमि..धार्मिक, सामाजिक<br/> और पारिस्थितिक विविधता का प्रतीक।</p>
            <p>यह प्रोजेक्ट 8 विभिन्न मानदंडों के आधार पर<br/>देश का राज्यानुसार ग्राफिकल प्रतिनिधित्व है।</p>
            <p>एक सूचनात्मक, शैक्षिक पहल।</p>
            <p>बेहतर अनुभव के लिए <img src="assets/images/headphone-tr.png" alt="" /> का इस्तेमाल करें।</p>
          </div>
        </div>
      </div>
    </div>
    <div className={`bg ${filter.name.length ? "active" : ""}`}/>
    <div className="ctn-html">
      <div className="ctn-select">
        <p>
          <span>संबंधित ग्राफिक देखने के लिए एक श्रेणी का चयन करें</span><br/>
          Select a category to view its visualization
        </p>
        <select onChange={e => {
            if(e.target.value.length) setFilter(filters[e.target.value])
            else setFilter({ name: "" })
          }}>
          <option value="">राजनीतिक / Political</option>
          {filters.map((item, i) => <option key={i} value={i}>{item.hin} / {item.name}</option>)}
        </select>
      </div>
      <animatedHtml.div className="ctn-info" style={{ opacity }}>
        <div className="title">
          <img src="assets/images/indian_gov_logo.png" alt=""/>
          <div><span>भारत गणराज्य</span><br/>Republic of India</div>
        </div>
        <p className="ins">
          <span>अतिरिक्त जानकारी देखने के लिए अलग-अलग राज्यों पर माउस ले जाएँ</span><br/>
          Move mouse over individual states to view additional info
        </p>
      </animatedHtml.div>
      <div className="ctn-foot">
        <p>
          <span>सभी डेटा सौजन्य / </span>All data courtesy: <a target="_blank" href="https://en.wikipedia.org">Wikipedia</a>&nbsp;<br/>
          <span>कोविड डेटा सौजन्य / </span>Covid data courtesy: <a target="_blank" href="https://covid19india.org">api.covid19india.org</a>&nbsp;
        </p>
        <p>
          <span>डेटा केवल कल्पना के उद्देश्य के लिए है; 100% सटीक नहीं हो सकता है</span><br/>
          Data may not be 100% accurate; intended for visualization purposes only
        </p>
      </div>

      <div className="ctn-about">
        <h2>भारत 3D / India 3D</h2>
        <div>by&nbsp;
          <a href="http://envisagecyberart.in" target="_blank">अनुराग श्रीवास्तव</a> /&nbsp;
          <a href="http://envisagecyberart.in" target="_blank">Anurag Srivastava</a><br/>
          <a href="http://envisagecyberart.in/projects/threejs-experiments" target="_blank">अधिक 3D प्रोजेक्ट</a> /&nbsp;
          <a href="http://envisagecyberart.in/projects/threejs-experiments" target="_blank">More 3D projects</a>
        </div>
        <a href="https://www.upwork.com/o/profiles/users/~01d929751d145a05ea/" target="_blank">
          <img src="assets/images/upwork.png" alt="" />
        </a>
        <a href="https://www.guru.com/freelancers/anurag-srivastava-27" target="_blank">
          <img src="assets/images/guru.png" alt="" />
        </a>
        <a href="mailto:anurag.131092@gmail.com&Subject=New Work Proposal">
          <img src="assets/images/gmail.png" alt="" />
        </a>
        <a href="https://stackoverflow.com/users/7867822/anurag-srivastava" target="_blank">
          <img src="assets/images/so.png" alt="" />
        </a>
        <a href="https://github.com/anuragsr" target="_blank">
          <img className="last" src="assets/images/github.png" alt="" />
        </a>
      </div>
    </div>
    <THREEScene guiData={guiData} filter={filter}/>
  </>)
}
