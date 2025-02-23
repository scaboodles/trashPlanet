import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer, OutlinePass } from 'three/examples/jsm/Addons.js';

export type SceneState={
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    modelRegisty: Map<string, LoadedObj>;
    pointer : THREE.Vector2;
    camera: THREE.Camera;
    selectedObject: THREE.Object3D | null;
    composer: EffectComposer;
    outline_pass: OutlinePass;
}

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
        velocity: new THREE.Vector3(),
        bake: false,
    }

    clone.userData.meta = meta;

    state.scene.add(clone);
}