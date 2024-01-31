import * as THREE from 'three';
import { TextureLoader, Mesh, PlaneGeometry, MeshBasicMaterial } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

var camera, scene, renderer, composer, customPass;
var uMouse = new THREE.Vector2(0, 0);
var imageMeshes = [];
var images = document.querySelectorAll('.js-image'); // Replace with your class name
var isScrolling;
var scrollPos = 0; // Current scroll position
var targetRotation = 0; // Target rotation based on scrolling
var currentRotation = 0; // Current rotation, to be eased
var lastScrollPos = 0; // Last scroll position
var targetMouse = new THREE.Vector2(-10, -10); 


function init() {
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
    camera.position.z = 1;

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(renderer.domElement);

    composer = new EffectComposer(renderer);

    images.forEach(img => {
        let texture = new THREE.TextureLoader().load(img.src);
        let mesh = createMeshForImage(img, texture);
        imageMeshes.push(mesh);
        img.style.visibility = 'hidden';
        scene.add(mesh);
    });

    var renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    customPass = createCustomPass();
    customPass.renderToScreen = true;
    composer.addPass(customPass);

    window.addEventListener('resize', onWindowResize, false);
}

function createMeshForImage(img, texture) {
    let bounds = img.getBoundingClientRect();
    let aspect = window.innerWidth / window.innerHeight;
    let width = bounds.width / window.innerWidth * aspect;
    let height = bounds.height / window.innerHeight * aspect;
    let geometry = new THREE.PlaneGeometry(width, height);
    let material = new THREE.MeshBasicMaterial({ map: texture });
    let mesh = new THREE.Mesh(geometry, material);
    mesh.userData.bounds = img.getBoundingClientRect();

    let x = (bounds.left + bounds.width / 2 - window.innerWidth / 2) / window.innerWidth * aspect;
    let y = -(bounds.top + bounds.height / 2 - window.innerHeight / 2) / window.innerHeight * aspect;
    mesh.position.set(x, y, 0);

    return mesh;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);

    let aspect = window.innerWidth / window.innerHeight;
    imageMeshes.forEach((mesh, index) => {
        let img = images[index];
        let bounds = img.getBoundingClientRect();
        let width = bounds.width / window.innerWidth * aspect;
        let height = bounds.height / window.innerHeight * aspect;
        mesh.geometry.dispose();
        mesh.geometry = new THREE.PlaneGeometry(width, height);

        let x = (bounds.left + bounds.width / 2 - window.innerWidth / 2) / window.innerWidth * aspect;
        let y = -(bounds.top + bounds.height / 2 - window.innerHeight / 2) / window.innerHeight * aspect;
        mesh.position.set(x, y, 0);
    });

    updateImagePositions();
}

function updateImagePositions() {
    let aspect = window.innerWidth / window.innerHeight;
    imageMeshes.forEach(mesh => {
        let bounds = mesh.userData.bounds;
        let width = bounds.width / window.innerWidth * aspect;
        let height = bounds.height / window.innerHeight * aspect;

        mesh.geometry.dispose();
        mesh.geometry = new THREE.PlaneGeometry(width, height);

        let x = (bounds.left + bounds.width / 2 - window.innerWidth / 2) / window.innerWidth * aspect;
        let y = (bounds.top + bounds.height / 2 - window.innerHeight / 2 + scrollPos) / window.innerHeight * aspect;
        mesh.position.set(x, y, 0);

        // Apply rotation for 3D effect
        mesh.rotation.z = -currentRotation*1.5; // Adjust direction and amount of rotation here
    });
}


function createCustomPass() {
    var myEffect = {
        uniforms: {
            "tDiffuse": { value: null },
            "resolution": { value: new THREE.Vector2(1., window.innerHeight / window.innerWidth) },
            "uMouse": { value: new THREE.Vector2(-10, -10) },
            "uVelo": { value: 0 },
        },
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform sampler2D tDiffuse;
            uniform vec2 resolution;
            varying vec2 vUv;
            uniform vec2 uMouse;
            float circle(vec2 uv, vec2 disc_center, float disc_radius, float border_size) {
                uv -= disc_center;
                uv *= resolution;
                float dist = sqrt(dot(uv, uv));
                return smoothstep(disc_radius + border_size, disc_radius - border_size, dist);
            }
            void main() {
                vec2 newUV = vUv;
                float c = circle(vUv, uMouse, 0.0, 0.2);
                float r = texture2D(tDiffuse, newUV.xy += c * (0.05 * .1)).x;
                float g = texture2D(tDiffuse, newUV.xy += c * (0.05 * .12)).y;
                float b = texture2D(tDiffuse, newUV.xy += c * (0.05 * .15)).z;
                vec4 color = vec4(r, g, b, 1.);
                gl_FragColor = color;
            }`
    };

    var customPass = new ShaderPass(myEffect);
    customPass.renderToScreen = true;
    return customPass;
}

// Add scroll event listener
window.addEventListener('scroll', function() {
    clearTimeout(isScrolling);
    isScrolling = setTimeout(function() {
        // Scrolling has stopped, set target rotation to zero
        targetRotation = 0;
    }, 66); // 66 milliseconds timeout (about 15fps)
});

document.addEventListener('mousemove', (e) => {
    targetMouse.x = (e.clientX / window.innerWidth);
    targetMouse.y = 1. - (e.clientY / window.innerHeight);
});


function animate() {
    requestAnimationFrame(animate);

    // Update the scroll position
    scrollPos = window.scrollY;
    var scrollChange = scrollPos - lastScrollPos;
    lastScrollPos = scrollPos;

    // Set target rotation based on scroll speed
    if (scrollChange !== 0) {
        targetRotation = scrollChange * 0.001; // Adjust this multiplier for effect intensity
    }

    // Ease the rotation back to zero when scrolling stops
    if (!isScrolling) {
        targetRotation = 0;
    }

    // Smoothly update the current rotation towards the target rotation
    currentRotation += (targetRotation - currentRotation) * 0.05; // Easing factor

    // Smooth hover effect
    uMouse.x += (targetMouse.x - uMouse.x) * 0.05;
    uMouse.y += (targetMouse.y - uMouse.y) * 0.05;
    customPass.uniforms.uMouse.value = uMouse;

    // Update image positions
    updateImagePositions();

    composer.render();
}

init();
animate();
