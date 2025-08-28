'use client';

import { useState, useRef, useEffect } from 'react';
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface TimelineViewerProps {
  timeline: {
    sceneId: number;
    totalDuration: number;
    frames: Array<{
      frameId: number;
      startTime: number;
      endTime: number;
      duration: number;
      shotId: number;
      shotNumber: number;
    }>;
    captions: Array<{
      text: string;
      startTime: number;
      endTime: number;
      position: string;
      style: string;
    }>;
    audioSegments: Array<{
      dialogueId: number;
      startTime: number;
      endTime: number;
      text: string;
      audioUrl?: string;
    }>;
  };
}

export function TimelineViewer({ timeline }: TimelineViewerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const timelineRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        setCurrentTime(prev => {
          const newTime = prev + 0.1;
          if (newTime >= timeline.totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return newTime;
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, timeline.totalDuration]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const timelineWidth = rect.width;
    const newTime = (clickX / timelineWidth) * timeline.totalDuration;
    
    setCurrentTime(Math.max(0, Math.min(newTime, timeline.totalDuration)));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentFrame = () => {
    return timeline.frames.find(
      frame => currentTime >= frame.startTime && currentTime <= frame.endTime
    );
  };

  const getCurrentCaption = () => {
    return timeline.captions.find(
      caption => currentTime >= caption.startTime && currentTime <= caption.endTime
    );
  };

  const getCurrentAudio = () => {
    return timeline.audioSegments.find(
      audio => currentTime >= audio.startTime && currentTime <= audio.endTime
    );
  };

  const currentFrame = getCurrentFrame();
  const currentCaption = getCurrentCaption();
  const currentAudio = getCurrentAudio();

  return (
    <div className="space-y-6">
      {/* Timeline Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={togglePlay}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {isPlaying ? (
              <>
                <PauseIcon className="h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4" />
                Play
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsMuted(!isMuted)}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="h-4 w-4" />
              ) : (
                <SpeakerWaveIcon className="h-4 w-4" />
              )}
            </Button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(parseFloat(e.target.value) === 0);
              }}
              className="w-16 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <div className="text-sm text-gray-600">
          {formatTime(currentTime)} / {formatTime(timeline.totalDuration)}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div
          ref={timelineRef}
          className="relative h-16 bg-gray-100 rounded-lg cursor-pointer overflow-hidden"
          onClick={handleTimelineClick}
        >
          {/* Timeline background with time markers */}
          <div className="absolute inset-0 flex items-center justify-between px-4 text-xs text-gray-500">
            {Array.from({ length: Math.ceil(timeline.totalDuration) + 1 }, (_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-px h-2 bg-gray-300"></div>
                <span>{formatTime(i)}</span>
              </div>
            ))}
          </div>

          {/* Frames */}
          {timeline.frames.map((frame) => {
            const left = (frame.startTime / timeline.totalDuration) * 100;
            const width = (frame.duration / timeline.totalDuration) * 100;
            
            return (
              <div
                key={frame.frameId}
                className="absolute top-0 h-full bg-blue-200 border border-blue-300 rounded"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                }}
                title={`Shot ${frame.shotNumber} (${formatTime(frame.duration)})`}
              >
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-blue-800">
                  {frame.shotNumber}
                </div>
              </div>
            );
          })}

          {/* Audio segments */}
          {timeline.audioSegments.map((audio) => {
            const left = (audio.startTime / timeline.totalDuration) * 100;
            const width = ((audio.endTime - audio.startTime) / timeline.totalDuration) * 100;
            
            return (
              <div
                key={audio.dialogueId}
                className="absolute bottom-0 h-1/3 bg-green-200 border border-green-300 rounded"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                }}
                title={audio.text}
              />
            );
          })}

          {/* Playhead */}
          <div
            className="absolute top-0 w-0.5 h-full bg-red-500 z-10"
            style={{
              left: `${(currentTime / timeline.totalDuration) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Current Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Frame */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Current Frame</h4>
          {currentFrame ? (
            <div className="text-sm text-blue-800">
              <p><strong>Shot {currentFrame.shotNumber}</strong></p>
              <p>Duration: {formatTime(currentFrame.duration)}</p>
              <p>Time: {formatTime(currentTime - currentFrame.startTime)}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No frame at current time</p>
          )}
        </div>

        {/* Current Caption */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">Current Caption</h4>
          {currentCaption ? (
            <div className="text-sm text-yellow-800">
              <p className="font-medium">{currentCaption.text}</p>
              <p>Style: {currentCaption.style}</p>
              <p>Position: {currentCaption.position}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No caption at current time</p>
          )}
        </div>

        {/* Current Audio */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">Current Audio</h4>
          {currentAudio ? (
            <div className="text-sm text-green-800">
              <p className="font-medium">{currentAudio.text}</p>
              <p>Dialogue ID: {currentAudio.dialogueId}</p>
              {currentAudio.audioUrl && (
                <p className="text-xs text-green-600">Audio available</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No audio at current time</p>
          )}
        </div>
      </div>

      {/* Timeline Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Timeline Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
          <div>
            <p><strong>Total Duration:</strong></p>
            <p>{formatTime(timeline.totalDuration)}</p>
          </div>
          <div>
            <p><strong>Frames:</strong></p>
            <p>{timeline.frames.length}</p>
          </div>
          <div>
            <p><strong>Captions:</strong></p>
            <p>{timeline.captions.length}</p>
          </div>
          <div>
            <p><strong>Audio Segments:</strong></p>
            <p>{timeline.audioSegments.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
