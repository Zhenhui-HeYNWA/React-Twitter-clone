export const fetchLocation = async (lat, lon) => {
  try {
    const apiKey = import.meta.env.VITE_LOCATIONIQ_API_KEY;

    const options = { method: 'GET', headers: { accept: 'application/json' } };
    const response = await fetch(
      `https://us1.locationiq.com/v1/reverse?key=${apiKey}&lat=${lat}&lon=${lon}&format=json`,
      options
    );
    if (!response.ok) {
      throw new Error('Failed to fetch location');
    }
    const data = await response.json();
    console.log(data);
    return data;
  } catch (err) {
    console.error('Error fetching location:', err);
    throw err;
  }
};
