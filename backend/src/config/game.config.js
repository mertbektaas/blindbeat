const gameConfig = Object.freeze({
  defaultBpm: 120,
  defaultStepCount: 8,
  instrumentRoundSeconds: 5,
  playbackLoops: 5,
  playbackStartDelayMs: 2000,
  unanimousVoteMultiplier: 2,
  songVariantCount: 3,
  minPlayers: 4,
  maxPlayers: 10,
  maxMatchCount: 5,
  maxActivePatternCount: 50,
  websocketMaxPayloadBytes: 100 * 1024,
  requestIdHistoryPerPlayer: 100
});

module.exports = gameConfig;
