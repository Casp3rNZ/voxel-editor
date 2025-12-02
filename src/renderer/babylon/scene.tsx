import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { 
    AbstractMesh, 
    Scene, 
    Vector3, 
    StandardMaterial, 
    MeshBuilder, 
    DirectionalLight, 
    ShadowGenerator, 
    Color3, 
    ArcRotateCamera, 
    Engine, 
    HemisphericLight, 
    Color4, 
    PointerEventTypes, 
    PickingInfo
} from '@babylonjs/core';
import { GLTF2Export,  } from '@babylonjs/serializers';

// Define the interface for methods exposed to parent components
export interface BabylonSceneRef {
    setMode: (mode: 'select' | 'place' | 'delete') => void;
    setVoxelColor: (color: string) => void;
    clearScene: () => void;
    exportVoxels: () => Array<{ position: Vector3; color: string }>;
    importVoxels: (voxels: Array<{ position: Vector3; color: string }>) => void;
    exportVoxelsAsGLB: () => Promise<void>;
    clearSelection: () => void;
}

interface BabylonSceneProps {
    onMeshSelected: (mesh: AbstractMesh | null) => void;
}

export const BabylonScene = forwardRef<BabylonSceneRef, BabylonSceneProps>(({ onMeshSelected }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<Scene | null>(null);
    const currentModeRef = useRef<'select' | 'place' | 'delete'>('select');
    const currentVoxelColorRef = useRef('#9932CC');
    const highlightBoxRef = useRef<AbstractMesh | null>(null);
    const selectBoxRef = useRef<AbstractMesh | null>(null);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
        setMode: (mode: 'select' | 'place' | 'delete') => {
            currentModeRef.current = mode;
        },
        
        setVoxelColor: (color: string) => {
            currentVoxelColorRef.current = color;
        },

        clearSelection: () => {
            if (selectBoxRef.current) {
                selectBoxRef.current.isVisible = false;
            }
            if (highlightBoxRef.current) {
                highlightBoxRef.current.isVisible = false;
            }
        },
        
        clearScene: () => {
            if (sceneRef.current) {
                // Remove all voxels except the initial one
                sceneRef.current.meshes.filter(mesh => 
                    mesh.name.startsWith('voxel_') && mesh.name !== 'voxel_0'
                ).forEach(mesh => mesh.dispose());
            }
        },
        
        exportVoxels: () => {
            if (!sceneRef.current) return [];
            return sceneRef.current.meshes
                .filter(mesh => mesh.name.startsWith('voxel_'))
                .map(mesh => ({
                    position: mesh.position,
                    color: (mesh.material as StandardMaterial)?.diffuseColor.toHexString() || (mesh.material as StandardMaterial)?.emissiveColor.toHexString() || '#FFFFFF',
                }));
        },
        
        importVoxels: (voxels: Array<{ position: Vector3; color: string }>) => {
            if (!sceneRef.current) return;
            
            // Clear existing voxels first
            sceneRef.current.meshes.filter(mesh => 
                mesh.name.startsWith('voxel_') && mesh.name !== 'voxel_0'
            ).forEach(mesh => mesh.dispose());
            
            // Create new voxels
            voxels.forEach((voxelData, index) => {
                const newVoxel = MeshBuilder.CreateBox(`voxel_${index}`, { size: 1 }, sceneRef.current!);
                newVoxel.position = new Vector3(voxelData.position.x, voxelData.position.y, voxelData.position.z);
                const voxelMaterial = new StandardMaterial(`voxelMaterial_${index}`, sceneRef.current!);
                voxelMaterial.diffuseColor = Color3.FromHexString(voxelData.color);
                newVoxel.material = voxelMaterial;
                
                // Add shadow support to imported voxels
                const dirLight = sceneRef.current!.lights.find(light => light instanceof DirectionalLight) as DirectionalLight;
                const shadowGen = dirLight?.getShadowGenerator() as ShadowGenerator;
                if (shadowGen) {
                    shadowGen.addShadowCaster(newVoxel);
                    newVoxel.receiveShadows = true;
                }
            });
        },

        exportVoxelsAsGLB: async () => {
            if (!sceneRef.current) return;
            try {
                const voxelMeshes = sceneRef.current.meshes.filter(mesh => mesh.name.startsWith('voxel_'));
                const glb = await GLTF2Export.GLBAsync(sceneRef.current, "voxels-model", {
                    shouldExportNode: (node) => voxelMeshes.includes(node as AbstractMesh)
                });
                glb.downloadFiles();
            }catch (error) {
                console.error("Error exporting GLB:", error);
            }
        }
    }), []);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const engine = new Engine(canvas, true);
        const scene = new Scene(engine);
        sceneRef.current = scene;

        // Camera
        const camera = new ArcRotateCamera(
            'camera',
            -Math.PI / 1,
            Math.PI / 2.5,
            10,
            new Vector3(0, 1, 0) ,
            scene
        );
        camera.attachControl(canvas, true);
        camera.wheelDeltaPercentage = 0.01;
        camera.lowerRadiusLimit = 2;
        camera.upperRadiusLimit = 50;
        camera.panningSensibility = 1000; // Higher value = slower panning (default is 50)
        camera.useAutoRotationBehavior = false;
        if (camera.autoRotationBehavior) {
            camera.autoRotationBehavior.idleRotationSpeed = 0.1;
            camera.autoRotationBehavior.idleRotationWaitTime = 2000;
            camera.autoRotationBehavior.idleRotationSpinupTime = 1000;
        }
        // Light
        const light = new HemisphericLight(
            'light',
            new Vector3(0, 1, 0),
            scene
        );
        light.intensity = 0.6;

        // directional light with shadow mapping
        const dirLight = new DirectionalLight(
            'dirLight',
            new Vector3(-1, -2, -1),
            scene
        );
        dirLight.position = new Vector3(20, 40, 20);
        dirLight.intensity = 1;
        
        // Create shadow generator
        const shadowGenerator = new ShadowGenerator(1024, dirLight);
        shadowGenerator.darkness = 0.3; 
        shadowGenerator.bias = 0.00001;


        // Box
        const box = MeshBuilder.CreateBox('voxel_0', { size: 1 }, scene);
        box.position.y = 0.5;
        box.showBoundingBox = false;
        
        // Add the initial voxel to shadow casters and receivers
        shadowGenerator.addShadowCaster(box);
        box.receiveShadows = true;

        // background bright sky
        scene.clearColor = new Color4(0.8, 0.9, 1, 1);

        // Create a highlight mesh for voxel preview
        highlightBoxRef.current = MeshBuilder.CreateBox('highlightBox', { size: 1 }, scene);
        highlightBoxRef.current.material = new StandardMaterial('highlightMaterial', scene);
        (highlightBoxRef.current.material as StandardMaterial).alpha = 0.9;
        highlightBoxRef.current.isVisible = false;
        highlightBoxRef.current.isPickable = false;
        highlightBoxRef.current.showBoundingBox = true;

        // Create a outline box for the selected voxel
        selectBoxRef.current = MeshBuilder.CreateBox('selectBox', { size: 1 }, scene);
        selectBoxRef.current.material = new StandardMaterial('selectMaterial', scene);
        (selectBoxRef.current.material as StandardMaterial).alpha = 0.5;
            (selectBoxRef.current.material as StandardMaterial).emissiveColor = new Color3(0, 1, 0);
        selectBoxRef.current.isVisible = false;
        selectBoxRef.current.isPickable = false;
        selectBoxRef.current.showBoundingBox = true;

        // Ground plane for raycasting reference
        // const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 20, height: 20 }, scene);
        // const groundMaterial = new BABYLON.StandardMaterial('groundMaterial', scene);
        // groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        // ground.material = groundMaterial;

        // Mouse event handlers with throttling
        let lastMoveTime = 0;
        const moveThrottle = 30; // ~33fps throttling
        
        const onPointerMove = (evt: PointerEvent) => {
            if (highlightBoxRef.current === null) return;
            const currentTime = Date.now();
            if (currentTime - lastMoveTime < moveThrottle) return;
            lastMoveTime = currentTime;
            const pmPickInfo = scene.pick(evt.clientX, evt.clientY);
            switch (currentModeRef.current) {
                case 'place':
                    if (pmPickInfo && pmPickInfo.hit && pmPickInfo.pickedPoint && pmPickInfo.pickedMesh) {
                        // Only show highlight when over existing voxels (ground is commented out)
                        if (pmPickInfo.pickedMesh.name.startsWith('voxel_')) {
                            const newBlockPos = getNewBlockPos(pmPickInfo);
                            if (!newBlockPos) {
                                return;
                            }
                            // Position highlight box at calculated target position
                            highlightBoxRef.current.position = new Vector3(newBlockPos.x, newBlockPos.y, newBlockPos.z);
                            (highlightBoxRef.current.material as StandardMaterial).emissiveColor = Color3.FromHexString(currentVoxelColorRef.current);
                            highlightBoxRef.current.isVisible = true;
                        } else {
                            highlightBoxRef.current.isVisible = false;
                        }
                    } else {
                        highlightBoxRef.current.isVisible = false;
                    }
                    break;
                case 'select':
                    if(pmPickInfo && pmPickInfo.hit && pmPickInfo.pickedMesh) {
                        // highlight selected voxel
                        highlightBoxRef.current.position = pmPickInfo.pickedMesh.position;
                        (highlightBoxRef.current.material as StandardMaterial).emissiveColor = new Color3(0, 1, 0);
                        highlightBoxRef.current.isVisible = true;
                    }else {
                        highlightBoxRef.current.isVisible = false;
                    }
                    break;
                case 'delete':
                    if(pmPickInfo && pmPickInfo.hit && pmPickInfo.pickedMesh) {
                        if(pmPickInfo.pickedMesh.name === "voxel_0") return; // don't highlight the base voxel
                        // highlight voxel to be deleted
                        highlightBoxRef.current.position = pmPickInfo.pickedMesh.position;
                        (highlightBoxRef.current.material as StandardMaterial).emissiveColor = new Color3(1, 0, 0);
                        highlightBoxRef.current.isVisible = true;
                    }else {
                        highlightBoxRef.current.isVisible = false;
                    }
                    break;
            }
        };

        const onPointerDown = (evt: PointerEvent) => {
            if (highlightBoxRef.current === null || selectBoxRef.current === null) return;
            if (evt.button !== 0) return; // Only left click
            const pcPickInfo = scene.pick(evt.clientX, evt.clientY);
            switch(currentModeRef.current) {
                case 'place':
                    if (pcPickInfo && pcPickInfo.hit && pcPickInfo.pickedPoint && pcPickInfo.pickedMesh) {
                        // Only place voxels when clicking on existing voxels
                        if (pcPickInfo.pickedMesh.name.startsWith('voxel_')) {
                            const newBlockPos = getNewBlockPos(pcPickInfo);
                            if (!newBlockPos) return;
                            // Check if there's already a voxel at this position
                            const targetPosition = new Vector3(newBlockPos.x, newBlockPos.y, newBlockPos.z);
                            const existingVoxel = scene.meshes.find(mesh => 
                                mesh.name.startsWith('voxel_') && 
                                mesh.position.subtract(targetPosition).length() < 0.1 // Small tolerance for floating point comparison
                            );
                            
                            if (!existingVoxel) {
                                const newVoxel = MeshBuilder.CreateBox(`voxel_${Date.now()}`, { size: 1 }, scene);
                                newVoxel.position = targetPosition;
                                newVoxel.isPickable = true;
                                
                                const voxelMaterial = new StandardMaterial(`voxelMaterial_${Date.now()}`, scene);
                                // Convert hex color to RGB
                                const color = Color3.FromHexString(currentVoxelColorRef.current);
                                voxelMaterial.diffuseColor = color;
                                newVoxel.material = voxelMaterial;
                                
                                // Add shadow casting and receiving to new voxels
                                shadowGenerator.addShadowCaster(newVoxel);
                                newVoxel.receiveShadows = true;
                            }
                        }
                    }
                    break;
                case 'delete':
                    if (pcPickInfo && pcPickInfo.hit && pcPickInfo.pickedMesh) {
                        if(pcPickInfo.pickedMesh.name === "voxel_0") return; // don't delete the base voxel
                        console.log(`Deleting voxel: ${pcPickInfo.pickedMesh.name} at position ${pcPickInfo.pickedMesh.position.toString()}`);
                        if (pcPickInfo.pickedMesh.name.startsWith('voxel_')) {
                            // Remove from shadow casters
                            shadowGenerator.removeShadowCaster(pcPickInfo.pickedMesh);
                            pcPickInfo.pickedMesh.dispose();
                            highlightBoxRef.current.isVisible = false;
                        }
                    }
                    break;
                case 'select':
                    if(pcPickInfo && pcPickInfo.hit && pcPickInfo.pickedMesh) {
                        if(onMeshSelected) {
                            selectBoxRef.current.position = pcPickInfo.pickedMesh.position;
                            selectBoxRef.current.isVisible = true;
                            onMeshSelected(pcPickInfo.pickedMesh);
                        }
                    }else{
                        if(onMeshSelected) {
                            selectBoxRef.current.isVisible = false;
                            onMeshSelected(null);
                        }
                    }
                    break;
            }
        };

        // Disable camera controls when interacting with voxels
        const onPointerObservable = scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERMOVE:
                    if (pointerInfo.event) {
                        onPointerMove(pointerInfo.event as PointerEvent);
                    }
                    break;
                case PointerEventTypes.POINTERDOWN:
                    if (pointerInfo.event && (pointerInfo.event as PointerEvent).button === 0) {
                        // Temporarily disable camera controls during voxel placement
                        camera.detachControl();
                        onPointerDown(pointerInfo.event as PointerEvent);
                    }
                    break;
                case PointerEventTypes.POINTERUP:
                    // Re-enable camera controls
                    camera.attachControl(canvas, true);
                    break;
            }
        });

        const getNewBlockPos = (pick: PickingInfo) => {
            if (!pick.pickedPoint || !pick.pickedMesh) return null;
            let targetX: number;
            let targetY: number;
            let targetZ: number;
            
            // Determine face based on hit point relative to voxel center
            const voxelPos = pick.pickedMesh.position;
            const hitPoint = pick.pickedPoint;
            
            // Calculate relative position of hit point to voxel center
            const relativeX = hitPoint.x - voxelPos.x;
            const relativeY = hitPoint.y - voxelPos.y;
            const relativeZ = hitPoint.z - voxelPos.z;
            
            // Find which face was hit based on which coordinate is closest to the edge
            const absX = Math.abs(relativeX);
            const absY = Math.abs(relativeY);
            const absZ = Math.abs(relativeZ);
            const maxVal = Math.max(absX, absY, absZ);
            
            if (maxVal === absY) {
                // Top/bottom face hit (Y is dominant)
                targetY = voxelPos.y + (relativeY > 0 ? 1 : -1);
                targetX = voxelPos.x;
                targetZ = voxelPos.z;
            } else if (maxVal === absX) {
                // Left/right face hit (X is dominant)
                targetX = voxelPos.x + (relativeX > 0 ? 1 : -1);
                targetY = voxelPos.y;
                targetZ = voxelPos.z;
            } else {
                // Front/back face hit (Z is dominant)
                targetZ = voxelPos.z + (relativeZ > 0 ? 1 : -1);
                targetX = voxelPos.x;
                targetY = voxelPos.y;
            }
            return { x: targetX, y: targetY, z: targetZ };
        };

        // Render loop
        engine.runRenderLoop(() => {
            scene.render();
        });

        window.addEventListener('resize', () => {
            engine.resize();
        });

        // Cleanup
        return () => {
            scene.onPointerObservable.remove(onPointerObservable);
            engine.dispose();
        };
    }, []);

    return <canvas className="editor-canvas" ref={canvasRef} />;
});