import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { loadModelsMed, loadModelsSmall, SceneState, spawnTrash, EngineTime, Planet, loadModelsLarge, loadModelsXLarge } from './registry';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { getParallaxCorrectNormal } from 'three/tsl';

const raycaster = new THREE.Raycaster();

let clip_radius_multiplier = 100.0;
//let clip_radius = 1.0;
var time_since_spawn = 0.0;
var time_to_wait = 1.0;

const grav_const = 6.67428 * 0.000001;

const init = async () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.z = 3.0;


    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    const modelDictSM = await loadModelsSmall();
    const modelDictMD = await loadModelsMed();
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

    var engine_time: EngineTime = {
        delta: 0.0,
        previous_time: Date.now()
    }

    var teapot_template = modelDictSM.get('teapot');
    var starting_teapot = teapot_template!.obj.clone();

    let planet: Planet = {
        mass: teapot_template?.mass!,
        //mass: 100000000,
        check_radius: 10.0,
        radius: 1.0,
        objects: new THREE.Group()
    };

    scene.add(starting_teapot!);
    planet.objects.add(starting_teapot!);
    scene.add(planet.objects);


    const state: SceneState = {
        scene: scene,
        renderer: renderer,
        pointer: new THREE.Vector2(),
        camera: camera,
        selectedObject: null,
        composer: composer,
        outline_pass: outlinePass,
        time: engine_time,
        planet: planet,
        mousedown: false,
        dragTarget: new THREE.Vector3,
        controls: controls,

        modelRegistySM: modelDictSM,
        modelRegistyMD: modelDictMD,
        modelRegistyLG: modelDictLG,
        modelRegistyXLG: modelDictXL
    }


    state.controls.minDistance = 2;
    let planet_box: THREE.Box3 = new THREE.Box3().setFromObject(state.planet.objects);
    let planet_sphere: THREE.Sphere = new THREE.Sphere();
    planet_box.getBoundingSphere(planet_sphere);
    state.controls.maxDistance = 3.0 * planet_sphere.radius;
    state.planet.radius = planet_sphere.radius;

    window.addEventListener( 'mousedown', (event) => onMouseDown(event, state) );
    window.addEventListener( 'mousemove', (event) => onPointerMove(event, state) );
    window.addEventListener( 'mouseup', (event) => onMouseUp(event, state) );

    animate(state);
    //renderer.setAnimationLoop(() => animate(state));
}

const getParentGroup = (obj: THREE.Object3D) : THREE.Object3D | null => {
    if(obj.userData.meta){
        return obj;
    }else if(!obj.parent){
        return null;
    }else{
        return getParentGroup(obj.parent!);
    }
}

function onPointerMove( event: MouseEvent, state: SceneState ) {
	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components
	state.pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	state.pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( state.pointer, state.camera );
    // calculate objects intersecting the picking ray
    if(!state.mousedown){
        const filtered: THREE.Object3D[] = [];
        state.scene.children.forEach(child => {
            if(!child.userData.sun){
                filtered.push(child)
            }
        });
        
        // outline pass
        const intersects = raycaster.intersectObjects( filtered );

        state.outline_pass.selectedObjects = [];

        if(intersects.length > 0)
        {
            const mesh = getParentGroup(intersects[0].object);
            if(mesh && !mesh.userData.meta.bake)
            {
                state.outline_pass.selectedObjects = [mesh];
            }
        }
    } else if (state.selectedObject != null){
        //const mid= new THREE.Vector3().addVectors(state.selectedObject.position, new THREE.Vector3(0,0,0)).multiplyScalar(0.5);
        //const normal = new THREE.Vector3().subVectors( new THREE.Vector3(0,0,0), state.selectedObject.position).normalize();

        const plane = new THREE.Plane();
        const normal = new THREE.Vector3();
        state.camera.getWorldDirection(normal);

        plane.setFromNormalAndCoplanarPoint(normal, new THREE.Vector3(0,0,0));

        raycaster.setFromCamera( state.pointer, state.camera );
        const intersect = new THREE.Vector3();
        const hits = raycaster.ray.intersectPlane(plane, intersect);
        if(hits){
            state.dragTarget = intersect;
        }
    }
}

function onMouseDown( event: MouseEvent, state: SceneState ) {
	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components
    state.mousedown = true;
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
    
	const intersects = raycaster.intersectObjects( state.scene.children.filter((child) => { return child.userData.meta}) );

    state.outline_pass.selectedObjects = [];

    if(intersects.length > 0)
    {
        const mesh = getParentGroup(intersects[0].object);
        if(mesh && !mesh.userData.meta.bake){
            state.outline_pass.selectedObjects = [mesh];
            state.selectedObject = mesh;
            state.dragTarget = state.selectedObject.position;
        }
    }
}

