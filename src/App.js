import React, { useRef, useEffect, useState, useMemo, Suspense } from 'react'
import { extend, Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import * as THREE from 'three'

import StatesData from './helpers/indiaStatesObj'
import HttpService from './helpers/HttpService'
import { l } from './helpers'

l(StatesData)
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
  // , stateArr = [
  //   "DL", "GA", "TR", "MZ", "MN", "NL", "ML", "AS", "AR", "AP",
  //   "TN", "KL",  "KA", "TS", "OD" , "CG", "JH", "WB",
  //   "UK", "HP", "JK", "MH", "LA", "DN", "DD", "PY", "AN", "LD",
  //   "SK", "BR", "MP", "GJ", "RJ", "CH", "UP", "HR", "PB",
  // ]

  const { viewport } = useThree()
  // viewport = canvas in 3d units (meters)

  const ref = useRef()
  useFrame(({ mouse }) => {
    const x = (mouse.x * viewport.width) / 300
    const y = (mouse.y * viewport.height) / 300
    // ref.current.position.set(x, y, 0)
    ref.current && ref.current.rotation.set(-y, x, 0)
  })

  let arr = []
  // l(stateArr)
  // l(gltf.scene)

  return (
    <group ref={ref} name={name} scale={[1, 1, 1]} position={position}>{gltf.scene.children.map((child, idx) => {
      // l(child.name)
      arr.push(child.name)
      return (
        <mesh
          key={idx}
          { ...child }
          position={position}
          // scale={stateArr.includes(child.name) ? [10,20,10]: [10,10,10]}
          >
          <meshStandardMaterial
            side={THREE.DoubleSide}
            color={StatesData[child.name] ?  StatesData[child.name].color : 0xfff000}
            // color={stateArr.includes(child.name) ? 0xfff000 : 0x000fff}
            // color={0xfff000}
            />
        </mesh>
      )})}
    </group>
  )
}
, Text3D = ({ fontUrl }) => {
    const font = useLoader(THREE.FontLoader, fontUrl)
    const config = useMemo(
      () => ({
        font, size: 10, height: 1, curveSegments: 2, bevelEnabled: true, bevelThickness: 6, bevelSize: .5, bevelOffset: 0, bevelSegments: 2
      }), [font])
    // l(font)

    return (
      <mesh>
        {/*<textGeometry args={["अयान A", config]} />*/}
        <textGeometry args={["Anurag", config]} />
        <meshStandardMaterial side={THREE.DoubleSide} color={0xfff000} />
      </mesh>
    )
}
, TextHindi = ({ text, fontUrl, position }) => {
  // const config = useMemo(
  //   () => ({size: 10, height: 1, curveSegments: 2, bevelEnabled: true, bevelThickness: 6, bevelSize: .5, bevelOffset: 0, bevelSegments: 2
  //   }), [])
    // l(harfbuzz, opentype)
    // const [font, setFont] = useState([])
    const [shapes, setShapes] = useState([])
    const [offset, setOffset] = useState(0)
    // const [mesh, setMesh] = useState(null)
    // // const [allCommands, setAllCommands] = useState([])
    // harfbuzz.createFont(fontUrl, 150, font => {
    //   // setFont(font)
    //   l(font)
    //   // setAllCommands(harfbuzz.commands(font, text, 150, 0, 0))
    // })

    // useEffect(() => {
    //   // l(allCommands)
    //   l(font)
    // }, [font])

    const extrudeSettings = {
      steps: 1,
      amount: 10,
      bevelEnabled: true,
      bevelThickness: 1,
      bevelSize: 1,
      bevelSegments: 1
    };
    let centerOffset = 0
    // const CustGeometry = new THREE.ExtrudeBufferGeometry( shapes, extrudeSettings );
    // extend({ CustGeometry })

    useEffect(() => {
      // l(allCommands)
      // l(font)
      harfbuzz.createFont(fontUrl, 150, font => {
        // setFont(font)
        // l(font)
        // setAllCommands(harfbuzz.commands(font, text, 150, 0, 0))
        let allCommands = harfbuzz.commands(font, text, 150, 0, 0);
        var shapes = []

        for(let i=0; i<allCommands.length; i++) {
          let path = new THREE.ShapePath();
          let commands = allCommands[i];
          for(let j=0; j<commands.length; j++) {
            let command = commands[j];
            switch(command.type) {
              case "M":
                path.moveTo(command.x, command.y);
                break;
              case "L":
                path.lineTo(command.x, command.y);
                break;
              case "Q":
                path.quadraticCurveTo(command.x1, command.y1, command.x, command.y);
                break;
              case "Z":
                path.currentPath = new THREE.Path();
                path.subPaths.push( path.currentPath );
                break;
              default:
                throw "Unsupported command " + JSON.stringify(command);
            }
          }
          shapes = shapes.concat( path.toShapes(true, false) )
        }
        setShapes(shapes)
      })
    }, [])

    useEffect(() => {
      if(!shapes.length) return
      var geometry = new THREE.ExtrudeBufferGeometry( shapes, extrudeSettings );
      geometry.computeBoundingBox();
      geometry.computeVertexNormals();
      centerOffset = -0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x );
      var centerOffset = -0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x );
      console.log(centerOffset);

      // const textMesh1 = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } ) );
      //
      // textMesh1.position.x = centerOffset;
      // textMesh1.position.y = 0;
      // textMesh1.position.z = 0;
      //
      // textMesh1.rotation.x = 0;
      // textMesh1.rotation.y = Math.PI * 2;
      // textMesh1.scale.y *= -1;
      // setMesh(textMesh1)
      // l(centerOffset)
      // setOffset(centerOffset)
    }, [shapes])

    return (
      // shapes.length ?
      // <group position={position} children={[mesh]}>
      // {mesh}
      // </group> :  null

      shapes.length ?
      <group position={position}>
        <mesh position={[-offset*200, 0, 0]}
          rotation={[-Math.PI, Math.PI * 2, 0]}
          // scale={[.2, .2, .2]}
          >
          // <boxBufferGeometry args={[2,2,2]} />
          <extrudeBufferGeometry args={[shapes, extrudeSettings]} />
          <meshStandardMaterial side={THREE.DoubleSide} color={0xff00f0} />
        </mesh>
      </group> :  null
    )
}

export default function App() {
  useEffect(() => {
    new HttpService()
    .get('https://api.covid19india.org/data.json')
    .then(res => {
      const data = res.data.statewise
      data.shift()
      l(data)
    })

    // new HttpService()
    // .get('https://api.covid19india.org/data.json')
    // .then((res) => {
    //   l("again", res)
    // })
  }, [])

  return (
    <Canvas camera={{ position: [0, 0, 17] }}>
      <ambientLight intensity={.3} />
      <pointLight position={[0, 0, 150]} intensity={.5}/>
      {/*<spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <pointLight position={[-10, -10, -10]} />*/}
      <gridHelper args={[1000, 100]}/>
      <axesHelper args={[500]} />
      <CameraControls />
      <Suspense fallback={<Box position={[0, 0, 0]} />}>
        <TextHindi
          fontUrl="assets/fonts/NotoSans-Regular.ttf"
          text="शानदार"
          position={[0, 0, 0]}/>
        <States name="States" position={[0, 0, 0]} url="assets/models/states.glb"/>
      </Suspense>
    </Canvas>
  )
}
