import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer, OutlinePass } from 'three/examples/jsm/Addons.js';
const clip_radius = 100.0;

export type SceneState={
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    modelRegisty: Map<string, LoadedObj>;
    pointer : THREE.Vector2;
    camera: THREE.Camera;
    selectedObject: THREE.Object3D | null;
    composer: EffectComposer;
    outline_pass: OutlinePass;
    time: EngineTime;
    planet: Planet;
}
export type Planet = {
    mass: number;
    check_radius: number;
    objects: THREE.Object3D[];
};

export type EngineTime = {
    delta: number;
    previous_time: number;
};

export type StaticObj = {
    path : string; // folder name
    mass : number; // arbitrary mass unit
    scale : [x:number, y:number, z:number];
};

export type LoadedObj = {
    obj : THREE.Object3D;
    mass : number; // arbitrary mass unit
}

export type DynamicObj = {
    obj: THREE.Object3D;
    velocity : THREE.Vector3;
    bake : boolean;
    mass : number; // arbitrary mass unit

}

export type DynamicMetadata = {
    velocity : THREE.Vector3;
    bake : boolean;
    mass : number; // arbitrary mass unit
    angular_velocity: THREE.Vector3;
}

export const modelRegistry: StaticObj[] = [
    {
        path: "teapot",
        mass: 1,
        scale: [1,1,1],
    },
    {
        path: "duck",
        mass: 2,
        scale: [.7,.7,.7],
    }
]

export const loadModels = async () : Promise<Map<string, LoadedObj>> => {
    const loadedObjects: Map<string, LoadedObj> = new Map();
    const loader = new GLTFLoader();

    const loadPromises = modelRegistry.map(model =>
        new Promise<void>((resolve, reject) => {
            loader.load(
                `../assets/${model.path}/scene.gltf`,
                (gltf) => {
                    gltf.scene.scale.set(...model.scale);
                    loadedObjects.set(model.path, {
                        obj: gltf.scene,
                        mass: model.mass
                    });
                    resolve();
                },
                undefined,
                (error) => {
                    console.error(`Error loading model ${model.path}:`, error);
                    reject(error);
                }
            );
        })
    );

    await Promise.all(loadPromises);
    return loadedObjects;
}

export const spawnTrash = (state: SceneState) => {
    const entriesArray = Array.from(state.modelRegisty.values());
    const random = entriesArray[Math.floor(Math.random() * entriesArray.length)];



    const clone = random.obj.clone();
    const meta : DynamicMetadata = {
        mass: random.mass,
        velocity: new THREE.Vector3((Math.random() * 20.0) - 10.0, (Math.random() * 20.0) - 10.0, (Math.random() * 20.0) - 10.0),
        bake: false,
        angular_velocity: new THREE.Vector3(Math.random() * 2.0, Math.random() * 2.0, Math.random() * 2.0)
    }

    

    clone.userData.meta = meta;

    var phi = (Math.random() * Math.PI) - (Math.PI / 2);
    var theta = Math.random() * Math.PI * 2;
    var magnitude = Math.random() * clip_radius;

    clone.position.x = magnitude * Math.cos(theta) * Math.cos(phi);
    clone.position.y = magnitude * Math.sin(theta) * Math.cos(phi);
    clone.position.z = magnitude * Math.sin(phi);

    clone.rotation.x = Math.random() * 2 * Math.PI;
    clone.rotation.y = Math.random() * 2 * Math.PI;
    clone.rotation.z = Math.random() * 2 * Math.PI;
    state.scene.add(clone);
}