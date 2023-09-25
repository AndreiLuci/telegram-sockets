import axios from "axios";

export async function authenticate(
  jwt: string,
  hwid: string
): Promise<boolean> {
  const response = await axios.post(
    "https://vulcan-auth.onrender.com/validate",
    {
      jwt,
      hwid,
    },
    {
      headers: {
        "user-agent": "freebies-monitor",
      },
      validateStatus: null,
    }
  );
  return response.status === 200;
}
