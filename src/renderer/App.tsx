import { useState, useEffect, useRef } from 'react';
import './css/App.css';
import { BabylonScene, BabylonSceneRef } from './babylon/scene';
import { AbstractMesh } from '@babylonjs/core';

function App() {
    const [appVersion, setAppVersion] = useState<string>('');
    const [appName, setAppName] = useState<string>('');
    const [toolMode, setToolMode] = useState<'select' | 'place' | 'delete'>('select');
    const [nextVoxelColor, setNextVoxelColor] = useState('#9932CC');
    const babylonSceneRef = useRef<BabylonSceneRef>(null);
    const [selectedMesh, setSelectedMesh] = useState<AbstractMesh | null>(null);

    useEffect(() => {
        // Test the IPC API
        const loadAppInfo = async () => {
            try {
                if (window.electronAPI) {
                    const version = await window.electronAPI.getVersion();
                    const name = await window.electronAPI.getName();
                    setAppVersion(version);
                    setAppName(name);
                }
            } catch (error) {
                console.error('Error loading app info:', error);
            }

        };

        loadAppInfo();
    }, []);

    const handleMinimize = async () => {
        if (window.electronAPI) {
            await window.electronAPI.minimizeWindow();
        }
    };

    const handleMaximize = async () => {
        if (window.electronAPI) {
            await window.electronAPI.maximizeWindow();
        }
    };

    const handleClose = async () => {
        if (window.electronAPI) {
            await window.electronAPI.closeWindow();
        }
    };

    const handleIsMaximized = async () => {
        var out: boolean = false;
        if (window.electronAPI) {
            out = await window.electronAPI.isWindowMaximized() == true ? true : false;
        }
        return out;
    };

    const handleMeshSelected = (mesh: AbstractMesh | null) => {
        setSelectedMesh(mesh);
        console.log('Mesh selected in App:', mesh);
    }

    const handleToolModeChange = (mode: 'select' | 'place' | 'delete') => {
        setToolMode(mode);
        babylonSceneRef.current?.setMode(mode);
    }

    const handleClipboardCopy = async () => {
        const voxels = babylonSceneRef.current?.exportVoxels();
        if (voxels) {
            console.log('Exported voxels:', voxels);
            navigator.clipboard.writeText(JSON.stringify(voxels));
        }
    };

    const handleClipboardPaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const voxels = JSON.parse(text);
            babylonSceneRef.current?.importVoxels(voxels);
        } catch (e) {
            console.error('Failed to import voxels:', e);
        }
    };

    const handleNextVoxelColorChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
        setNextVoxelColor(newColor);
        babylonSceneRef.current?.setVoxelColor(newColor);
    };

    const handleExportToGLB = async () => {
        await babylonSceneRef.current?.exportVoxelsAsGLB();
    }

    const handleMouseDown = async (e: React.MouseEvent) => {
        if (e.button === 0 && window.electronAPI) { // Left mouse button
            e.preventDefault();
            // initial mouse position
            const startX = e.screenX;
            const startY = e.screenY;
            // initial window position
            const [initialWindowX, initialWindowY] = await window.electronAPI.getWindowPosition();
            let isMoving = false;
            
            const handleMouseMove = async (moveEvent: MouseEvent) => {
                if (moveEvent.movementX === 0 && moveEvent.movementY === 0) return;
                if (!isMoving) {
                    isMoving = true;
                    // Not sure why this doesn't work
                    //const maximized = await handleIsMaximized();
                    //if (maximized) {
                    //    console.log('Minimizing window for move');
                    //    await handleMinimize();
                    //    return;
                    //}
                    requestAnimationFrame(async () => {
                        const deltaX = moveEvent.screenX - startX;
                        const deltaY = moveEvent.screenY - startY;
                        const newX = initialWindowX + deltaX;
                        const newY = initialWindowY + deltaY;
                        if (window.electronAPI) {
                            await window.electronAPI.setWindowPosition(newX, newY);
                        }
                        isMoving = false;
                    });
                }
            };
            
            const handleMouseUp = () => {
                // unregister mouse move and up listeners
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);

                // if drag ended at top of screen, maximize window
                if (window.electronAPI && window.screenY < -0.1) {
                    handleMaximize();
                }
            };
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
    };

    return (
        <div className="App">
            <header className="App-header" onMouseDown={handleMouseDown}>
                <h3>{appName} - v{appVersion}</h3>
                <div className="window-controls">
                    <button onClick={handleMinimize}>-</button>
                    <button onClick={handleMaximize}>=</button>
                    <button onClick={handleClose}>x</button>
                </div>
            </header>
            <main>
                <BabylonScene 
                ref={babylonSceneRef}
                onMeshSelected={handleMeshSelected} 
                />
                <aside className="toolbar">
                    <h3>Toolbar</h3>
                    <div>
                        <div className="toolbar-section">
                            <h5>Mode:</h5>
                            <div className="mode-selection">
                                <input type="radio" id="select" name="mode" value="select" checked={toolMode === 'select'} 
                                onChange={(e) => handleToolModeChange(e.target.value as 'select' | 'place' | 'delete')}/>
                                <label htmlFor="select">Select</label>
                                <input type="radio" id="place" name="mode" value="place" checked={toolMode === 'place'} 
                                onChange={(e) => handleToolModeChange(e.target.value as 'select' | 'place' | 'delete')}/>
                                <label htmlFor="place">Place</label>
                                <input type="radio" id="delete" name="mode" value="delete" checked={toolMode === 'delete'}
                                    onChange={(e) => handleToolModeChange(e.target.value as 'select' | 'place' | 'delete')}/>
                                <label htmlFor="delete">Delete</label>
                            </div>
                        </div>
                        <div className="toolbar-section">
                            <h5>Tools:</h5>
                            <ul>
                                <li onClick={() => babylonSceneRef.current?.clearScene()}>Clear Scene</li>
                            </ul>
                        </div>
                        <div className="toolbar-section">
                            <h5>Export/Import:</h5>
                            <ul>
                                <li onClick={handleClipboardCopy}>Export (Copy to Clipboard)</li>
                                <li onClick={handleClipboardPaste}>Import (From Clipboard)</li>
                                <li onClick={handleExportToGLB}>Export to GLB file</li>
                            </ul>
                        </div>
                        <div className="toolbar-section">
                            <h5>Properties:</h5>
                            <div className="property-group">
                                <label className="property-label">Voxel Color:</label>
                                <input className="property-value" type="color" value={nextVoxelColor} onChange={(e) => {handleNextVoxelColorChange(e);}}/>
                                <div>
                                    <label className="property-label">Transparent:</label>
                                    <input className="property-value" type="checkbox" />
                                </div>
                            </div> 
                        </div>
                        <div className="toolbar-section">
                            <h5>Selected Voxel:</h5>
                            {selectedMesh ? (
                                <div className="property-group">
                                    <label className="property-label">ID: {selectedMesh.id}</label>
                                    <div>
                                        <label className="property-label">Position:</label>
                                        <p className="property-value">{`(${selectedMesh.position.x.toFixed(2)}, ${selectedMesh.position.y.toFixed(2)}, ${selectedMesh.position.z.toFixed(2)})`}</p>
                                    </div>
                                    <div>
                                        <label className="property-label">Scaling:</label>
                                        <p className="property-value">{`(${selectedMesh.scaling.x.toFixed(2)}, ${selectedMesh.scaling.y.toFixed(2)}, ${selectedMesh.scaling.z.toFixed(2)})`}</p>
                                    </div>
                                </div>
                            ) : (
                                <p>No Voxel selected</p>
                            )}
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
}

export default App;