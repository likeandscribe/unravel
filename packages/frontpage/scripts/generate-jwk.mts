import { generateKeyPair, exportJWK } from "jose";

const keyPair = await generateKeyPair("ES256", {
  crv: "P-256",
});

const [privateJwk, publicJwk] = await Promise.all([
  exportJWK(keyPair.privateKey),
  exportJWK(keyPair.publicKey),
]);

const kid = `frontpage-${new Date().toISOString()}`;

privateJwk.kid = kid;
publicJwk.kid = kid;

console.log(
  `PRIVATE_JWK='${JSON.stringify(privateJwk)}'\nPUBLIC_JWK='${JSON.stringify(publicJwk)}'`,
);
