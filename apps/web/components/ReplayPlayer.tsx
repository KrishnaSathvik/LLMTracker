"use client";

import React, { useState, useEffect, useRef } from 'react';
import Replayer from 'rrweb-player';

interface Keyframe {
  id: string;
  t_ms: number;
  kind: string;
  data: any;
}

interface ReplayPlayerProps {
  keyframes: Keyframe[];
  events: any[];
  selectedTime: number;
  onTimeChange: (time: number) => void;
}

export default function ReplayPlayer({ keyframes, events, selectedTime, onTimeChange }: ReplayPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(selectedTime);
  const [duration, setDuration] = useState(0);
  const replayRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const replayerRef = useRef<Replayer | null>(null);

  // Calculate duration from events
  useEffect(() => {
    if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      setDuration(lastEvent.t_ms);
    }
  }, [events]);

  // Sync with parent selectedTime
  useEffect(() => {
    setCurrentTime(selectedTime);
  }, [selectedTime]);

  // Initialize rrweb replayer
  useEffect(() => {
    if (!replayRef.current) return;

    // Clean up existing replayer
    if (replayerRef.current) {
      // rrweb-player doesn't have a destroy method, just set to null
      replayerRef.current = null;
    }

    // Get rrweb events from keyframes
    const rrwebEvents = keyframes
      .filter(kf => kf.data?.rrwebEvent)
      .map(kf => kf.data?.rrwebEvent)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (rrwebEvents.length > 0) {
      try {
        replayerRef.current = new Replayer({
          target: replayRef.current,
          props: {
            events: rrwebEvents
          }
        });

        console.log('AFR: rrweb replayer initialized with', rrwebEvents.length, 'events');
      } catch (error) {
        console.error('AFR: Failed to initialize rrweb replayer:', error);
      }
    }

    return () => {
      if (replayerRef.current) {
        // rrweb-player doesn't have a destroy method
        replayerRef.current = null;
      }
    };
  }, [keyframes]);

  // Play/pause animation
  useEffect(() => {
    if (replayerRef.current) {
      if (isPlaying) {
        replayerRef.current.play();
      } else {
        replayerRef.current.pause();
      }
    } else {
      // Fallback animation for non-rrweb playback
      if (isPlaying) {
        const startTime = Date.now();
        const startMs = currentTime;
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const newTime = startMs + elapsed;
          
          if (newTime >= duration) {
            setCurrentTime(duration);
            setIsPlaying(false);
            onTimeChange(duration);
          } else {
            setCurrentTime(newTime);
            onTimeChange(newTime);
            animationRef.current = requestAnimationFrame(animate);
          }
        };
        
        animationRef.current = requestAnimationFrame(animate);
      } else {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, currentTime, duration, onTimeChange]);

  // Find the current keyframe to display
  const getCurrentKeyframe = () => {
    if (keyframes.length === 0) return null;
    
    // Find the most recent keyframe before or at current time
    let currentKeyframe = keyframes[0];
    for (const keyframe of keyframes) {
      if (keyframe.t_ms <= currentTime) {
        currentKeyframe = keyframe;
      } else {
        break;
      }
    }
    
    return currentKeyframe;
  };

  // Find events at current time
  const getEventsAtTime = () => {
    return events.filter(event => 
      event.t_ms >= currentTime - 1000 && event.t_ms <= currentTime + 1000
    ).sort((a, b) => a.t_ms - b.t_ms);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseInt(e.target.value);
    setCurrentTime(newTime);
    onTimeChange(newTime);
    
    // Seek in rrweb replayer if available
    if (replayerRef.current) {
      // Convert milliseconds to seconds for rrweb
      const seekTime = newTime / 1000;
      // Note: rrweb-player may not have setCurrentTime method
      // This functionality might need to be implemented differently
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStepBack = () => {
    const newTime = Math.max(0, currentTime - 1000);
    setCurrentTime(newTime);
    onTimeChange(newTime);
  };

  const handleStepForward = () => {
    const newTime = Math.min(duration, currentTime + 1000);
    setCurrentTime(newTime);
    onTimeChange(newTime);
  };

  const currentKeyframe = getCurrentKeyframe();
  const eventsAtTime = getEventsAtTime();

  return (
    <div className="replay-player">
      {/* Controls */}
      <div className="replay-controls mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4 mb-3">
          <button
            onClick={handlePlayPause}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          
          <button
            onClick={handleStepBack}
            className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700"
          >
            ⏪ -1s
          </button>
          
          <button
            onClick={handleStepForward}
            className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700"
          >
            +1s ⏩
          </button>
          
          <div className="text-sm text-gray-600">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        
        {/* Timeline scrubber */}
        <div className="relative">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`
            }}
          />
          
          {/* Event markers on timeline */}
          <div className="absolute top-0 w-full h-2 pointer-events-none">
            {events.map((event, index) => {
              const position = (event.t_ms / duration) * 100;
              const isNearCurrent = Math.abs(event.t_ms - currentTime) < 500;
              
              return (
                <div
                  key={index}
                  className={`absolute w-2 h-2 rounded-full -mt-1 ${
                    event.kind === 'click' ? 'bg-green-500' :
                    event.kind === 'network' ? 'bg-blue-500' :
                    event.kind === 'dom_fp' ? 'bg-purple-500' :
                    'bg-gray-500'
                  } ${isNearCurrent ? 'ring-2 ring-white shadow-lg' : ''}`}
                  style={{ left: `${position}%` }}
                  title={`${event.kind} at ${formatTime(event.t_ms)}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Replay Area */}
      <div className="replay-area border rounded-lg overflow-hidden bg-white">
        {/* rrweb Player Container */}
        <div 
          ref={replayRef}
          className="rrweb-player-container"
          style={{ 
            minHeight: '400px',
            width: '100%',
            backgroundColor: '#f9fafb'
          }}
        />
        
        {/* Fallback display when no rrweb data */}
        {keyframes.filter(kf => kf.data?.rrwebEvent).length === 0 && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Visual Replay</h3>
              <div className="text-sm text-gray-500">
                Fallback Mode
              </div>
            </div>
            
            <div className="replay-frame border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
              <div className="text-gray-600 mb-4">
                🎬 Enhanced Replay Coming Soon
              </div>
              
              {currentKeyframe?.data?.domSnapshot ? (
                <div className="text-left max-w-md mx-auto">
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="text-sm font-medium mb-2">Page Snapshot</div>
                    <div className="text-xs text-gray-600 mb-2">
                      URL: {currentKeyframe.data.url || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      Elements: {currentKeyframe.data?.domSnapshot?.elementCount || 0}
                    </div>
                    
                    {currentKeyframe.data?.domSnapshot?.buttons?.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs font-medium text-gray-700 mb-1">Buttons:</div>
                        {currentKeyframe.data?.domSnapshot?.buttons?.slice(0, 3)?.map((btn: any, i: number) => (
                          <div key={i} className="text-xs text-gray-600 ml-2">
                            • {btn.text} {btn.disabled ? '(disabled)' : ''}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {currentKeyframe.data?.domSnapshot?.links?.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-700 mb-1">Links:</div>
                        {currentKeyframe.data?.domSnapshot?.links?.slice(0, 3)?.map((link: any, i: number) => (
                          <div key={i} className="text-xs text-gray-600 ml-2">
                            • {link.text} → {link.href}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">
                  <div className="mb-2">📸 Keyframe captured</div>
                  <div className="text-sm">
                    Install extension and visit a page to see rrweb replay
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Events at Current Time */}
      {eventsAtTime.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            Events at {formatTime(currentTime)}
          </h4>
          <div className="space-y-1">
            {eventsAtTime.map((event, index) => (
              <div key={index} className="text-sm text-blue-800">
                <span className="font-mono">{event.kind}</span>
                {event.payload?.text && (
                  <span className="ml-2">• {event.payload.text}</span>
                )}
                {event.payload?.url && (
                  <span className="ml-2 text-xs text-blue-600">
                    {event.payload.url}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
