export async function POST(request: Request) {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.DRAINPIPE_CONSUMER_SECRET}`) {
    console.log("Unauthorized request");
    return new Response("Unauthorized", { status: 401 });
  }
  console.log("POST request received");
  console.log(await request.json());
  return new Response("OK");
}
