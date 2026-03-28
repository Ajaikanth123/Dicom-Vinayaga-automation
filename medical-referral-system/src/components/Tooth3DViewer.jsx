import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';

const ToothModel = () => {
    const { scene } = useGLTF('/3d.glb');
    const meshRef = useRef();

    useFrame((_, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.4;
        }
    });

    return (
        <primitive
            ref={meshRef}
            object={scene}
            scale={1.5}
            position={[0, 0, 0]}
        />
    );
};

const Tooth3DViewer = () => {
    return (
        <div className="tooth-3d-container">
            <Canvas
                camera={{ position: [0, 0, 5], fov: 40 }}
                style={{ width: '100%', height: '100%' }}
                gl={{ antialias: true, alpha: true }}
            >
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
                <directionalLight position={[-3, 3, -3]} intensity={0.4} color="#b0e0d6" />
                <pointLight position={[0, -3, 2]} intensity={0.3} color="#4a9d8e" />

                <Suspense fallback={null}>
                    <ToothModel />
                    <Environment preset="studio" />
                </Suspense>

                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate={false}
                    enableRotate={false}
                />
            </Canvas>
            <div className="tooth-glow"></div>
        </div>
    );
};

// Preload the model
useGLTF.preload('/3d.glb');

export default Tooth3DViewer;
