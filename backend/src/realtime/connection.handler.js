function createConnectionHandler({
    readPlayerSessionToken,
    identityRegistry,
    prisma,
    connectionRegistry,
    roomRegistry,
    lobbyBroadcaster,
    gameStateBroadcaster,
    runtimeRegistry,
    reconnectManager,
    requestIdRegistry,
    sessionGameFlow,
    gameConfig,
    draftPatternManager,
    patternLockManager,
    roundFinalizer,
    instrumentRoundManager,
    songAssemblyService,
    playbackReadiness,
    playbackStartCoordinator,
    playbackPhaseManager,
    playbackCompletion,
    matchResultReadiness,
    voteService,
    nextMatchCoordinator,
    ogRoundCoordinator,
    sessionResultService
}) {
    return async function handleConnection(socket, request) {
        const token = readPlayerSessionToken(
            request.headers.cookie
        );

        const identity = identityRegistry.get(token);

        if (!identity) {
            socket.close(1008, "IDENTITY_NOT_FOUND");
            return;
        }

        const lobby = await prisma.lobby.findUnique({
            where: {
                id: identity.lobbyId
            },
            select: {
                code: true,
                status: true,
                players: {
                    select: {
                        id: true,
                        nickname: true
                    }
                }
            }
        });

        if (!lobby) {
            socket.close(1008, "LOBBY_NOT_FOUND");
            return;
        }

        const previousSocket = connectionRegistry.add(
            identity.playerId,
            socket
        );

        if (previousSocket) {
            previousSocket.close();
        }

        const room = roomRegistry.addPlayer(
            identity.lobbyId,
            lobby.code,
            identity.playerId
        );

        const activeRuntime = room.activeSessionId
            ? runtimeRegistry?.getRuntime(room.activeSessionId)
            : null;

        if (activeRuntime && reconnectManager) {
            const reconnectResult = reconnectManager.markReconnected({
                runtime: activeRuntime,
                playerId: identity.playerId
            });

            if (!reconnectResult.reconnected) {
                roomRegistry.removePlayer(
                    identity.lobbyId,
                    identity.playerId
                );
                socket.close(1008, reconnectResult.reason);
                return;
            }
        }

        if (room.activeSessionId && gameStateBroadcaster) {
            await gameStateBroadcaster.sendGameStateSnapshot({
                sessionId: room.activeSessionId,
                playerId: identity.playerId
            });
        }

        socket.send(JSON.stringify({
            type: "connection:ready",
            payload: {
                nickname: identity.nickname
            }
        }));

        if (lobbyBroadcaster) {
            await lobbyBroadcaster.sendLobbySnapshot({
                lobbyId: identity.lobbyId,
                playerId: identity.playerId
            });
        } else {
            socket.send(JSON.stringify({
                type: "lobby:snapshot",
                stateVersion: room.stateVersion,
                payload: {
                    code: lobby.code,
                    status: lobby.status,
                    players: lobby.players.map((player) => ({
                        id: player.id,
                        nickname: player.nickname,
                        online: room.onlinePlayerIds.has(player.id)
                    }))
                }
            }));
        }

        if (lobbyBroadcaster) {
            await lobbyBroadcaster.broadcastLobbyEvent({
                lobbyId: identity.lobbyId,
                type: "lobby:player-connected",
                changedPlayer: {
                    nickname: identity.nickname,
                    action: "connected"
                },
                excludePlayerId: identity.playerId
            });
        }

        socket.on("close", async (code) => {
            const removedPlayerId = connectionRegistry.removeBySocket(socket);

            if (removedPlayerId === undefined) {
                return;
            }

            const room = roomRegistry.removePlayer(
                    identity.lobbyId,
                    removedPlayerId
            );

            const activeRuntime = room?.activeSessionId
                ? runtimeRegistry?.getRuntime(room.activeSessionId)
                : null;

            if (activeRuntime && reconnectManager) {
                reconnectManager.markDisconnected({
                    runtime: activeRuntime,
                    playerId: removedPlayerId
                });
            }

            if (
                code !== 1000 &&
                room &&
                lobbyBroadcaster
            ) {
                await lobbyBroadcaster.broadcastLobbyEvent({
                    lobbyId: identity.lobbyId,
                    type: "lobby:player-disconnected",
                    changedPlayer: {
                        nickname: identity.nickname,
                        action: "disconnected"
                    }
                });
            }
        });

        socket.on("message", async (rawMessage) => {
            let message;

            try {
                message = JSON.parse(rawMessage.toString());
            } catch (error) {
                socket.send(JSON.stringify({
                    type: "error",
                    payload: {
                        code: "INVALID_MESSAGE"
                    }
                }));
                return;
            }

            const requestTrackedTypes = new Set([
                "playback:ready",
                "playback:complete",
                "vote:submit",
                "game:player-ready",
                "pattern:draft-update",
                "pattern:lock",
                "match:continue",
                "lobby:pattern-update",
                "lobby:config-update",
                "lobby:ready-update"
            ]);

            if (
                requestIdRegistry &&
                requestTrackedTypes.has(message.type) &&
                message.requestId
            ) {
                const requestClaim = requestIdRegistry.claim({
                    playerId: identity.playerId,
                    requestId: message.requestId
                });

                if (requestClaim.duplicate) {
                    socket.send(JSON.stringify({
                        type: "error",
                        requestId: message.requestId,
                        payload: {
                            code: "DUPLICATE_REQUEST",
                            message: "Bu istek daha once islendi."
                        }
                    }));
                    return;
                }
            }

            if(message.type === "game:request-state" && room.activeSessionId){
                await gameStateBroadcaster.sendGameStateSnapshot({
                    sessionId: room.activeSessionId,
                    playerId: identity.playerId
                })
                return;
            }

            if (message.type === "lobby:pattern-update") {
                const pattern = message.payload?.pattern;
                const expectedLength = room.lobbyConfig?.stepCount;

                if (
                    !Array.isArray(pattern) ||
                    pattern.length !== expectedLength ||
                    pattern.some((step) => typeof step !== "boolean")
                ) {
                    socket.send(JSON.stringify({
                        type: "error",
                        requestId: message.requestId,
                        payload: {
                            code: "INVALID_LOBBY_PATTERN",
                            message: "Lobi patterni geçersiz."
                        }
                    }));
                    return;
                }

                roomRegistry.updateLobbyPattern({
                    lobbyId: identity.lobbyId,
                    playerId: identity.playerId,
                    pattern
                });

                await lobbyBroadcaster?.broadcastLobbyEvent({
                    lobbyId: identity.lobbyId,
                    type: "lobby:pattern-updated",
                    changedPlayer: {
                        nickname: identity.nickname,
                        action: "pattern-updated"
                    }
                });
                return;
            }

            if (message.type === "lobby:config-update") {
                if (room.hostPlayerId !== identity.playerId) {
                    socket.send(JSON.stringify({
                        type: "error",
                        requestId: message.requestId,
                        payload: {
                            code: "LOBBY_CONFIG_FORBIDDEN",
                            message: "Oyun ayarlarını yalnızca odayı kuran oyuncu değiştirebilir."
                        }
                    }));
                    return;
                }

                const { key, value } = message.payload || {};
                const allowedConfig = {
                    bpm: { min: 60, max: 160, step: 5 },
                    instrumentRoundSeconds: { min: 15, max: 60, step: 5 },
                    stepCount: { min: 8, max: 32, step: 8 },
                    maxMatchCount: { min: 1, max: 5, step: 1 },
                    instrumentCodes: null
                };
                const rule = allowedConfig[key];

                if (!rule && key !== "instrumentCodes") {
                    socket.send(JSON.stringify({
                        type: "error",
                        requestId: message.requestId,
                        payload: {
                            code: "INVALID_LOBBY_CONFIG",
                            message: "Lobi ayarı geçersiz."
                        }
                    }));
                    return;
                }

                if (key === "instrumentCodes") {
                    if (
                        !Array.isArray(value) ||
                        value.length < 1 ||
                        value.length > 6 ||
                        new Set(value).size !== value.length
                    ) {
                        socket.send(JSON.stringify({
                            type: "error",
                            requestId: message.requestId,
                            payload: {
                                code: "INVALID_LOBBY_CONFIG",
                                message: "Enstrüman seçimi geçersiz."
                            }
                        }));
                        return;
                    }

                    roomRegistry.updateLobbyConfig({
                        lobbyId: identity.lobbyId,
                        config: { [key]: value }
                    });

                    await lobbyBroadcaster?.broadcastLobbyEvent({
                        lobbyId: identity.lobbyId,
                        type: "lobby:config-updated",
                        changedPlayer: {
                            nickname: identity.nickname,
                            action: "config-updated"
                        }
                    });
                    return;
                }

                if (
                    !Number.isInteger(value) ||
                    value < rule.min ||
                    value > rule.max ||
                    (value - rule.min) % rule.step !== 0
                ) {
                    socket.send(JSON.stringify({
                        type: "error",
                        requestId: message.requestId,
                        payload: {
                            code: "INVALID_LOBBY_CONFIG",
                            message: "Lobi ayarı geçersiz."
                        }
                    }));
                    return;
                }

                roomRegistry.updateLobbyConfig({
                    lobbyId: identity.lobbyId,
                    config: { [key]: value }
                });

                await lobbyBroadcaster?.broadcastLobbyEvent({
                    lobbyId: identity.lobbyId,
                    type: "lobby:config-updated",
                    changedPlayer: {
                        nickname: identity.nickname,
                        action: "config-updated"
                    }
                });
                return;
            }

            if (message.type === "lobby:ready-update") {
                if (room.activeSessionId) {
                    return;
                }

                roomRegistry.setLobbyPlayerReady({
                    lobbyId: identity.lobbyId,
                    playerId: identity.playerId,
                    ready: message.payload?.ready === true
                });

                await lobbyBroadcaster?.broadcastLobbyEvent({
                    lobbyId: identity.lobbyId,
                    type: "lobby:ready-updated",
                    changedPlayer: {
                        nickname: identity.nickname,
                        action: "ready-updated"
                    }
                });
                return;
            }

            if (message.type === "playback:ready" && room.activeSessionId) {
                const runtime = runtimeRegistry.getRuntime(room.activeSessionId);

                if (!runtime) {
                    socket.send(JSON.stringify({
                        type: "error",
                        requestId: message.requestId,
                        payload: {
                            code: "GAME_RUNTIME_NOT_FOUND",
                            message: "Playback hazirligi icin runtime bulunamadi."
                        }
                    }));
                    return;
                }

                try {
                    const result = playbackReadiness.markClientReady({
                        runtime,
                        playerId: identity.playerId
                    });

                    socket.send(JSON.stringify({
                        type: "playback:ready:ack",
                        requestId: message.requestId,
                        payload: result
                    }));

                    if (result.allReady) {
                        playbackStartCoordinator.startPlayback({
                            runtime,
                            variantOrder: runtime.variantOrder || []
                        });

                        await gameStateBroadcaster.broadcastGameState(
                            room.activeSessionId
                        );
                    }
                } catch (error) {
                    socket.send(JSON.stringify({
                        type: "error",
                        requestId: message.requestId,
                        payload: {
                            code: "PLAYBACK_READY_ERROR",
                            message: error.message
                        }
                    }));
                }

                return;
            }

            if (message.type === "playback:complete" && room.activeSessionId) {
                const runtime = runtimeRegistry.getRuntime(room.activeSessionId);

                if (!runtime) {
                    socket.send(JSON.stringify({
                        type: "error",
                        requestId: message.requestId,
                        payload: {
                            code: "GAME_RUNTIME_NOT_FOUND",
                            message: "Playback tamamlanmasi icin runtime bulunamadi."
                        }
                    }));
                    return;
                }

                try {
                    const result = playbackCompletion.markClientCompleted({
                        runtime,
                        playerId: identity.playerId
                    });

                    socket.send(JSON.stringify({
                        type: "playback:complete:ack",
                        requestId: message.requestId,
                        payload: result
                    }));

                    if (result.allCompleted) {
                        await gameStateBroadcaster.broadcastGameState(
                            room.activeSessionId
                        );
                    }
                } catch (error) {
                    socket.send(JSON.stringify({
                        type: "error",
                        requestId: message.requestId,
                        payload: {
                            code: "PLAYBACK_COMPLETE_ERROR",
                            message: error.message
                        }
                    }));
                }

                return;
            }

            if (message.type === "vote:submit" && room.activeSessionId) {
                const runtime = runtimeRegistry.getRuntime(room.activeSessionId);

                if (!runtime) {
                    socket.send(JSON.stringify({
                        type: "error",
                        requestId: message.requestId,
                        payload: {
                            code: "GAME_RUNTIME_NOT_FOUND",
                            message: "Oy vermek icin runtime bulunamadi."
                        }
                    }));
                    return;
                }

                try {
                    const result = await voteService.submitVote({
                        matchId: runtime.currentMatchId,
                        playerId: identity.playerId,
                        songVariantId: Number(message.payload?.songVariantId)
                    });

                    socket.send(JSON.stringify({
                        type: "vote:ack",
                        requestId: message.requestId,
                        payload: result
                    }));

                    if (result.votingComplete) {
                        await gameStateBroadcaster.broadcastGameState(
                            room.activeSessionId
                        );
                    }
                } catch (error) {
                    socket.send(JSON.stringify({
                        type: "error",
                        requestId: message.requestId,
                        payload: {
                            code: error.code || "VOTE_SUBMIT_ERROR",
                            message: error.message
                        }
                    }));
                }

                return;
            }

            if (message.type === "match:continue" && room.activeSessionId) {
                const runtime = runtimeRegistry.getRuntime(room.activeSessionId);

                if (!runtime || !matchResultReadiness) {
                    socket.send(JSON.stringify({
                        type: "error",
                        requestId: message.requestId,
                        payload: {
                            code: "MATCH_RESULT_NOT_AVAILABLE",
                            message: "Sonuç ekranı şu anda kullanılamıyor."
                        }
                    }));
                    return;
                }

                try {
                    const result = matchResultReadiness.markPlayerReady({
                        runtime,
                        playerId: identity.playerId
                    });

                    if (result.allReady) {
                        // Final match'lerde MATCH_RESULT phase'ine hiç
                        // girilmediği için buraya sadece ara match'ler için
                        // ulaşılır. Direkt sonraki instrument round'a geç.
                        await nextMatchCoordinator.startNextMatch({
                            runtime,
                            maxMatchCount: runtime.maxMatchCount,
                            instrumentRoundSeconds: gameConfig.instrumentRoundSeconds
                        });
                    }

                    await gameStateBroadcaster.broadcastGameState(room.activeSessionId);
                } catch (error) {
                    socket.send(JSON.stringify({
                        type: "error",
                        requestId: message.requestId,
                        payload: {
                            code: "MATCH_CONTINUE_ERROR",
                            message: error.message
                        }
                    }));
                }

                return;
            }

            if(message.type === "game:player-ready" && room.activeSessionId){
                const sessionId = room.activeSessionId;

                const runtime = runtimeRegistry.getRuntime(sessionId)

                if(!runtime) { socket.send(JSON.stringify({
                    type: "error", 
                    payload: {
                        code:"GAME_RUNTIME_NOT_FOUND", 
                        message:"connection-handler.js/game:player-ready: runtime bulunamadi."}
                })); 
                return;
            }
                try
                {
                sessionGameFlow.handlePlayerReady({
                    runtime,
                    playerId: identity.playerId,
                    instrumentRoundSeconds: runtime.instrumentRoundSeconds ?? gameConfig.instrumentRoundSeconds,
                    now: new Date()
                })
            }
                catch(error){
                    socket.send(JSON.stringify({
                        type: "error",
                        payload: {
                            code:"HANDLE_PLAYER_READY_ERROR",
                            message:error.message
                        }
                    }));
                    return;
                }

                await gameStateBroadcaster.broadcastGameState(room.activeSessionId)
                
                return;

            }

            if(message.type === "pattern:draft-update" && room.activeSessionId){
                
                const runtime = runtimeRegistry.getRuntime(room.activeSessionId);

                if(!runtime) { socket.send(JSON.stringify({
                    type: "error", 
                    payload: {
                        code:"GAME_RUNTIME_NOT_FOUND", 
                        message:"connection-handler.js/pattern:draft-update: runtime bulunamadi."}
                }))
                return;
            }
               

                try{

                draftPatternManager.updateDraft({
                    runtime,
                    playerId: identity.playerId,
                    patternData: message.payload.patternData
                })

                gameStateBroadcaster.sendGameStateSnapshot({sessionId: room.activeSessionId, playerId: identity.playerId});
            
                return;
            }

                catch (error) {
                    socket.send(JSON.stringify({
                        type: "error",
                        payload: {
                            code:"UPDATE-DRAFT-ERROR",
                            message:error.message
                        }
                    }));
                    return;
                }
            }

            if (message.type === "pattern:lock" && room.activeSessionId) {
                const runtime = runtimeRegistry.getRuntime(room.activeSessionId);

                if (!runtime) {
                    socket.send(JSON.stringify({
                        type: "error",
                        payload: {
                            code: "GAME_RUNTIME_NOT_FOUND",
                            message: "connection-handler.js/pattern:lock: runtime bulunamadi."
                        }
                    }));
                    return;
                }

                try {
                    const result = await patternLockManager.lockPattern({
                        runtime,
                        playerId: identity.playerId,
                        matchId: runtime.currentMatchId
                    });

                    if (result.success) {
                        const finalizeRound = await roundFinalizer.finalizeRound({runtime, matchId: runtime.currentMatchId, now: new Date()});
                        
                        if(finalizeRound.completed === true && runtime.phase === "NEXT_INSTRUMENT"){
                            instrumentRoundManager.startRound({
                                runtime,
                                instrumentRoundSeconds: runtime.instrumentRoundSeconds ?? gameConfig.instrumentRoundSeconds,
                                now: new Date()
                            })
                            await gameStateBroadcaster.broadcastGameState(runtime.sessionId);
                            return;
                        }

                        if(finalizeRound.completed === true && runtime.phase === "MATCH_BUILDING"){
                            const buildResult = await songAssemblyService.buildMatchSongVariants({
                                sessionId: runtime.sessionId,
                                matchId: runtime.currentMatchId,
                                instrumentIds: runtime.sessionInstrumentIds,
                                playerIds: [...runtime.players.keys()],
                                variantCount: runtime.songVariantCount ?? gameConfig.songVariantCount,
                                currentMatchId: runtime.currentMatchId
                            });

                            if (buildResult.success) {
                                playbackPhaseManager.enterPlayback({
                                    runtime,
                                    variants: buildResult.variants
                                });
                            } else {
                                runtime.matchBuildError = buildResult.error || {
                                    code: "MATCH_BUILD_FAILED",
                                    message: "Şarkı varyantları oluşturulamadı."
                                };
                                runtime.stateVersion++;
                                console.error("MATCH_BUILD_FAILED", {
                                    sessionId: runtime.sessionId,
                                    matchId: runtime.currentMatchId,
                                    error: runtime.matchBuildError
                                });
                            }
                        }

                            await gameStateBroadcaster.broadcastGameState(runtime.sessionId);
                        

                        return;

                    }

                    socket.send(JSON.stringify({
                        type: "error",
                        payload: {
                            code: "PATTERN_LOCK_ERROR",
                            message: result.error?.message || "Pattern kilitlenemedi."
                        }
                    }));
                    return;
                } catch (error) {
                    console.error("PATTERN_LOCK_FLOW_ERROR", {
                        sessionId: runtime.sessionId,
                        matchId: runtime.currentMatchId,
                        phase: runtime.phase,
                        error
                    });

                    if (runtime.phase === "MATCH_BUILDING") {
                        runtime.matchBuildError = {
                            code: "MATCH_BUILD_FAILED",
                            message: error.message || "Şarkı varyantları oluşturulurken hata oluştu."
                        };
                        runtime.stateVersion++;
                        await gameStateBroadcaster.broadcastGameState(runtime.sessionId);
                    }

                    socket.send(JSON.stringify({
                        type: "error",
                        payload: {
                            code: "PATTERN_LOCK_ERROR",
                            message: error.message
                        }
                    }));
                    return;
                }
            }

            if (message.type !== "lobby:request-snapshot") {

                return;
            }

            



            if (lobbyBroadcaster) {
                await lobbyBroadcaster.sendLobbySnapshot({
                    lobbyId: identity.lobbyId,
                    playerId: identity.playerId
                });
            }
        });
    };
}

module.exports = {
    createConnectionHandler
};
