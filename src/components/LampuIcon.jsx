import React from 'react';

const LampuIcon = ({ type = 'mati', size = 20 }) => {
  // type: 'mati' (off) or 'nyala' (on)
  const src = type === 'nyala' ? '/assets/L2.png' : '/assets/L1.png';
  return (
    <img
      src={src}
      alt={type === 'nyala' ? 'Lampu Nyala' : 'Lampu Mati'}
      width={size}
      height={size}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    />
  );
};

export default LampuIcon;
