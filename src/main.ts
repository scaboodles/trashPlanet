import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadModels, SceneState, spawnTrash } from './registry';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GUI } from 'dat.gui'

const raycaster = new THREE.Raycaster();

const planet_values = {
    mass: 0,
    gravity: 0,
}

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

    const temp_sun_loader = new GLTFLoader();
    temp_sun_loader.load('../assets/the_star_sun/scene.gltf', function(gltf) {
        gltf.scene.userData.sun = true;
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

    const composer = new EffectComposer(renderer);

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const outlinePass= new OutlinePass(
        new THREE.Vector2(window.innerWidth, window.innerHeight), //resolution parameter
        scene,
        camera
    );

    var params = {
        edgeStrength: 2,
        edgeGlow: 1,
        edgeThickness: 1.0,
        pulsePeriod: 0,
        usePatternTexture: false
    };


    outlinePass.edgeStrength = params.edgeStrength;
    outlinePass.edgeGlow = params.edgeGlow;
    outlinePass.visibleEdgeColor.set(0xffffff);
    outlinePass.hiddenEdgeColor.set(0xffffff);

    composer.addPass(outlinePass);
    
    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    const state: SceneState = {
        scene: scene,
        renderer: renderer,
        modelRegisty: modelDict,
        pointer: new THREE.Vector2(),
        camera: camera,
        selectedObject: null,
        composer: composer,
        outline_pass: outlinePass,
    }
    setupDragTest(state);
    window.addEventListener( 'mousedown', (event) => onclickdown(event, state) );

    window.addEventListener( 'mousemove', (event) => onPointerMove(event, state) );



    animate(state);
    // massController.domElement.style.pointerEvents = 'none';
    //renderer.setAnimationLoop(() => animate(state));
}

function onPointerMove( event: MouseEvent, state: SceneState ) {
	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components
	state.pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	state.pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( state.pointer, state.camera );
    // calculate objects intersecting the picking ray
    const filtered: THREE.Object3D[] = [];
    state.scene.children.forEach(child => {
        if(!child.userData.sun){
            filtered.push(child)
        }
    });
    
	const intersects = raycaster.intersectObjects( filtered );

    state.outline_pass.selectedObjects = [];

    if(intersects.length > 0)
    {
        const mesh = intersects[0].object;
        if(!mesh.userData.sun)
        {
            state.outline_pass.selectedObjects = [mesh];
        }
    }

    /*if(intersects.length > 0){
        const mesh = intersects[0].object as THREE.Mesh;
        if(Array.isArray(mesh.material)){
            state.outline_pass.selectedObjects = [mesh];
        }else{
            state.outline_pass.selectedObjects = [mesh];
        }
    }*/
}

function onclickdown( event: MouseEvent, state: SceneState ) {
	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components
	state.pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	state.pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( state.pointer, state.camera );
    // calculate objects intersecting the picking ray
    const filtered: THREE.Object3D[] = [];
    state.scene.children.forEach(child => {
        if(!child.userData.sun){
            filtered.push(child)
        }
    });
    
	const intersects = raycaster.intersectObjects( filtered );

    state.outline_pass.selectedObjects = [];

    if(intersects.length > 0)
    {
        const mesh = intersects[0].object;
        if(!mesh.userData.sun)
        {
            state.outline_pass.selectedObjects = [mesh];
        }
    }
}

const gui = new GUI();
gui.add( planet_values, 'mass' ).listen();

//function updateMass(){}


function animate(state: SceneState) {
    state.composer.render();
    requestAnimationFrame(() => {animate(state)})
}



init();