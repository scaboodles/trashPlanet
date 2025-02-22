export type StaticObj = {
    path : string; // path to gltf file
    mass : number; // arbitrary mass unit
    scale : THREE.Vector3;
};

export type DynamicObj = {
    velocity : THREE.Vector3;
    pos : THREE.Vector3;
    bake : boolean;
}