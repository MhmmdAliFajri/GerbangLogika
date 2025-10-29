import React from 'react';

const AppLogo = ({ className = '', size = 32 }) => (
  <img
    src="/favicon.ico"
    alt="App Logo"
    width={size}
    height={size}
    className={className}
    style={{ display: 'block' }}
  />
);

export default AppLogo;
