import React from 'react';

interface FrameLabelProps {
  frame: {
    id: string;
    shotId: string;
    style: string;
    status: string;
    metadata?: {
      characters?: string[];
      location?: string;
      action?: string;
      dialogue?: string;
    };
  };
  shot?: {
    id: string;
    shotSize: string;
    shotAngle: string;
    cameraMovement?: string;
    lensType?: string;
  };
}

export const FrameLabel: React.FC<FrameLabelProps> = ({ frame, shot }) => {
  const getFrameDescription = () => {
    const parts = [];
    
    // Shot information
    if (shot) {
      parts.push(`${shot.shotSize} shot`);
      parts.push(`from ${shot.shotAngle} angle`);
      if (shot.cameraMovement) {
        parts.push(`with ${shot.cameraMovement} camera movement`);
      }
      if (shot.lensType) {
        parts.push(`using ${shot.lensType} lens`);
      }
    }
    
    // Content information
    if (frame.metadata) {
      if (frame.metadata.characters?.length) {
        parts.push(`featuring ${frame.metadata.characters.join(', ')}`);
      }
      if (frame.metadata.location) {
        parts.push(`at ${frame.metadata.location}`);
      }
      if (frame.metadata.action) {
        parts.push(`showing ${frame.metadata.action}`);
      }
      if (frame.metadata.dialogue) {
        parts.push(`with dialogue: "${frame.metadata.dialogue}"`);
      }
    }
    
    // Style information
    parts.push(`in ${frame.style} style`);
    parts.push(`status: ${frame.status}`);
    
    return parts.join(', ');
  };

  return (
    <div
      className="sr-only"
      aria-label={`Frame ${frame.id}: ${getFrameDescription()}`}
      role="img"
      aria-describedby={`frame-${frame.id}-description`}
    >
      <span id={`frame-${frame.id}-description`}>
        {getFrameDescription()}
      </span>
    </div>
  );
};

interface ShotLabelProps {
  shot: {
    id: string;
    shotSize: string;
    shotAngle: string;
    cameraMovement?: string;
    lensType?: string;
    description?: string;
    dialogue?: string;
    duration?: number;
  };
  frameCount?: number;
}

export const ShotLabel: React.FC<ShotLabelProps> = ({ shot, frameCount = 0 }) => {
  const getShotDescription = () => {
    const parts = [];
    
    // Basic shot information
    parts.push(`${shot.shotSize} shot`);
    parts.push(`from ${shot.shotAngle} angle`);
    
    // Camera details
    if (shot.cameraMovement) {
      parts.push(`with ${shot.cameraMovement} camera movement`);
    }
    if (shot.lensType) {
      parts.push(`using ${shot.lensType} lens`);
    }
    
    // Content
    if (shot.description) {
      parts.push(`showing ${shot.description}`);
    }
    if (shot.dialogue) {
      parts.push(`with dialogue: "${shot.dialogue}"`);
    }
    
    // Duration
    if (shot.duration) {
      parts.push(`duration: ${shot.duration} seconds`);
    }
    
    // Frame count
    if (frameCount > 0) {
      parts.push(`${frameCount} frame${frameCount !== 1 ? 's' : ''} generated`);
    }
    
    return parts.join(', ');
  };

  return (
    <div
      className="sr-only"
      aria-label={`Shot ${shot.id}: ${getShotDescription()}`}
      role="region"
      aria-describedby={`shot-${shot.id}-description`}
    >
      <span id={`shot-${shot.id}-description`}>
        {getShotDescription()}
      </span>
    </div>
  );
};

interface SceneLabelProps {
  scene: {
    id: string;
    title: string;
    description?: string;
    shotCount?: number;
    frameCount?: number;
    duration?: number;
  };
}

export const SceneLabel: React.FC<SceneLabelProps> = ({ scene }) => {
  const getSceneDescription = () => {
    const parts = [];
    
    parts.push(`Scene: ${scene.title}`);
    
    if (scene.description) {
      parts.push(`Description: ${scene.description}`);
    }
    
    if (scene.shotCount !== undefined) {
      parts.push(`${scene.shotCount} shot${scene.shotCount !== 1 ? 's' : ''}`);
    }
    
    if (scene.frameCount !== undefined) {
      parts.push(`${scene.frameCount} frame${scene.frameCount !== 1 ? 's' : ''} generated`);
    }
    
    if (scene.duration) {
      parts.push(`total duration: ${scene.duration} seconds`);
    }
    
    return parts.join(', ');
  };

  return (
    <div
      className="sr-only"
      aria-label={getSceneDescription()}
      role="region"
      aria-describedby={`scene-${scene.id}-description`}
    >
      <span id={`scene-${scene.id}-description`}>
        {getSceneDescription()}
      </span>
    </div>
  );
};

interface TimelineLabelProps {
  currentTime: number;
  totalDuration: number;
  currentFrame?: number;
  totalFrames?: number;
  currentShot?: string;
  currentScene?: string;
}

export const TimelineLabel: React.FC<TimelineLabelProps> = ({
  currentTime,
  totalDuration,
  currentFrame,
  totalFrames,
  currentShot,
  currentScene
}) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimelineDescription = () => {
    const parts = [];
    
    parts.push(`Time: ${formatTime(currentTime)} of ${formatTime(totalDuration)}`);
    
    if (currentFrame !== undefined && totalFrames !== undefined) {
      parts.push(`Frame ${currentFrame} of ${totalFrames}`);
    }
    
    if (currentScene) {
      parts.push(`Scene: ${currentScene}`);
    }
    
    if (currentShot) {
      parts.push(`Shot: ${currentShot}`);
    }
    
    return parts.join(', ');
  };

  return (
    <div
      className="sr-only"
      aria-label={getTimelineDescription()}
      role="status"
      aria-live="polite"
      aria-describedby="timeline-description"
    >
      <span id="timeline-description">
        {getTimelineDescription()}
      </span>
    </div>
  );
};

interface StatusLabelProps {
  status: string;
  progress?: number;
  message?: string;
}

export const StatusLabel: React.FC<StatusLabelProps> = ({ status, progress, message }) => {
  const getStatusDescription = () => {
    const parts = [];
    
    parts.push(`Status: ${status}`);
    
    if (progress !== undefined) {
      parts.push(`${Math.round(progress * 100)}% complete`);
    }
    
    if (message) {
      parts.push(message);
    }
    
    return parts.join(', ');
  };

  return (
    <div
      className="sr-only"
      aria-label={getStatusDescription()}
      role="status"
      aria-live="polite"
      aria-describedby="status-description"
    >
      <span id="status-description">
        {getStatusDescription()}
      </span>
    </div>
  );
};
