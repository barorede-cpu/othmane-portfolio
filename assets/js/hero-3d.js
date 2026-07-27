import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('hero3d');
if (canvas && window.WebGLRenderingContext) {
  try {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hero = canvas.closest('.hero');

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0, 0.3, 9);
    camera.lookAt(0, 0, 0);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.06).texture;

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(4, 6, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xe6ff4d, 0.5);
    fill.position.set(-6, -2, 3);
    scene.add(fill);
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    const gold = new THREE.MeshStandardMaterial({ color: 0xe6ff4d, metalness: 1, roughness: 0.32 });
    const ink = new THREE.MeshStandardMaterial({ color: 0x1c1d22, metalness: 1, roughness: 0.4 });

    const group = new THREE.Group();

    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.11, 24, 96), gold);
    ring.position.set(2.6, 1.1, -1.5);
    ring.rotation.set(0.6, 0.4, 0);
    group.add(ring);

    const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 0), ink);
    gem.position.set(-2.9, -0.6, -0.5);
    group.add(gem);

    const rivetGroup = new THREE.Group();
    const rivetBody = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.28, 32), gold);
    rivetBody.rotation.z = Math.PI / 2;
    const capA = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), gold);
    capA.rotation.z = -Math.PI / 2;
    capA.position.x = 0.14;
    const capB = capA.clone();
    capB.rotation.z = Math.PI / 2;
    capB.position.x = -0.14;
    rivetGroup.add(rivetBody, capA, capB);
    rivetGroup.position.set(0.6, -1.6, 1.2);
    rivetGroup.scale.setScalar(1.15);
    group.add(rivetGroup);

    scene.add(group);

    function size() {
      const rect = hero.getBoundingClientRect();
      const w = rect.width, h = rect.height;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    size();
    window.addEventListener('resize', size);

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      if (!reduce) {
        const t = clock.getElapsedTime();
        ring.rotation.x += 0.0025;
        ring.rotation.y += 0.0035;
        ring.position.y = 1.1 + Math.sin(t * 0.6) * 0.12;
        gem.rotation.x += 0.004;
        gem.rotation.y += 0.006;
        gem.position.y = -0.6 + Math.sin(t * 0.5 + 2) * 0.14;
        rivetGroup.rotation.y += 0.005;
        rivetGroup.position.y = -1.6 + Math.sin(t * 0.7 + 1) * 0.1;
      }
      renderer.render(scene, camera);
    }
    animate();
  } catch (e) {
    /* WebGL unsupported or blocked — hero still reads fine without it */
  }
}
