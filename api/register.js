import { generateRegistrationOptions } from "@simplewebauthn/server";

export default async function handler(req, res) {
  // Déterminer dynamiquement le rpID pour que ça marche en local et en ligne
  const host = req.headers.host?.split(':')[0];
  const rpID = host || "localhost";

  const options = await generateRegistrationOptions({
    rpName: "AmbuFlow",
    rpID: rpID,
    userID: "1234",
    userName: "test@ambuflow.com",
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "preferred",
    },
  });

  res.status(200).json(options);
}