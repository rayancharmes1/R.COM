import React from 'react';
export default function RcomLogo({ size = 60, showText = true, textSize = 28 }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: showText ? 2 : 0 }}>
      <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,5 78,33 50,33" fill="#e67e22"/>
        <polygon points="50,5 22,33 50,33" fill="#c0392b"/>
        <polygon points="22,33 50,33 36,50" fill="#d4870d"/>
        <polygon points="78,33 64,50 50,33" fill="#2980b9"/>
        <polygon points="22,33 36,50 22,55" fill="#922b21"/>
        <polygon points="78,33 78,55 64,50" fill="#1a5276"/>
        <polygon points="36,50 50,33 64,50 50,67" fill="white"/>
        <polygon points="22,55 36,50 50,67 22,67" fill="#922b21"/>
        <polygon points="78,55 64,50 50,67 78,67" fill="#1a5276"/>
        <polygon points="22,67 50,67 50,95 22,67" fill="#c0392b"/>
        <polygon points="78,67 50,95 50,67" fill="#2471a3"/>
      </svg>
      {showText && (
        <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:textSize, letterSpacing:'2px', color:'#111', lineHeight:1 }}>
          R.COM
        </span>
      )}
    </div>
  );
}
