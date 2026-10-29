'use strict';

const consentStyles: string = `
:root{color-scheme:light dark}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;background:Canvas;color:CanvasText;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.5}
header{width:100%;padding:1rem 1.5rem;border-bottom:1px solid GrayText;font-weight:700;display:flex;gap:.75rem}
.env{margin-left:auto;padding:.1rem .6rem;border:1px solid currentColor;font-size:.8rem;text-transform:uppercase}
main{width:100%;max-width:34rem;margin:3rem 1rem;padding:2rem;border:1px solid GrayText;border-radius:6px}
h1{margin:0 0 1rem;font-size:1.5rem;line-height:1.25}
.host{font-weight:400;font-size:.95rem;color:GrayText}
.user,.warn{margin:0 0 1rem;padding:.6rem .9rem;border-left:3px solid currentColor}
.muted{color:GrayText;font-size:.9rem}
.actions{display:flex;gap:.75rem;flex-wrap:wrap;margin-top:1.5rem}
button{font:inherit;font-weight:700;padding:.7rem 1.6rem;border-radius:4px;cursor:pointer;border:2px solid currentColor;background:transparent;color:inherit}
button.approve{background:CanvasText;color:Canvas}
button:focus-visible{outline:3px solid Highlight;outline-offset:2px}
`;
export default consentStyles;
