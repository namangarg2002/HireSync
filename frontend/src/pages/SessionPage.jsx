import { useUser } from '@clerk/clerk-react';
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { io } from 'socket.io-client';
import { useEndSessions, useJoinSessions, useLeaveSession, useSessionById } from '../hooks/useSession';
import { PROBLEMS } from '../data/problems';
import { executeCode } from '../lib/excecuteCodeEditor';
import Navbar from '../components/Navbar';
import { Panel, Group, Separator } from "react-resizable-panels";
import getDifficultyBadgeClass from '../lib/utils';
import { Loader2Icon, LogOutIcon, PhoneOffIcon, GripVertical, GripHorizontal } from "lucide-react";
import CodeEditorPanel from '../components/CodeEditorPanel';
import OutputPanel from '../components/OutputPanel';

import useStreamClient from '../hooks/useStreamClient';
import { StreamCall, StreamVideo } from "@stream-io/video-react-sdk";
import VideoCallUI from "../components/VideoCallUI";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL;

function SessionPage() {
    const navigate = useNavigate();
    const { sessionId } = useParams();
    const { user } = useUser();
    const [output, setOutput] = useState(null);
    const [isRunning, setIsRunning] = useState(false);

    const { data:sessionData, isLoading:loadingSession, refetch} = useSessionById(sessionId);
    const joinSessionMutation = useJoinSessions();
    const leaveSessionMutation = useLeaveSession();
    const endSessionMutation = useEndSessions();

    const session = sessionData?.session;
    // console.log("Session is : ", session)

    const isHost = session?.host?.clerkId === user?.id;
    const isParticipant = session?.participant?.clerkId === user?.id;

    const { call, channel, chatClient, isInitializingCall, streamClient } = useStreamClient(
      session,
      loadingSession,
      isHost,
      isParticipant
    );

    const problemData = session?.problem
    ? Object.values(PROBLEMS).find((p) => p.title === session.problem)
    : null

    const [selectedLanguage, setSelectedLanguage] = useState('javascript');
    const [code, setCode] = useState(problemData?.starterCode?.[selectedLanguage] || '')

    const hasLeftRef = useRef(false);
    const hasJoinedRef = useRef(false);
    const hasHydratedStateRef = useRef(false);
    const isRemoteUpdateRef = useRef(false);
    const remoteResetTimerRef = useRef(null);
    const codeSyncTimerRef = useRef(null);
    const socketRef = useRef(null);
    const latestCodeRef = useRef(code);
    const latestLangRef = useRef(selectedLanguage);

    useEffect(() => {
        latestCodeRef.current = code;
    }, [code]);

    useEffect(() => {
        latestLangRef.current = selectedLanguage;
    }, [selectedLanguage]);

    const broadcastSync = useCallback(({ nextCode, nextLanguage, nextOutput, nextIsRunning }) => {
        const socket = socketRef.current;
        if (!socket || !sessionId || !user?.id || session?.status === "completed") return;

        const payload = {
            sessionId,
            senderId: user.id,
        };

        if (typeof nextCode === "string") payload.code = nextCode;
        if (typeof nextLanguage === "string") payload.language = nextLanguage;
        if (nextOutput !== undefined) payload.output = nextOutput;
        if(typeof nextIsRunning === "boolean") payload.isRunning = nextIsRunning;

        socket.emit("editor-sync", payload);
    }, [sessionId, user?.id, session?.status]);

    useEffect(() => {
        if (!session || !user || loadingSession || hasLeftRef.current || hasJoinedRef.current) return;
        if (isHost || isParticipant || joinSessionMutation.isPending) return;

        hasJoinedRef.current = true;
        joinSessionMutation.mutate(sessionId, {
            onSuccess: () => {
                refetch();
            },
            onError: () => {
                hasJoinedRef.current = false;
            },
        });

    }, [session, user, loadingSession, isHost, isParticipant, sessionId, joinSessionMutation.isPending]);


    useEffect(() => {
        if (!session || loadingSession) return;

        if (session.status === "completed") navigate("/dashboard");
    }, [session, loadingSession, navigate]);

    useEffect(() => {
        if (!sessionId || !user?.id || session?.status === "completed") return;

        const socket = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        const applyStateSnapshot = (snapshot) => {
            if (!snapshot) return;

            isRemoteUpdateRef.current = true;
            hasHydratedStateRef.current = true;

            if (typeof snapshot.language === "string") {
                latestLangRef.current = snapshot.language;
                setSelectedLanguage(snapshot.language);
            }
            if (typeof snapshot.code === "string") {
                latestCodeRef.current = snapshot.code;
                setCode(snapshot.code);
            }
            if (snapshot.output !== undefined) {
                setOutput(snapshot.output);
            }
            if (typeof snapshot.isRunning === "boolean"){
                setIsRunning(snapshot.isRunning);
            }

            clearTimeout(remoteResetTimerRef.current);
            remoteResetTimerRef.current = setTimeout(() => {
                isRemoteUpdateRef.current = false;
            }, 60);
        };

        socket.on("connect", () => {
            socket.emit("join-session", { sessionId });
        });

        socket.on("session-state", (snapshot) => {
            applyStateSnapshot(snapshot);
        });

        socket.on("editor-sync", (event) => {
            if (!event || event.senderId === user.id) return;
            applyStateSnapshot(event);
        });

        socket.on("session-ended", () => {
            navigate("/dashboard");
        });

        return () => {
            clearTimeout(remoteResetTimerRef.current);
            clearTimeout(codeSyncTimerRef.current);
            socket.off("connect");
            socket.off("session-state");
            socket.off("editor-sync");
            socket.off("session-ended");
            socket.disconnect();
            socketRef.current = null;
        };
    }, [sessionId, user?.id, session?.status, navigate]);

    // update code when problem loads or changes
    useEffect(() => {
        if (isRemoteUpdateRef.current || hasHydratedStateRef.current) return;
        if (problemData?.starterCode?.[selectedLanguage]) {
            setCode(problemData.starterCode[selectedLanguage]);
        }
    }, [problemData, selectedLanguage]);

    // // Listen for live code, language, and output updates from the other participant/host
    // useEffect(() => {
    //     if (!channel || !user?.id) return;

    //     const handleChannelEvent = (event) => {
    //         if (event.type !== "editor-sync") return;
    //         const payload = event.data || event;
    //         if (!payload || payload.senderId === user.id) return;

    //         isRemoteUpdateRef.current = true;

    //         if (typeof payload.language === "string") {
    //             latestLangRef.current = payload.language;
    //             setSelectedLanguage(payload.language);
    //         }
    //         if (typeof payload.code === "string") {
    //             latestCodeRef.current = payload.code;
    //             setCode(payload.code);
    //         }
    //         if (payload.output !== undefined) {
    //             setOutput(payload.output);
    //         }

    //         clearTimeout(remoteResetTimerRef.current);
    //         remoteResetTimerRef.current = setTimeout(() => {
    //             isRemoteUpdateRef.current = false;
    //         }, 60);
    //     };

    //     channel.on("editor-sync", handleChannelEvent);

    //     return () => {
    //         clearTimeout(remoteResetTimerRef.current);
    //         clearTimeout(codeSyncTimerRef.current);
    //         channel.off("editor-sync", handleChannelEvent);
    //     };
    // }, [channel, user?.id]);

    const handleLanguageChange = (langOrEvent) => {
        const newLang = typeof langOrEvent === "string"
            ? langOrEvent
            : langOrEvent?.target?.value;

        if (!newLang) return;

        const starterCode = problemData?.starterCode?.[newLang] || "";
        latestLangRef.current = newLang;
        latestCodeRef.current = starterCode;
        setSelectedLanguage(newLang);
        setCode(starterCode);
        setOutput(null);

        if (!isRemoteUpdateRef.current) {
            clearTimeout(codeSyncTimerRef.current);
            broadcastSync({
                nextCode: starterCode,
                nextLanguage: newLang,
                nextOutput: null,
            });
        }
    };

    const handleCodeChange = (value) => {
        const nextCode = value ?? "";
        latestCodeRef.current = nextCode;
        setCode(nextCode);

        if (isRemoteUpdateRef.current) return;

        clearTimeout(codeSyncTimerRef.current);
        codeSyncTimerRef.current = setTimeout(() => {
            broadcastSync({
                nextCode: latestCodeRef.current,
                nextLanguage: latestLangRef.current,
            });
        }, 80);
    };

    

    const handleRunCode = async () => {
        setIsRunning(true);
        setOutput(null);
        broadcastSync({ nextOutput: null, nextIsRunning: true });

        try {
            const result = await executeCode(selectedLanguage, latestCodeRef.current);
            setOutput(result);
            broadcastSync({ nextOutput: result, nextIsRunning: false });
        } catch (err) {
            console.error("Failed to execute code:", err);
            broadcastSync({ nextOutput: null, nextIsRunning: false });
        } finally {
            setIsRunning(false);
        }
    };

    const handleEndSession = () => {
        if (confirm("Are you sure you want to end this session? All participants will be notified.")) {
          socketRef.current?.emit("end-session", { sessionId });
          endSessionMutation.mutate(sessionId, { onSuccess: () => navigate("/dashboard") });
        }
    };

    const handleLeaveSession = () => {
        if (confirm("Are you sure you want to leave this session?")) {
            hasLeftRef.current = true;
            leaveSessionMutation.mutate(sessionId, {
                onSuccess: () => navigate("/dashboard"),
                onError: () => {
                    hasLeftRef.current = false;
                },
            });
        }
    };
    

  return (
    <div className="h-screen bg-base-100 flex flex-col">
      <Navbar />

      <div className="flex-1 min-h-0 overflow-hidden">
        <Group orientation="horizontal">
          {/* LEFT PANEL - CODE EDITOR & PROBLEM DETAILS */}
          <Panel defaultSize={50} minSize={30}>
            <Group orientation="vertical">
              {/* PROBLEM DSC PANEL */}
              <Panel defaultSize={50} minSize={20}>
                <div className="h-full overflow-y-auto bg-base-200">
                  {/* HEADER SECTION */}
                  <div className="p-6 bg-base-100 border-b border-base-300">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h1 className="text-3xl font-bold text-base-content">
                          {session?.problem || "Loading..."}
                        </h1>
                        {problemData?.category && (
                          <p className="text-base-content/60 mt-1">{problemData.category}</p>
                        )}
                        <p className="text-base-content/60 mt-2">
                          Host: {session?.host?.name || "Loading..."} •{" "}
                          {session?.participant ? 2 : 1}/2 participants
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`badge badge-lg ${getDifficultyBadgeClass(
                            session?.difficulty
                          )}`}
                        >
                          {session?.difficulty.slice(0, 1).toUpperCase() +
                            session?.difficulty.slice(1) || "Easy"}
                        </span>
                        {isHost && session?.status === "active" && (
                          <button
                            onClick={handleEndSession}
                            disabled={endSessionMutation.isPending}
                            className="btn btn-error btn-sm gap-2"
                          >
                            {endSessionMutation.isPending ? (
                              <Loader2Icon className="w-4 h-4 animate-spin" />
                            ) : (
                              <LogOutIcon className="w-4 h-4" />
                            )}
                            End Session
                          </button>
                        )}
                        {isParticipant && session?.status === "active" && (
                          <button
                            onClick={handleLeaveSession}
                            disabled={leaveSessionMutation.isPending}
                            className="btn btn-warning btn-sm gap-2"
                          >
                            {leaveSessionMutation.isPending ? (
                              <Loader2Icon className="w-4 h-4 animate-spin" />
                            ) : (
                              <LogOutIcon className="w-4 h-4" />
                            )}
                            Leave Session
                          </button>
                        )}
                        {session?.status === "completed" && (
                          <span className="badge badge-ghost badge-lg">Completed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* problem desc */}
                    {problemData?.description && (
                      <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                        <h2 className="text-xl font-bold mb-4 text-base-content">Description</h2>
                        <div className="space-y-3 text-base leading-relaxed">
                          <p className="text-base-content/90">{problemData.description.text}</p>
                          {problemData.description.notes?.map((note, idx) => (
                            <p key={idx} className="text-base-content/90">
                              {note}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* examples section */}
                    {problemData?.examples && problemData.examples.length > 0 && (
                      <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                        <h2 className="text-xl font-bold mb-4 text-base-content">Examples</h2>

                        <div className="space-y-4">
                          {problemData.examples.map((example, idx) => (
                            <div key={idx}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="badge badge-sm">{idx + 1}</span>
                                <p className="font-semibold text-base-content">Example {idx + 1}</p>
                              </div>
                              <div className="bg-base-200 rounded-lg p-4 font-mono text-sm space-y-1.5">
                                <div className="flex gap-2">
                                  <span className="text-primary font-bold min-w-[70px]">
                                    Input:
                                  </span>
                                  <span>{example.input}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-secondary font-bold min-w-[70px]">
                                    Output:
                                  </span>
                                  <span>{example.output}</span>
                                </div>
                                {example.explanation && (
                                  <div className="pt-2 border-t border-base-300 mt-2">
                                    <span className="text-base-content/60 font-sans text-xs">
                                      <span className="font-semibold">Explanation:</span>{" "}
                                      {example.explanation}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Constraints */}
                    {problemData?.constraints && problemData.constraints.length > 0 && (
                      <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                        <h2 className="text-xl font-bold mb-4 text-base-content">Constraints</h2>
                        <ul className="space-y-2 text-base-content/90">
                          {problemData.constraints.map((constraint, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="text-primary">•</span>
                              <code className="text-sm">{constraint}</code>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>

              <Separator className="h-3 bg-base-300 hover:bg-primary transition-colors cursor-row-resize flex items-center justify-center">
                <GripHorizontal className="w-4 h-4 text-base-content/40" />
              </Separator>

              <Panel defaultSize={50} minSize={20}>
                <Group orientation="vertical">
                  <Panel defaultSize={70} minSize={30}>
                    <CodeEditorPanel
                      selectedLanguage={selectedLanguage}
                      code={code}
                      isRunning={isRunning}
                      onLanguageChange={handleLanguageChange}
                      onCodeChange={handleCodeChange}
                      onRunCode={handleRunCode}
                    />
                  </Panel>

                  <Separator className="h-3 bg-base-300 hover:bg-primary transition-colors cursor-row-resize flex items-center justify-center">
                    <GripHorizontal className="w-4 h-4 text-base-content/40" />
                  </Separator>

                  <Panel defaultSize={30} minSize={15}>
                    <OutputPanel output={output} expectedOutput={problemData?.expectedOutput?.[selectedLanguage]}/>
                  </Panel>
                </Group>
              </Panel>
            </Group>
          </Panel>

          <Separator className="w-3 bg-base-300 hover:bg-primary transition-colors cursor-col-resize flex items-center justify-center">
            <GripVertical className="w-4 h-4 text-base-content/40" />
          </Separator>

          {/* RIGHT PANEL - VIDEO CALLS & CHAT */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full bg-base-200 p-4 overflow-auto">
              {isInitializingCall ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2Icon className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
                    <p className="text-lg">Connecting to video call...</p>
                  </div>
                </div>
              ) : !streamClient || !call ? (
                <div className="h-full flex items-center justify-center">
                  <div className="card bg-base-100 shadow-xl max-w-md">
                    <div className="card-body items-center text-center">
                      <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center mb-4">
                        <PhoneOffIcon className="w-12 h-12 text-error" />
                      </div>
                      <h2 className="card-title text-2xl">Connection Failed</h2>
                      <p className="text-base-content/70">Unable to connect to the video call</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  <StreamVideo client={streamClient}>
                    <StreamCall call={call}>
                      <VideoCallUI chatClient={chatClient} channel={channel} onLeaveCall={!isHost && isParticipant ? handleLeaveSession : undefined} />
                    </StreamCall>
                  </StreamVideo>
                </div>
              )}
            </div>
          </Panel>
        </Group>
      </div>
    </div>
  );
}

export default SessionPage;