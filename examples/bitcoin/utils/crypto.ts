import createHash from 'create-hash';

export function ripemd160(buffer: Buffer) {
  try {
    return createHash('ripemd160').update(buffer).digest();
  } catch (err) {
    return createHash('rmd160').update(buffer).digest();
  }
};

export function sha256(buffer: Buffer) {
  return createHash('sha256').update(buffer).digest();
}


export function sha256x2(buffer: Buffer) {
  return sha256(sha256(buffer));
};
