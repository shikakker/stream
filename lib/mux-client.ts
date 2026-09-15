import Mux from '@mux/mux-node';

export const isMuxConfigured = (): boolean => Boolean(
  process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET
);

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export default mux;
