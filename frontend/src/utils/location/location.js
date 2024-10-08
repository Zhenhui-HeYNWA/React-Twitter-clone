export const fetchLocation = async (lat, lon) => {
  try {
    const apiKey = import.meta.env.VITE_LOCATIONIQ_API_KEY;

    const options = { method: 'GET', headers: { accept: 'application/json' } };
    const response = await fetch(
      `https://us1.locationiq.com/v1/reverse?key=${apiKey}&lat=${lat}&lon=${lon}&format=json&accept-language=en`,
      options
    );
    if (!response.ok) {
      throw new Error('Failed to fetch location');
    }
    const data = await response.json();

    return data;
  } catch (err) {
    console.error('Error fetching location:', err);
    throw err;
  }
};
