const keyPair = await crypto.subtle.generateKey(
  {
    name: "ECDSA",
    namedCurve: "P-256",
  },
  true,
  ["sign", "verify"],
);

const [privateKey, publicKey] = await Promise.all(
  [keyPair.privateKey, keyPair.publicKey].map((key) =>
    crypto.subtle.exportKey("jwk", key),
  ),
);

console.log(
  `PRIVATE_JWK='${JSON.stringify(privateKey)}'\nPUBLIC_JWK='${JSON.stringify(publicKey)}'`,
);
