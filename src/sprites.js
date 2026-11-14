// Pixel "versi diri" sprites, transcribed from the Wonder V6 artboard (16x20 grid).
// r = rect [x,y,w,h,color], o = outline rect (glasses), c = circle [cx,cy,r,color]
export const ADS = [
  ['r',4,1,8,3,'#1A1916'],['r',3,2,2,2,'#1A1916'],['r',4,4,8,5,'#F0EBE3'],['r',6,5,2,2,'#1A1916'],['r',10,5,2,2,'#1A1916'],
  ['r',7,8,4,1,'#5F5A54'],['r',0,11,1,3,'#F0D36A'],['r',1,10,1,4,'#0F6E6A'],['r',2,12,1,2,'#E87862'],['r',3,11,2,3,'#0F6E6A'],
  ['r',4,10,8,5,'#0F6E6A'],['r',12,11,2,3,'#0F6E6A'],['r',5,15,3,3,'#1A1916'],['r',8,15,3,3,'#1A1916'],['r',4,18,4,2,'#1A1916'],['r',9,18,4,2,'#1A1916'],
];
export const AGENT = [
  ['r',4,1,8,3,'#1A1916'],['r',11,2,2,2,'#1A1916'],['r',4,4,8,5,'#F0EBE3'],['o',5,5,3,2,'#1A1916'],['o',9,5,3,2,'#1A1916'],
  ['r',8,6,1,1,'#1A1916'],['r',6,6,1,1,'#1A1916'],['r',10,6,1,1,'#1A1916'],['r',7,8,4,1,'#5F5A54'],
  ['r',4,10,8,5,'#1A1916'],['r',6,10,4,1,'#A888D4'],['r',3,11,2,3,'#1A1916'],['r',12,11,2,3,'#1A1916'],
  ['c',14.5,9.5,1.2,'#5AA3C8'],['c',15.2,13,1,'#A888D4'],['c',13.2,15.2,0.9,'#5EC4A8'],
  ['r',5,15,3,3,'#5F5A54'],['r',8,15,3,3,'#5F5A54'],['r',4,18,4,2,'#1E3A38'],['r',9,18,4,2,'#1E3A38'],
];
export function spriteSVG(list, label) {
  const parts = list.map((p) => {
    if (p[0] === 'r') return `<rect x="${p[1]}" y="${p[2]}" width="${p[3]}" height="${p[4]}" fill="${p[5]}"/>`;
    if (p[0] === 'o') return `<rect x="${p[1]}" y="${p[2]}" width="${p[3]}" height="${p[4]}" fill="none" stroke="${p[5]}" stroke-width="0.7"/>`;
    return `<circle cx="${p[1]}" cy="${p[2]}" r="${p[3]}" fill="${p[4]}"/>`;
  }).join('');
  return `<svg viewBox="0 0 16 20" role="img" aria-label="${label}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${parts}</svg>`;
}
export const LAMP_SVG = `<svg viewBox="0 0 72 140" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M18 6 L48 6 L58 38 L8 38 Z" fill="#E87862"/><ellipse cx="33" cy="38" rx="22" ry="5" fill="#FBF3D4"/><rect x="27" y="38" width="12" height="5" rx="1" fill="#1A1916"/><path d="M33 43 L33 108" stroke="#5F5A54" stroke-width="5" stroke-linecap="round" fill="none"/><rect x="25" y="104" width="16" height="8" rx="2" fill="#1A1916"/><ellipse cx="33" cy="120" rx="20" ry="7" fill="#5F5A54"/><ellipse cx="33" cy="117" rx="15" ry="4" fill="#1A1916"/></svg>`;
