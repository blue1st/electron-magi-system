import { DeliberationStep } from '../types';

/**
 * Generate a pure textless 3-node Triad MAGI dynamic icon DataURL
 */
export function generateDynamicIconDataUrl(step: DeliberationStep): string {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const cx = 256;
  const cy = 256;

  // Single phase-controlled monochrome neon color tone (Restricted color palette)
  let themeColor = '#ff6b00'; // Default Neon Orange

  switch (step) {
    case 'PHASE_1_INITIAL':
      themeColor = '#ff6b00'; // Orange
      break;
    case 'PHASE_2_DEBATE':
      themeColor = '#00e5ff'; // Cyan
      break;
    case 'PHASE_3_CONSENSUS':
      themeColor = '#ffcc00'; // Yellow
      break;
    case 'COMPLETED':
      themeColor = '#00ff66'; // Green
      break;
    case 'ERROR':
      themeColor = '#ff2a2a'; // Red
      break;
    case 'IDLE':
    default:
      themeColor = '#ff6b00';
      break;
  }

  // 1. Clear Canvas for 100% Transparent Background
  ctx.clearRect(0, 0, 512, 512);

  // 2. Pure 3-Node Triad Symbol (Textless)
  const nodes = [
    { x: cx, y: cy - 110 },       // Top
    { x: cx - 115, y: cy + 90 },  // Bottom Left
    { x: cx + 115, y: cy + 90 },  // Bottom Right
  ];

  // Draw Triangle Glow Lines
  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 18;
  ctx.shadowColor = themeColor;
  ctx.shadowBlur = 35;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(nodes[0].x, nodes[0].y);
  ctx.lineTo(nodes[1].x, nodes[1].y);
  ctx.lineTo(nodes[2].x, nodes[2].y);
  ctx.closePath();
  ctx.stroke();

  // Inner Core Highlight Lines
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.moveTo(nodes[0].x, nodes[0].y);
  ctx.lineTo(nodes[1].x, nodes[1].y);
  ctx.lineTo(nodes[2].x, nodes[2].y);
  ctx.closePath();
  ctx.stroke();

  // Draw 3 Core Node Circles
  const nodeRadius = 38;
  nodes.forEach((n) => {
    // Outer Node Ring
    ctx.fillStyle = '#0f1115';
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 14;
    ctx.shadowColor = themeColor;
    ctx.shadowBlur = 35;

    ctx.beginPath();
    ctx.arc(n.x, n.y, nodeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Core Solid Node Center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(n.x, n.y, 16, 0, Math.PI * 2);
    ctx.fill();
  });

  return canvas.toDataURL('image/png');
}

/**
 * Update Dynamic Icon for both Electron Dock and Web Favicon
 */
export function updateAppDynamicIcon(step: DeliberationStep) {
  try {
    const dataUrl = generateDynamicIconDataUrl(step);

    // 1. Update Web Favicon
    let faviconLink = document.getElementById('dynamic-favicon') as HTMLLinkElement;
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.id = 'dynamic-favicon';
      faviconLink.rel = 'icon';
      faviconLink.type = 'image/png';
      document.head.appendChild(faviconLink);
    }
    faviconLink.href = dataUrl;

    // 2. Update Electron Dock / Window Icon if in Electron environment
    if (window.electronAPI && typeof window.electronAPI.updateDockIcon === 'function') {
      window.electronAPI.updateDockIcon(dataUrl, step);
    }
  } catch (err) {
    console.error('Error updating dynamic app icon:', err);
  }
}
