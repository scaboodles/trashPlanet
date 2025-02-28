import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadModelsLarge, loadModelsMed, loadModelsSmall, loadModelsXLarge, SceneState, spawnById} from './registry';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const init = async () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.z = 5;


    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    const modelDict = await loadModelsSmall();
    const modelDictMed = await loadModelsMed();
    const modelDictLG = await loadModelsLarge();
    const modelDictXL = await loadModelsXLarge();

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
        modelRegistySM: modelDict,
        modelRegistyMD: modelDictMed,
        modelRegistyLG: modelDictLG,
        modelRegistyXLG: modelDictXL,
        pointer: new THREE.Vector2(),
        camera: camera,
        selectedObject: null,
        composer: composer,
        outline_pass: outlinePass,
        mousedown: false,
        dragTarget: new THREE.Vector3,
    }

    spawnById(state, state.modelRegistySM, "teapot", [0,0,0]);
    spawnById(state, state.modelRegistySM, "duck", [1,0,0]);
    spawnById(state, state.modelRegistySM, "stapler", [-1,0,0]);
    spawnById(state, state.modelRegistySM, "genie_lamp", [-2,0,0]);
    spawnById(state, state.modelRegistySM, "head_from_a_bust_of_hadrian", [-3,0,0]);
    spawnById(state, state.modelRegistySM, "free_model_old_rusty_frying_pan", [-6,0,0]);

    spawnById(state, state.modelRegistyMD, "ecorche_-_skeleton", [0,0,10]);
    spawnById(state, state.modelRegistyMD, "russian_stove", [-5,0,10]);
    spawnById(state, state.modelRegistyMD, "rusty_old_fridge", [-9,0,10]);
    spawnById(state, state.modelRegistyMD, "retro_display_fridge", [-15,0,10]);

    spawnById(state, state.modelRegistyLG, "road_roller_arp_35", [0,0,25]);
    spawnById(state, state.modelRegistyLG, "destroyed_bus_01", [-20,0,25]);

    //spawnById(state, state.modelRegistyXLG, "statue_of_liberty", [0,0,-100]);
    //spawnById(state, state.modelRegistyXLG, "eiffel_tower", [-200,0,-100]);
    //spawnById(state, state.modelRegistyXLG, "westminster_abbey", [-800,0,-100]);

    animate(state);
    //renderer.setAnimationLoop(() => animate(state));
}

function animate(state: SceneState) {
    state.composer.render();
    requestAnimationFrame(() => {animate(state)})
}

init();