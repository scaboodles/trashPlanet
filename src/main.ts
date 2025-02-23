import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadModels, SceneState, spawnTrash } from './registry';

const raycaster = new THREE.Raycaster();

const setupDragTest = (state: SceneState) => {
    const geometry = new THREE.SphereGeometry(.5, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.x = 5
    state.scene.add(sphere);
    
    spawnTrash(state);
}

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
    }

    setupDragTest(state);

    window.addEventListener( 'mousedown', (event) => onclickdown(event, state) );

    renderer.setAnimationLoop(() => animate(state));
}

function onclickdown( event: MouseEvent, state: SceneState ) {
	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components
	state.pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	state.pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( state.pointer, state.camera );
    // calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects( state.scene.children );

    if(intersects.length > 0){
        state.selectedObject = intersects[0].object;
    }
}

function animate(state: SceneState) {
	state.renderer.render(state.scene, state.camera);
}

init();