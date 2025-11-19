import { Tour, Scene } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'virtushot_tours';

// Helper to create a placeholder grid texture if no image is provided
export const createPlaceholderPanorama = (text: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  const gridSize = 100;
  
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Text
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 80px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  
  return canvas.toDataURL('image/jpeg', 0.8);
};

export const createNewTour = (): Tour => {
  return {
    id: uuidv4(),
    name: 'My New Tour',
    scenes: [],
    created: Date.now(),
  };
};

// -- Storage Methods --

export const getAllTours = (): Tour[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load tours", e);
  }
  return [];
};

export const saveTourToStorage = (tour: Tour) => {
  try {
    const tours = getAllTours();
    const index = tours.findIndex(t => t.id === tour.id);
    
    if (index >= 0) {
      tours[index] = tour;
    } else {
      tours.push(tour);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tours));
    return true;
  } catch (e) {
    console.error("Failed to save tour (likely quota exceeded due to images)", e);
    return false;
  }
};

export const deleteTourFromStorage = (id: string) => {
  const tours = getAllTours();
  const filtered = tours.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// In-memory storage for session
let currentSessionTour: Tour | null = null;

export const getTour = (): Tour => {
  if (!currentSessionTour) {
    currentSessionTour = createNewTour();
  }
  return currentSessionTour;
};

export const updateTour = (tour: Tour) => {
  currentSessionTour = tour;
};

export const addSceneToTour = (file: File, tour: Tour): Promise<Tour> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const id = uuidv4();
      const url = e.target?.result as string; 
      
      const newScene: Scene = {
        id,
        name: file.name.replace(/\.[^/.]+$/, ""),
        imageUrl: url,
        hotspots: []
      };

      const updatedTour = {
        ...tour,
        scenes: [...tour.scenes, newScene],
        startSceneId: tour.scenes.length === 0 ? id : tour.startSceneId
      };
      
      updateTour(updatedTour);
      resolve(updatedTour);
    };
    reader.readAsDataURL(file);
  });
};

export const addDemoScene = (tour: Tour, name: string): Tour => {
  const id = uuidv4();
  const url = createPlaceholderPanorama(name);
  const newScene: Scene = {
    id,
    name,
    imageUrl: url,
    hotspots: []
  };
  const updatedTour = {
    ...tour,
    scenes: [...tour.scenes, newScene],
    startSceneId: tour.scenes.length === 0 ? id : tour.startSceneId
  };
  updateTour(updatedTour);
  return updatedTour;
};