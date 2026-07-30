import axios from "axios";

async function fetchMatchLeaderboard({ apiUrl, matchId }) {
    const response = await axios.get(
        `${apiUrl}/matches/${matchId}/leaderboard`,
        { withCredentials: true }
    );

    if (!response.data?.success) {
        throw new Error(response.data?.error?.message || "Leaderboard alınamadı.");
    }

    return response.data.data;
}

export {
    fetchMatchLeaderboard
};
