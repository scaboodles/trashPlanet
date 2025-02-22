import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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
    velocity : THREE.Vector3;
    pos : THREE.Vector3;
    bake : boolean;
}

export const modelRegistry: StaticObj[] = [
    {
        path: "teapot",
        mass: 1,
        scale: [1,1,1],
    },
    {
        path: "duck",
        mass: 1,
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