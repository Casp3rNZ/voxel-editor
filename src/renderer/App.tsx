import { useState, useEffect, useRef } from 'react';
import './css/App.css';
import { BabylonScene, BabylonSceneRef } from './babylon/scene';

function App() {
    const [appVersion, setAppVersion] = useState<string>('');
    const [appName, setAppName] = useState<string>('');
    const [toolMode, setToolMode] = useState<'select' | 'place'>('select');
    const [voxelColor, setVoxelColor] = useState('#9932CC');
    const babylonSceneRef = useRef<BabylonSceneRef>(null);

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

    const handleMouseDown = async (e: React.MouseEvent) => {
        if (e.button === 0 && window.electronAPI) { // Left mouse button
            e.preventDefault();
            // initial mouse position
            const startX = e.screenX;
            const startY = e.screenY;
            // initial window position
            const [initialWindowX, initialWindowY] = await window.electronAPI.getWindowPosition();
            let isMoving = false;
            
            const handleMouseMove = (moveEvent: MouseEvent) => {
                if (!isMoving) {
                    isMoving = true;
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
            
            // unregister mouse move and up listeners
            const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
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
                <BabylonScene ref={babylonSceneRef} />
                <aside className="toolbar">
                    <h3>Toolbar</h3>
                    <div>
                        <div className="toolbar-section">
                            <h5>Mode:</h5>
                            <div className="mode-selection">
                                <input 
                                    type="radio" 
                                    id="select" 
                                    name="mode" 
                                    value="select" 
                                    checked={toolMode === 'select'}
                                    onChange={() => {
                                        setToolMode('select');
                                        babylonSceneRef.current?.setMode('select');
                                    }}
                                />
                                <label htmlFor="select">Select</label>
                                <input 
                                    type="radio" 
                                    id="place" 
                                    name="mode" 
                                    value="place" 
                                    checked={toolMode === 'place'}
                                    onChange={() => {
                                        setToolMode('place');
                                        babylonSceneRef.current?.setMode('place');
                                    }}
                                />
                                <label htmlFor="place">Place</label>
                            </div>
                        </div>
                        <div className="toolbar-section">
                            <h5>Tools:</h5>
                            <ul>
                                <li onClick={() => babylonSceneRef.current?.clearScene()}>Clear Scene</li>
                                <li onClick={() => {
                                    const voxels = babylonSceneRef.current?.exportVoxels();
                                    if (voxels) {
                                        console.log('Exported voxels:', voxels);
                                        navigator.clipboard.writeText(JSON.stringify(voxels));
                                    }
                                }}>Export (Copy to Clipboard)</li>
                                <li onClick={async () => {
                                    try {
                                        const text = await navigator.clipboard.readText();
                                        const voxels = JSON.parse(text);
                                        babylonSceneRef.current?.importVoxels(voxels);
                                    } catch (e) {
                                        console.error('Failed to import voxels:', e);
                                    }
                                }}>Import (From Clipboard)</li>
                            </ul>
                        </div>
                        <div className="toolbar-section">
                            <h5>Properties:</h5>
                            <div className="property-group">
                                <label className="property-label">Voxel Color:</label>
                                <input 
                                    className="property-value" 
                                    type="color" 
                                    value={voxelColor}
                                    onChange={(e) => {
                                        setVoxelColor(e.target.value);
                                        babylonSceneRef.current?.setVoxelColor(e.target.value);
                                    }}
                                />
                                <label className="property-label">Transparent:</label>
                                <input className="property-value" type="checkbox" />
                                <p>coordinate: xyz</p>
                            </div> 
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
}

export default App;