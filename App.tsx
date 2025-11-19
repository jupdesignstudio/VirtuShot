import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  Plus, 
  Image as ImageIcon, 
  MapPin, 
  Play, 
  ArrowLeft, 
  Save, 
  Trash2, 
  Edit2, 
  Share2,
  Copy,
  Check,
  Upload
} from 'lucide-react';
import { AppMode, Tour, Scene, Hotspot } from './types';
import { 
  getTour, 
  addSceneToTour, 
  addDemoScene, 
  updateTour, 
  saveTourToStorage, 
  getAllTours, 
  deleteTourFromStorage,
  createNewTour
} from './services/tourService';
import { Button, Input, Logo, Modal } from './components/UIComponents';
import VirtualWorld from './components/VirtualWorld';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [tour, setTour] = useState<Tour>(getTour());
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  
  // Dashboard State
  const [savedTours, setSavedTours] = useState<Tour[]>([]);
  
  // Publish Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishUrl, setPublishUrl] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  // Derived state
  const currentScene = tour.scenes.find(s => s.id === currentSceneId) || tour.scenes[0];

  // Load saved tours on mount
  useEffect(() => {
    if (mode === AppMode.HOME) {
      setSavedTours(getAllTours());
    }
  }, [mode]);

  // -- Handlers --

  const handleCreateNewTour = () => {
    const newTour = createNewTour();
    updateTour(newTour);
    setTour(newTour);
    setCurrentSceneId(null);
    setMode(AppMode.BUILDER);
  };

  const handleStartWithUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newTour = createNewTour();
      const updatedTour = await addSceneToTour(e.target.files[0], newTour);
      updateTour(updatedTour);
      setTour(updatedTour);
      setCurrentSceneId(updatedTour.scenes[0].id);
      setMode(AppMode.BUILDER);
    }
  };

  const handleLoadTour = (loadedTour: Tour) => {
    updateTour(loadedTour);
    setTour(loadedTour);
    if (loadedTour.scenes.length > 0) {
      setCurrentSceneId(loadedTour.startSceneId || loadedTour.scenes[0].id);
    } else {
      setCurrentSceneId(null);
    }
    setMode(AppMode.BUILDER);
  };

  const handleDeleteTour = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this tour? This cannot be undone.')) {
      deleteTourFromStorage(id);
      setSavedTours(getAllTours());
    }
  };

  const handleSaveTour = () => {
    const success = saveTourToStorage(tour);
    if (success) {
      alert('Tour saved successfully!');
    } else {
      alert('Failed to save tour. The images might be too large for browser storage.');
    }
  };

  const handlePublish = () => {
    const uniqueId = uuidv4().slice(0, 8);
    setPublishUrl(`https://virtushot.app/t/${uniqueId}`);
    setIsPublishModalOpen(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publishUrl);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newTour = await addSceneToTour(e.target.files[0], tour);
      setTour(newTour);
      if (!currentSceneId) setCurrentSceneId(newTour.scenes[newTour.scenes.length - 1].id);
    }
  };

  const handleAddDemoScene = () => {
    const names = ["Living Room", "Kitchen", "Bedroom", "Balcony"];
    const nextName = names[tour.scenes.length % names.length];
    const newTour = addDemoScene(tour, nextName);
    setTour(newTour);
    if (!currentSceneId) setCurrentSceneId(newTour.scenes[0].id);
  };

  const handleAddHotspot = (position: [number, number, number]) => {
    if (!currentScene) return;
    
    const newHotspot: Hotspot = {
      id: uuidv4(),
      position,
      targetSceneId: '',
    };

    const updatedScene = {
      ...currentScene,
      hotspots: [...currentScene.hotspots, newHotspot]
    };
    updateScene(updatedScene);
    setSelectedHotspotId(newHotspot.id);
  };

  const updateScene = (updatedScene: Scene) => {
    const updatedTour = {
      ...tour,
      scenes: tour.scenes.map(s => s.id === updatedScene.id ? updatedScene : s)
    };
    setTour(updatedTour);
    updateTour(updatedTour);
  };

  const handleDeleteHotspot = (id: string) => {
    if (!currentScene) return;
    const updatedScene = {
      ...currentScene,
      hotspots: currentScene.hotspots.filter(h => h.id !== id)
    };
    updateScene(updatedScene);
    if (selectedHotspotId === id) setSelectedHotspotId(null);
  };

  const handleHotspotUpdate = (id: string, updates: Partial<Hotspot>) => {
    if (!currentScene) return;
    const updatedScene = {
      ...currentScene,
      hotspots: currentScene.hotspots.map(h => h.id === id ? { ...h, ...updates } : h)
    };
    updateScene(updatedScene);
  };

  const handleHotspotClick = (hotspot: Hotspot) => {
    if (mode === AppMode.VIEWER) {
      if (hotspot.targetSceneId) {
        setCurrentSceneId(hotspot.targetSceneId);
      }
    } else {
      setSelectedHotspotId(hotspot.id);
    }
  };

  // Sidebar Logic
  const renderSidebar = () => {
    if (mode === AppMode.VIEWER) return null;
    const activeHotspot = currentScene?.hotspots.find(h => h.id === selectedHotspotId);

    return (
      <div className="w-[400px] shrink-0 bg-virtu-900 border-r border-white/5 flex flex-col h-full z-40 relative shadow-2xl">
        <div className="p-6 border-b border-white/5">
          <Logo />
          <p className="text-gray-400 text-xs mt-2">Tour Builder v1.0</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
          <div>
            <div className="flex items-center justify-between mb-3">
               <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold">Scenes</h3>
               <span className="text-xs text-gray-600 bg-white/5 px-2 py-1 rounded">{tour.scenes.length}</span>
            </div>
            <div className="space-y-2">
              {tour.scenes.map(scene => (
                <div 
                  key={scene.id}
                  onClick={() => { setCurrentSceneId(scene.id); setSelectedHotspotId(null); }}
                  className={`p-3 rounded-lg cursor-pointer transition-all border flex items-center gap-3 ${
                    currentSceneId === scene.id 
                      ? 'bg-virtu-500/10 border-virtu-500/50 ring-1 ring-virtu-500/20' 
                      : 'bg-virtu-800/30 border-transparent hover:bg-virtu-800'
                  }`}
                >
                  <div className="w-12 h-12 rounded bg-slate-700 overflow-hidden shrink-0 border border-white/10">
                     <img src={scene.imageUrl} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium truncate block ${currentSceneId === scene.id ? 'text-white' : 'text-gray-400'}`}>
                      {scene.name}
                    </span>
                    <span className="text-xs text-gray-500 block">{scene.hotspots.length} hotspots</span>
                  </div>
                  {currentSceneId === scene.id && <div className="w-2 h-2 rounded-full bg-virtu-accent animate-pulse shrink-0"></div>}
                </div>
              ))}
              {tour.scenes.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-lg"><p className="text-gray-500 text-sm">No scenes yet</p></div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
             <label className="flex flex-col items-center justify-center px-2 py-4 bg-virtu-800 hover:bg-virtu-700 border border-white/10 rounded-lg cursor-pointer transition-colors group">
               <ImageIcon className="w-5 h-5 mb-2 text-gray-400 group-hover:text-white" />
               <span className="text-xs text-gray-400 group-hover:text-white">Upload 360</span>
               <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
             </label>
             <button onClick={handleAddDemoScene} className="flex flex-col items-center justify-center px-2 py-4 bg-virtu-800 hover:bg-virtu-700 border border-white/10 rounded-lg cursor-pointer transition-colors group">
               <Plus className="w-5 h-5 mb-2 text-gray-400 group-hover:text-white" />
               <span className="text-xs text-gray-400 group-hover:text-white">Demo Room</span>
             </button>
          </div>

          {currentScene && (
            <div className="pt-4 border-t border-white/5">
               <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3 flex items-center gap-2"><MapPin className="w-3 h-3" /> Hotspots</h3>
               <div className="space-y-2">
                 {currentScene.hotspots.length === 0 ? (
                   <p className="text-xs text-gray-600 italic px-2">No hotspots added.</p>
                 ) : (
                   currentScene.hotspots.map(h => {
                     const targetName = tour.scenes.find(s => s.id === h.targetSceneId)?.name;
                     const isSelected = selectedHotspotId === h.id;
                     return (
                        <div 
                          key={h.id}
                          onClick={() => setSelectedHotspotId(h.id)}
                          className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-all ${
                            isSelected ? 'bg-virtu-accent/10 border-virtu-accent/50' : 'bg-virtu-800/30 border-transparent hover:bg-virtu-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-virtu-accent' : 'bg-gray-600 group-hover:bg-gray-500'}`}></div>
                            <div>
                              <div className={`text-sm font-medium ${isSelected ? 'text-virtu-accent' : 'text-gray-300'}`}>{h.label || "Untitled Hotspot"}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <span>To:</span>
                                {targetName ? <span className="text-gray-400">{targetName}</span> : <span className="text-red-400/70 italic">No target</span>}
                              </div>
                            </div>
                          </div>
                          <Edit2 className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100" />
                        </div>
                     );
                   })
                 )}
               </div>
            </div>
          )}
        </div>

        {activeHotspot && (
          <div className="p-4 bg-virtu-800/90 border-t border-virtu-500/30 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Edit2 className="w-4 h-4 text-virtu-accent" /> Edit Selection</h3>
              <button onClick={() => handleDeleteHotspot(activeHotspot.id)} className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Label Text</label>
                <Input value={activeHotspot.label || ''} onChange={(e) => handleHotspotUpdate(activeHotspot.id, { label: e.target.value })} className="w-full text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Destination Scene</label>
                <select 
                  value={activeHotspot.targetSceneId}
                  onChange={(e) => handleHotspotUpdate(activeHotspot.id, { targetSceneId: e.target.value })}
                  className="w-full bg-virtu-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-virtu-500 outline-none"
                >
                  <option value="">Select a destination...</option>
                  {tour.scenes.filter(s => s.id !== currentScene?.id).map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (mode === AppMode.HOME) {
    return (
      <div className="min-h-screen bg-virtu-900 flex flex-col p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
           <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-virtu-500/10 rounded-full blur-[100px]" />
           <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-virtu-accent/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 flex justify-between items-center mb-12">
          <Logo />
          <div className="flex items-center gap-4">
             <div className="text-sm text-gray-400">Logged in as Creator</div>
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-virtu-500 to-purple-500"></div>
          </div>
        </div>
        <div className="relative z-10 max-w-6xl mx-auto w-full">
          <div className="flex justify-between items-end mb-8">
            <div><h1 className="text-3xl font-bold text-white mb-2">Your Tours</h1><p className="text-gray-400">Manage and edit your virtual experiences</p></div>
            <Button onClick={handleCreateNewTour} className="py-2.5 px-6"><Plus className="w-5 h-5" /> Create New Tour</Button>
          </div>
          {savedTours.length === 0 ? (
            <div className="bg-virtu-800/30 border-2 border-dashed border-white/10 rounded-2xl p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
               <label className="group cursor-pointer flex flex-col items-center">
                 <div className="w-24 h-24 rounded-2xl border-2 border-white/20 group-hover:border-white group-hover:bg-white/5 flex items-center justify-center transition-all duration-300 mb-6">
                    <ImageIcon className="w-10 h-10 text-gray-400 group-hover:text-white transition-colors" />
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2 group-hover:text-virtu-accent transition-colors">Upload or Drag & Drop 360 Images</h3>
                 <p className="text-gray-400 mb-8 max-w-md mx-auto">Start your tour by uploading equirectangular panorama images (JPG/PNG).</p>
                 <div className="px-8 py-3 border border-white/30 rounded-lg text-white font-medium group-hover:bg-white group-hover:text-black transition-all flex items-center gap-2">
                   <Upload size={18} /><span>Select Images</span>
                 </div>
                 <input type="file" accept="image/*" className="hidden" onChange={handleStartWithUpload} />
               </label>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedTours.map(savedTour => (
                <div key={savedTour.id} onClick={() => handleLoadTour(savedTour)} className="bg-virtu-800/50 border border-white/5 rounded-xl overflow-hidden hover:border-virtu-500/50 transition-all cursor-pointer group hover:shadow-2xl hover:shadow-virtu-500/10">
                  <div className="h-48 bg-virtu-900 relative">
                    {savedTour.scenes.length > 0 ? <img src={savedTour.scenes[0].imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-12 h-12 text-gray-600" /></div>}
                    <div className="absolute bottom-3 left-3 right-3"><span className="text-xs font-bold bg-black/50 backdrop-blur px-2 py-1 rounded text-white">{savedTour.scenes.length} Scenes</span></div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white mb-1 truncate">{savedTour.name}</h3>
                    <div className="flex justify-between items-center pt-3 border-t border-white/5">
                      <span className="text-xs text-virtu-accent font-medium group-hover:underline">Edit Tour</span>
                      <button onClick={(e) => handleDeleteTour(e, savedTour.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-black text-white overflow-hidden">
      {renderSidebar()}
      <div className="flex-1 relative h-full">
        {/* Header Controls - Explicitly placed and styled to ensure visibility */}
        <div className="absolute top-0 left-0 w-full p-4 z-50 flex justify-between items-start pointer-events-none">
          <div className="pointer-events-auto flex items-start gap-4">
             {mode === AppMode.VIEWER && (
               <Button variant="secondary" onClick={() => setMode(AppMode.BUILDER)} className="bg-black/50 backdrop-blur-md border border-white/10">
                 <Edit2 className="w-4 h-4" /> Back to Edit
               </Button>
             )}
             {mode === AppMode.BUILDER && (
               <div className="flex gap-3 items-center">
                 <Button variant="secondary" onClick={() => setMode(AppMode.HOME)} className="bg-black/50 backdrop-blur-md border border-white/10"><ArrowLeft className="w-4 h-4" /></Button>
                 <div className="flex flex-col">
                   <input value={tour.name} onChange={(e) => setTour({ ...tour, name: e.target.value })} className="bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 text-white font-bold outline-none focus:border-virtu-500 transition-all min-w-[200px]" />
                 </div>
               </div>
             )}
          </div>
          <div className="pointer-events-auto flex gap-2">
             {mode === AppMode.BUILDER && (
               <>
                 <Button variant="ghost" onClick={handleSaveTour} className="bg-black/40 backdrop-blur-md border border-white/5"><Save className="w-4 h-4" /> Save</Button>
                 <Button variant="primary" onClick={handlePublish} className="shadow-xl"><Share2 className="w-4 h-4" /> Publish</Button>
               </>
             )}
            {mode === AppMode.BUILDER && tour.scenes.length > 0 && (
              <Button onClick={() => setMode(AppMode.VIEWER)} variant="secondary" className="shadow-xl bg-virtu-800/80 backdrop-blur border border-white/10"><Play className="w-4 h-4 fill-current" /> Preview</Button>
            )}
          </div>
        </div>

        <div className="absolute bottom-6 right-6 z-30 pointer-events-none flex flex-col gap-2 items-end opacity-60">
           <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg text-xs text-gray-300 border border-white/5 flex flex-col gap-1">
             <div className="font-bold mb-1 text-virtu-accent">Controls</div>
             <div className="flex justify-between gap-4"><span>Look</span> <span className="font-mono bg-white/10 px-1 rounded">Right Click / WASD</span></div>
             <div className="flex justify-between gap-4"><span>Zoom</span> <span className="font-mono bg-white/10 px-1 rounded">Q E</span></div>
             <div className="flex justify-between gap-4"><span>Interact</span> <span className="font-mono bg-white/10 px-1 rounded">Left Click</span></div>
           </div>
        </div>

        {mode === AppMode.BUILDER && currentScene && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-sm text-gray-300 border border-white/5 shadow-xl">Left click to add hotspot</div>
          </div>
        )}

        {currentScene ? (
          <Canvas camera={{ position: [0, 0, 0.1], fov: 75 }}>
            <VirtualWorld 
              currentScene={currentScene}
              scenes={tour.scenes}
              isEditor={mode === AppMode.BUILDER}
              onHotspotClick={handleHotspotClick}
              onAddHotspot={handleAddHotspot}
              onDeleteHotspot={handleDeleteHotspot}
            />
          </Canvas>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-virtu-900 text-gray-500">
            <div className="bg-virtu-800 p-8 rounded-2xl border border-white/5 text-center max-w-md">
               <ImageIcon className="w-12 h-12 mx-auto mb-4 text-virtu-500 opacity-50" />
               <h3 className="text-xl font-bold text-white mb-2">No Scenes Added</h3>
               <p className="mb-6">Upload a 360° panorama image to start building your tour.</p>
               <label className="inline-flex items-center px-6 py-3 bg-virtu-500 hover:bg-virtu-400 text-white rounded-lg cursor-pointer transition-colors font-medium">
                 Upload Image
                 <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
               </label>
            </div>
          </div>
        )}

        <Modal isOpen={isPublishModalOpen} onClose={() => setIsPublishModalOpen(false)} title="Share your Tour">
          <div className="flex flex-col gap-4">
            <p className="text-gray-300 text-sm">Your tour has been published successfully! Share this link with anyone to view your virtual tour.</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-gray-300 text-sm truncate font-mono">{publishUrl}</div>
              <Button onClick={handleCopyLink} variant={hasCopied ? "primary" : "secondary"}>{hasCopied ? <Check size={16} /> : <Copy size={16} />}</Button>
            </div>
            <div className="flex justify-end mt-2"><Button onClick={() => setIsPublishModalOpen(false)} variant="secondary">Done</Button></div>
          </div>
        </Modal>
      </div>
    </div>
  );
}