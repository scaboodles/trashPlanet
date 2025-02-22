import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );

const loader = new GLTFLoader();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function onPointerMove( event: MouseEvent ) {

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components

	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( pointer, camera );
    // calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects( scene.children );

	for ( let i = 0; i < intersects.length; i ++ ) {
        console.log(intersects[i]);

		const mesh = (intersects[ i ].object as THREE.Mesh);
        if(Array.isArray(mesh.material)){
            mesh.material[0].visible = false;
        }else{
            mesh.material.visible=false;
        }
	}

}


renderer.setClearColor(0xffffff);

loader.load( '../assets/teapot/scene.gltf', function ( gltf ) {
    //gltf.scene.scale.set(10.0, 10.0, 10.0);

    const box = new THREE.BoxHelper(gltf.scene, 0xff0000);
    scene.add(box);
    
    
	scene.add( gltf.scene );

}, undefined, function ( error ) {
	console.error( error );
} );

const light = new THREE.AmbientLight( 0xffffff ); // soft white light
scene.add( light );

camera.position.z = 5;

const controls = new OrbitControls( camera, renderer.domElement );
controls.update();

// update mouse control buttons
controls.mouseButtons = {
    LEFT: null,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE
}


function animate() {

    controls.update();
	renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );

window.addEventListener( 'mousedown', onPointerMove );