import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const BlackHole: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // 1. Scene Setup
        const scene = new THREE.Scene();
        // scene.background = new THREE.Color(0x050505); // Let CSS handle background for transparency if needed, or match site

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);

        // 2. The Event Horizon (Black Sphere)
        const geometry = new THREE.SphereGeometry(1.5, 64, 64);
        const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        // 3. Accretion Disk (Particles)
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 2000;
        const posArray = new Float32Array(particlesCount * 3);
        const colorArray = new Float32Array(particlesCount * 3);

        const colorInside = new THREE.Color(0xD4AF37); // Gold
        const colorOutside = new THREE.Color(0xffffff); // White

        for (let i = 0; i < particlesCount * 3; i += 3) {
            // Flattened disk distribution
            const angle = Math.random() * Math.PI * 2;
            const radius = 2 + Math.random() * 3; // Distance from hole
            const spread = (Math.random() - 0.5) * 0.2; // Thin disk

            posArray[i] = Math.cos(angle) * radius;
            posArray[i + 1] = spread * (radius * 0.5); // Thicker at edges
            posArray[i + 2] = Math.sin(angle) * radius;

            // Gradient colors based on radius
            const mixedColor = colorInside.clone().lerp(colorOutside, (radius - 2) / 3);
            colorArray[i] = mixedColor.r;
            colorArray[i + 1] = mixedColor.g;
            colorArray[i + 2] = mixedColor.b;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.02,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8
        });

        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);

        // 4. Glow / Lens Effect (Optional simple sprite)
        // Leaving out for simplicity/performance unless requested

        // 5. Interaction (Mouse movement affects camera rotation)
        let mouseX = 0;
        let mouseY = 0;

        const handleMouseMove = (event: MouseEvent) => {
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', handleMouseMove);

        // 6. Animation Loop
        const animate = () => {
            requestAnimationFrame(animate);

            // Rotate Disk
            particlesMesh.rotation.y += 0.002;

            // Camera Float
            camera.position.x += (mouseX * 1 - camera.position.x) * 0.05;
            camera.position.y += (mouseY * 1 - camera.position.y) * 0.05;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
        };

        animate();

        // 7. Resize Handler
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            geometry.dispose();
            material.dispose();
            particlesGeometry.dispose();
            particlesMaterial.dispose();
            renderer.dispose();
        };

    }, []);

    return <div ref={mountRef} className="absolute inset-0 z-0 pointer-events-none" />;
};

export default BlackHole;