const onMouseUp = (event: MouseEvent, state: SceneState) => {
    // reset highlight on mouseup
    state.mousedown = false; 
    state.selectedObject = null;

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
        const mesh = getParentGroup(intersects[0].object);
        if(mesh && !mesh.userData.meta.bake)
        {
            state.outline_pass.selectedObjects = [mesh];
        }
    }
}

let prevLine : THREE.Line | null = null;
function animate(state: SceneState) {
    const current_time = Date.now();
    state.time.delta = (current_time - state.time.previous_time) * 0.001;
    state.time.previous_time = current_time;

    if(prevLine != null){
        state.scene.remove(prevLine);
        prevLine = null;
    }

    if(state.selectedObject){
        // draw line between moving and target
        const geometry = new THREE.BufferGeometry().setFromPoints([state.selectedObject.position, state.dragTarget]);
        const material = new THREE.LineBasicMaterial({ color: 0xffffff });
        const line = new THREE.Line(geometry, material);
        prevLine = line;
        state.scene.add(prevLine);
        // damp current and add velocity on selected
        const damp = .9;
        const juice = 100;

        const meta = state.selectedObject.userData.meta;
        meta.velocity.multiplyScalar(damp);
        meta.velocity.addScaledVector(new THREE.Vector3().subVectors(state.dragTarget, state.selectedObject.position), state.time.delta * juice );
    }

    spawn_items(state);
    handle_physics(state, state.time.delta, state.scene.children.filter((child) => { return (child.userData.meta);}));

    //state.planet.objects.rotation.y += 0.5 * state.time.delta;

    state.composer.render();
    requestAnimationFrame(() => {animate(state)})
}

init();

function spawn_items(state: SceneState)
{
    time_since_spawn += state.time.delta;

    if(time_since_spawn > time_to_wait) {
        time_since_spawn = 0.0;
        time_to_wait = Math.random();
        spawnTrash(state);
    }
}

function handle_physics(state: SceneState, delta: number, objects: THREE.Object3D[])
{
    var despawned_items: THREE.Object3D[] = [];

    objects.forEach((item) => {

        //if(item.position.length() <= state.planet.check_radius)
        //{
            let item_bbox: THREE.Box3 = new THREE.Box3().setFromObject(item);
            let item_size: THREE.Vector3 = new THREE.Vector3();
            item_bbox.getSize(item_size);
            item_size.multiplyScalar(-0.25);
            item_bbox.expandByVector(item_size);

            // Check for collisions against all objects that are part of the planet
            state.planet.objects.children.forEach((planet_object) => {
                var planet_bbox: THREE.Box3 = new THREE.Box3().setFromObject(planet_object);
                let planet_item_size: THREE.Vector3 = new THREE.Vector3();
                planet_bbox.getSize(planet_item_size);
                planet_item_size.multiplyScalar(-0.25);
                planet_bbox.expandByVector(planet_item_size);

                if(item_bbox.intersectsBox(planet_bbox) && item.userData.meta.bake == false)
                {
                    var zero_vec: THREE.Vector3 = new THREE.Vector3(0.0, 0.0, 0.0);
                    item.userData.meta.velocity = zero_vec;
                    item.userData.meta.angular_velocity = zero_vec;
                    item.userData.meta.bake = true;
        
                    // Update planet radius and planet group
                    state.planet.objects.add(item);
                    state.planet.mass += item.userData.meta.mass;

                    // Three JS doesn't let you make a bounding sphere directly from a group so we have to do this instead :(
                    let planet_box: THREE.Box3 = new THREE.Box3().setFromObject(state.planet.objects);
                    let planet_sphere: THREE.Sphere = new THREE.Sphere();
                    planet_box.getBoundingSphere(planet_sphere);

                    state.controls.maxDistance = planet_sphere.radius * 3.0;
                    state.planet.radius = planet_sphere.radius;
                }
            });
        //}

        // Get velocity vector pointing from position to origin
        var grav_vel: THREE.Vector3 = item.position.clone().multiplyScalar(-1.0);
        var grav_dist_sq = grav_vel.lengthSq();

        var grav_strength = (grav_const * item.userData.meta.mass * state.planet.mass) / grav_dist_sq;
        grav_vel = grav_vel.normalize().multiplyScalar(grav_strength);

        item.userData.meta.velocity.add(grav_vel);

        item.rotation.x += item.userData.meta.angular_velocity.x * delta;
        item.rotation.y += item.userData.meta.angular_velocity.y * delta;
        item.rotation.z += item.userData.meta.angular_velocity.z * delta;
        //item.position.add(new THREE.Vector3(item.userData.meta.velocity.x * delta, item.userData.meta.velocity.y * delta, item.userData.meta.velocity.z * delta))
        item.position.add(item.userData.meta.velocity.clone().multiplyScalar(delta));

        if(item.position.length() > clip_radius_multiplier * state.planet.radius) {
            despawned_items.push(item);
        }
    });

    despawned_items.forEach((item) => {
        state.scene.remove(item);
    });
}