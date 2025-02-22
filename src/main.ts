import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DynamicObj, loadModels, SceneState, spawnTrash } from './registry';


const getDynamic = (obj: THREE.Object3D, state: SceneState) : DynamicObj => {
    return state.instancedObjects.filter((dynam) => dynam.obj.id == obj.id)[0];
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
        instancedObjects: [],
    }

    window.addEventListener( 'mousedown', (event) => onclickdown(event, state) );

    renderer.setAnimationLoop(() => animate(state));
}

function onclickdown( event: MouseEvent, state: SceneState ) {
    spawnTrash(state);

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components
	state.pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	state.pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( state.pointer, state.camera );
    // calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects( state.scene.children );

    if(intersects.length > 0){
        state.selectedObject = getDynamic(intersects[0].object, state);
    }
}

function animate(state: SceneState) {
	state.renderer.render(state.scene, state.camera);
}

init();