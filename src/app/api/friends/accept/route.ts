export async function POST() {
  return new Response(
    JSON.stringify({ error: 'Not implemented. Use /api/friends/invite.' }),
    { status: 501, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function GET() {
  return new Response(
    JSON.stringify({ error: 'Not implemented. Use /api/friends/invite.' }),
    { status: 501, headers: { 'Content-Type': 'application/json' } }
  );
}
