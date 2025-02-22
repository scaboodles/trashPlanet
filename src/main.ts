import * as THREE from 'three';
import { loadModels } from './registry';

const init = async () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    const modelDict = await loadModels();
    scene.add(modelDict.get("duck")!.obj);

    const light = new THREE.AmbientLight( 0xffffff ); // soft white light
    scene.add( light );

    camera.position.z = 5;

    renderer.render( scene, camera );
}

init();