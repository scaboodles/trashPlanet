import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer, OutlinePass } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const clip_radius_multiplier = 100.0;
const spawn_radius_minimum = 1.1;

export type SceneState={
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    modelRegistySM: Map<string, LoadedObj>;
    modelRegistyMD: Map<string, LoadedObj>;
    modelRegistyLG: Map<string, LoadedObj>;
    modelRegistyXLG: Map<string, LoadedObj>;
    pointer : THREE.Vector2;
    camera: THREE.Camera;
    selectedObject: THREE.Object3D | null;
    composer: EffectComposer;
    outline_pass: OutlinePass;
    time: EngineTime;
    planet: Planet;
    mousedown: boolean;
    dragTarget: THREE.Vector3;
    controls: OrbitControls;
    globalscale: number;
    transient: Set<THREE.Object3D>
}
export type Planet = {
    mass: number;
    radius: number;
    check_radius: number;
    objects: THREE.Group;
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

export const modelRegistrySmall: StaticObj[] = [
    {
        path: "teapot",
        mass: 1,
        scale: [1,1,1],
    },
    {
        path: "duck",
        mass: .5,
        scale: [.7,.7,.7],
    },
    {
        path: "stapler",
        mass: 1.5,
        scale: [.8,.8,.8],
    },
    {
        path: "genie_lamp",
        mass: 2,
        scale: [.02,.02,.02],
    },
    {
        path: "head_from_a_bust_of_hadrian",
        mass: 4,
        scale: [8,8,8],
    },
    {
        path: 'free_model_old_rusty_frying_pan',
        mass: 4,
        scale: [.1,.1,.1],
    },
    {
        path: 'cowboy_hat',
        mass: .8,
        scale: [.5,.5,.5],
    },
    {
        path: 'rubber_duck',
        mass: .3,
        scale: [.0025,.0025,.0025],
    },

]

export const modelRegistryMed: StaticObj[] = [
    {
        path: 'ecorche_-_skeleton',
        mass: 100,
        scale: [.1,.1,.1]
    },
    {
        path: 'russian_stove',
        mass:210,
        scale: [4,4,4]
    },
    {
        path: 'rusty_old_fridge',
        mass:330,
        scale:[4.5,4.5,4.5]
    },
    {
        path: 'retro_display_fridge',
        mass:220,
        scale:[2.5,2.5,2.5]
    },
    {
        path: "fridge",
        mass: 360,
        scale: [4,4,4]
    },
    {
        path:"old_bicycle",
        mass: 60,
        scale: [4,4,4]
    },

]


export const modelRegistryLarge: StaticObj[] = [
    {
        path: "road_roller_arp_35",
        mass: 250,
        scale: [1.5,1.5,1.5]
    },
    {
        path: "destroyed_bus_01",
        mass: 1500,
        scale: [2,2,2]
    },
    {
        path: 'van',
        mass: 800,
        scale: [4,4,4]
    },
    {
        path: 'satellite',
        mass: 3000,
        scale: [3.5,3.5,3.5]
    },
    {
        path: 'abandonded_roller_coaster_cart',
        mass: 600,
        scale: [1,1,1]
    },

]

// TODO: MOON, NYC, North America, Generic Planet, abandoned roller coaster, generic planet, prehistoric planet, asteriod 
export const modelRegistryXLarge: StaticObj[] = [
    {
        path: "statue_of_liberty",
        mass: 150000,
        scale: [10,10,10]
    },
    {
        path: "eiffel_tower",
        mass: 200000,
        scale: [23,23,23]
    },
    {
        path: "westminster_abbey",
        mass: 1000000,
        scale: [50,50,50]
    },
    // {
    //     path: "moon",
    //     mass: 1000000000,
    //     scale: [1,1,1]
    // },
    {
        path: "mount_rushmore",
        mass: 200000,
        scale: [125,125,125]
    },
    {
        path: "pyramid",
        mass: 200000,
        scale: [27,27,27]
    },
]

export const loadModelsSmall = async () : Promise<Map<string, LoadedObj>> => {
    const loadedObjects: Map<string, LoadedObj> = new Map();
    const loader = new GLTFLoader();

    const loadPromises = modelRegistrySmall.map(model =>
        new Promise<void>((resolve, reject) => {
            loader.load(
                `../assets/${model.path}/scene.gltf`,
                (gltf) => {
                    gltf.scene.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            child.scale.set(1, 1, 1);
                        }
                    });
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

export const loadModelsMed = async () : Promise<Map<string, LoadedObj>> => {
    const loadedObjects: Map<string, LoadedObj> = new Map();
    const loader = new GLTFLoader();

    const loadPromises = modelRegistryMed.map(model =>
        new Promise<void>((resolve, reject) => {
            loader.load(
                `../assets/${model.path}/scene.gltf`,
                (gltf) => {
                    gltf.scene.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            child.scale.set(1, 1, 1);
                        }
                    });
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

export const loadModelsLarge = async () : Promise<Map<string, LoadedObj>> => {
    const loadedObjects: Map<string, LoadedObj> = new Map();
    const loader = new GLTFLoader();

    const loadPromises = modelRegistryLarge.map(model =>
        new Promise<void>((resolve, reject) => {
            loader.load(
                `../assets/${model.path}/scene.gltf`,
                (gltf) => {
                    gltf.scene.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            child.scale.set(1, 1, 1);
                        }
                    });
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

export const loadModelsXLarge = async () : Promise<Map<string, LoadedObj>> => {
    const loadedObjects: Map<string, LoadedObj> = new Map();
    const loader = new GLTFLoader();

    const loadPromises = modelRegistryXLarge.map(model =>
        new Promise<void>((resolve, reject) => {
            loader.load(
                `../assets/${model.path}/scene.gltf`,
                (gltf) => {
                    gltf.scene.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            child.scale.set(1, 1, 1);
                        }
                    });
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

export const spawnById = (state: SceneState, registry: Map<string, LoadedObj>, id: string, pos: [number, number, number]) => {
    const guy = registry.get(id);
    const clone = guy?.obj.clone();

    const meta : DynamicMetadata = {
        mass: guy!.mass,
        velocity: new THREE.Vector3(0,0,0),
        bake: false,
        angular_velocity: new THREE.Vector3(0,0,0)
    }

    const group = new THREE.Group();
    group.add(clone!);
    
    const box = new THREE.Box3().setFromObject(clone!);
    const center = box.getCenter(new THREE.Vector3());
    
    // offset model inside group
    clone!.position.sub(center);
    group.position.set(...pos)
    group.userData.meta = meta
    
    state.scene.add(group);
}

export const spawnTrash = (state: SceneState) => {

    const r1 = Math.floor(Math.random() * 5);
    const r2 = Math.floor(Math.random() * 5);


    const lvls = {
        XL: 100000,
        L: 5000,
        M: 25,
        S: 0,
    };



    let entriesArray, prevLevel;

    if (state.planet.mass > lvls.XL) {
      [entriesArray, prevLevel] = [state.modelRegistyXLG, state.modelRegistyLG];
      
    } else if (state.planet.mass > lvls.L) {
      [entriesArray, prevLevel] = [state.modelRegistyLG, state.modelRegistyMD];
    } else if (state.planet.mass > lvls.M) {
      [entriesArray, prevLevel] = [state.modelRegistyMD, state.modelRegistySM];
    } else {
      entriesArray = state.modelRegistySM;
    }
    entriesArray = Array.from(entriesArray?.values() || []);
    
    if (prevLevel) {
      const prevValues = Array.from(prevLevel.values());
      entriesArray.push(prevValues[r1], prevValues[r2]);
    }

    const random = entriesArray[Math.floor(Math.random() * entriesArray.length)];

    const clone = random.obj.clone();
    const meta : DynamicMetadata = {
        mass: random.mass,
        velocity: new THREE.Vector3((Math.random() * 20.0) - 10.0, (Math.random() * 20.0) - 10.0, (Math.random() * 20.0) - 10.0),
        bake: false,
        angular_velocity: new THREE.Vector3(Math.random() * 2.0, Math.random() * 2.0, Math.random() * 2.0)
    }

    const phi = (Math.random() * Math.PI) - (Math.PI / 2);
    const theta = Math.random() * Math.PI * 2;
    const magnitude = (Math.random() * clip_radius_multiplier * state.planet.radius) + (spawn_radius_minimum * state.planet.radius);
    const group = new THREE.Group();
    group.add(clone);
    
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    
    // offset model inside group
    clone.position.sub(center);

    group.userData.meta = meta
    group.position.x = magnitude * Math.cos(theta) * Math.cos(phi);
    group.position.y = magnitude * Math.sin(theta) * Math.cos(phi);
    group.position.z = magnitude * Math.sin(phi);

    group.rotation.x = Math.random() * 2 * Math.PI;
    group.rotation.y = Math.random() * 2 * Math.PI;
    group.rotation.z = Math.random() * 2 * Math.PI;  

  
    state.scene.add(group);
    state.transient.add(group);
}