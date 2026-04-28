const DAILY_API_KEY = 'ec8a407158e532ad1ffd7ad494888ae2781dd4def6917d8e3104eeb6127a8d78';
const DAILY_API_URL = 'https://api.daily.co/v1/rooms';

export async function createOrGetRoom(roomName: string): Promise<string> {
  try {
    // 1. Try to fetch the existing room
    const getRes = await fetch(`${DAILY_API_URL}/${roomName}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (getRes.ok) {
      const data = await getRes.json();
      return data.url;
    }

    if (getRes.status !== 404) {
      const errData = await getRes.json();
      throw new Error(`Failed to fetch room: ${errData.info || getRes.statusText}`);
    }

    // 2. If it doesn't exist (404), create it
    const createRes = await fetch(DAILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          exp: Math.floor(Date.now() / 1000) + 86400, // Expires in 24 hours
        },
      }),
    });

    if (!createRes.ok) {
      const errData = await createRes.json();
      throw new Error(`Failed to create room: ${errData.info || createRes.statusText}`);
    }

    const data = await createRes.json();
    return data.url;
  } catch (error) {
    console.error('Error creating/fetching Daily room:', error);
    throw error;
  }
}
