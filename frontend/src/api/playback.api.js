import axios from "axios";

async function fetchMatchPlayback({ apiUrl, matchId }) {
    const response = await axios.get(
        `${apiUrl}/matches/${matchId}/playback`,
        {
            withCredentials: true
        }
    );

    if (!response.data?.success) {
        throw new Error(
            response.data?.error?.message || "Playback verisi alınamadı."
        );
    }

    return response.data.data;
}

export {
    fetchMatchPlayback
};
