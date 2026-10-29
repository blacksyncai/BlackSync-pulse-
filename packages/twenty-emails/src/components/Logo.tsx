import { Img } from 'react-email';

const logoStyle = {
  marginBottom: '40px',
};

export const Logo = () => {
  return (
    <Img
      src="https://blacksync-pulse-production.up.railway.app/images/icons/windows11/Square150x150Logo.scale-100.png"
      alt="BlackSync Cloud logo"
      width="40"
      height="40"
      style={logoStyle}
    />
  );
};
