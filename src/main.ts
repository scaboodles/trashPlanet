import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DynamicObj, LoadedObj, loadModels } from './registry';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

type SceneState={
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    modelRegisty: Map<string, LoadedObj>;
    pointer : THREE.Vector2;
    camera: THREE.Camera;
    selectedObject: DynamicObj | null;
}

const raycaster = new THREE.Raycaster();

const init = async () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.z = 5;


    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    const modelDict = await loadModels();
    scene.add(modelDict.get("duck")!.obj);

    const temp_sun_loader = new GLTFLoader();
    temp_sun_loader.load('../assets/the_star_sun/scene.gltf', function(gltf) {
        gltf.scene.position.set(100.0, 0.0, 0.0);
        scene.add(gltf.scene);
    }, undefined, function(error) {
        console.error(error);
    })
	
	// Add a glow effect to the sun
    const glow_map = new THREE.TextureLoader().load( './assets/glow.png' );
    const alphaTexture = new THREE.TextureLoader().load('./assets/glow.png');
    const glow_material = new THREE.SpriteMaterial( {
        map: glow_map,
        color: 0xffd164,
        transparent: true,
        blending: THREE.AdditiveBlending,
        alphaMap: alphaTexture
    } );

    const sprite = new THREE.Sprite( glow_material );
    sprite.scale.set(100.0, 100.0, 1.0)
    sprite.position.set(100,0,0);
    scene.add( sprite );

    const cubemap_loader = new THREE.CubeTextureLoader();
    var cubemap = cubemap_loader.load([
        '../assets/skybox/right.png',
        '../assets/skybox/left.png',
        '../assets/skybox/top.png',
        '../assets/skybox/bottom.png',
        '../assets/skybox/front.png',
        '../assets/skybox/back.png',
    ]);

    scene.background = cubemap;

    const sunlight = new THREE.PointLight(0xffffff);
    sunlight.position.set(1.0, 0.0, 0.0);
    sunlight.decay = 0.0;
    scene.add(sunlight);



    const light = new THREE.AmbientLight( 0xffffff ); // soft white light
    scene.add( light );

    renderer.setClearColor(0xffffff);

    const controls = new OrbitControls( camera, renderer.domElement );

    // update mouse control buttons
    controls.mouseButtons = {
        LEFT: null,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE
    }

    controls.update();

    const state: SceneState = {
        scene: scene,
        renderer: renderer,
        modelRegisty: modelDict,
        pointer: new THREE.Vector2(),
        camera: camera,
        selectedObject: null,
    }

    window.addEventListener( 'mousedown', (event) => onPointerMove(event, state) );

    renderer.setAnimationLoop(() => animate(state));
}

function onPointerMove( event: MouseEvent, state: SceneState ) {
	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components
	state.pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	state.pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( state.pointer, state.camera );
    // calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects( state.scene.children );

    if(intersects.length > 0){
        const mesh = intersects[0].object as THREE.Mesh;
        if(Array.isArray(mesh.material)){
            mesh.material[0].visible = false;
        }else{
            mesh.material.visible=false;
        }
    }
}

function animate(state: SceneState) {
	state.renderer.render(state.scene, state.camera);
}

init();