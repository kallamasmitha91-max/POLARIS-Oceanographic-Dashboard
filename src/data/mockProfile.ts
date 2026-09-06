import { DepthProfilePoint } from '../types';

export function generateDepthProfile(currentTemp: number, currentSalinity: number): DepthProfilePoint[] {
  // Realistic oceanic depth profile down to 150m (buoy tether limit)
  const depths = [0, 2, 5, 10, 15, 20, 25, 30, 40, 50, 65, 80, 100, 120, 150];
  
  return depths.map(d => {
    let t = currentTemp;
    let s = currentSalinity;

    if (d <= 20) {
      // Epipelagic mixed layer
      t = currentTemp - (d / 20) * 0.4;
      s = currentSalinity + (d / 20) * 0.1;
    } else if (d <= 80) {
      // Permanent thermocline & halocline
      const factor = (d - 20) / 60;
      t = (currentTemp - 0.4) - factor * 13.5; // drops dramatically to ~14.5°C
      s = (currentSalinity + 0.1) + factor * 0.9;
    } else {
      // Sub-thermocline cold bathyal gradient
      const factor = (d - 80) / 70;
      t = 14.5 - factor * 5.2; // down to ~9.3°C at 150m
      s = 35.2 + factor * 0.3;
    }

    // Add tiny physics wave perturbations
    t = Number((t + Math.sin(d * 0.2) * 0.05).toFixed(2));
    s = Number((s + Math.cos(d * 0.15) * 0.03).toFixed(2));
    
    // Seawater equation approximation
    const density = Number((1025 - (t - 20) * 0.28 + (s - 35) * 0.78 + d * 0.0045).toFixed(2));
    const soundSpeed = Number((1449.2 + 4.6 * t - 0.055 * Math.pow(t, 2) + 1.34 * (s - 35) + 0.016 * d).toFixed(1));

    return {
      depth: d,
      temperature: t,
      salinity: s,
      density,
      soundSpeed,
    };
  });
}
