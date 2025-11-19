import { Vector3 } from 'three';

export interface Hotspot {
  id: string;
  position: [number, number, number]; // x, y, z
  targetSceneId: string;
  label?: string;
  color?: string;
}

export interface Scene {
  id: string;
  name: string;
  imageUrl: string; // Blob URL or Remote URL
  thumbnailUrl?: string;
  hotspots: Hotspot[];
  initialRotation?: number; // Y-axis rotation in radians
}

export interface Tour {
  id: string;
  name: string;
  scenes: Scene[];
  created: number;
  startSceneId?: string;
}

export enum AppMode {
  HOME = 'HOME',
  BUILDER = 'BUILDER',
  VIEWER = 'VIEWER'
}

export interface TransitionState {
  active: boolean;
  fromSceneId: string | null;
  toSceneId: string | null;
  progress: number;
}