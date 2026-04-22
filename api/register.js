import { generateRegistrationOptions } from "@simplewebauthn/server";

export default async function handler(req, res) {
  const options = await generateRegistrationOptions({
    rpName: "AmbuFlow",
    rpID: "ambuflow-delta.vercel.app",
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