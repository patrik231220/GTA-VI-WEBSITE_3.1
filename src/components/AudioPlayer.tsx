import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const AudioPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Audio playlist - Tom Petty first, then randomized
  const playlist = [
    '/AUDIO/Tom Petty - Love Is A Long Road (Official Audio).mp3',
    '/AUDIO/Wang Chung - Everybody Have Fun Tonight (Official Music Video).mp3',
    '/AUDIO/Stardust - Music Sounds Better With You (Official Music Video).mp3',
    '/AUDIO/The Pointer Sisters - Hot Together (GTA VI Trailer)(Lyrics).mp3',
    '/AUDIO/Laura Branigan - Self Control (Official Music Video).mp3'
  ];

  // Randomize playlist except for the first track
  const [randomizedPlaylist] = useState(() => {
    const firstTrack = playlist[0];
    const remainingTracks = playlist.slice(1);
    
    // Fisher-Yates shuffle for remaining tracks
    for (let i = remainingTracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remainingTracks[i], remainingTracks[j]] = [remainingTracks[j], remainingTracks[i]];
    }
    
    return [firstTrack, ...remainingTracks];
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set initial volume to 10%
    audio.volume = 0.1;
    
    // Add error handling
    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
      console.warn('Audio failed to load:', randomizedPlaylist[currentTrackIndex]);
    };
    
    const handleCanPlay = () => {
      setIsLoading(false);
      setHasError(false);
    };

    // Auto-play the first track with error handling
    const playAudio = async () => {
      try {
        setIsLoading(true);
        await audio.play();
        setIsPlaying(true);
        setIsLoading(false);
      } catch (error) {
        console.log('Autoplay prevented by browser:', error);
        setIsLoading(false);
        // Autoplay was prevented, user will need to interact first
      }
    };

    // Only attempt autoplay if audio source is available
    if (randomizedPlaylist[currentTrackIndex]) {
      playAudio();
    }

    // Handle track end - play next track
    const handleTrackEnd = () => {
      const nextIndex = (currentTrackIndex + 1) % randomizedPlaylist.length;
      setCurrentTrackIndex(nextIndex);
    };

    audio.addEventListener('ended', handleTrackEnd);
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('ended', handleTrackEnd);
      audio.removeEventListener('play', () => setIsPlaying(true));
      audio.removeEventListener('pause', () => setIsPlaying(false));
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentTrackIndex, randomizedPlaylist]);

  // Update audio source when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setIsLoading(true);
    setHasError(false);
    audio.src = randomizedPlaylist[currentTrackIndex];
    
    if (isPlaying && !hasError) {
      audio.play().catch((error) => {
        console.error('Failed to play audio:', error);
        setHasError(true);
        setIsLoading(false);
      });
    }
  }, [currentTrackIndex, randomizedPlaylist, isPlaying, hasError]);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio || hasError) return;

    if (isMuted) {
      audio.volume = 0.1;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  // Handle user interaction to start audio (for browsers that block autoplay)
  const handleUserInteraction = async () => {
    const audio = audioRef.current;
    if (!audio || isPlaying || hasError) return;

    try {
      setIsLoading(true);
      await audio.play();
      setIsPlaying(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to play audio:', error);
      setHasError(true);
      setIsLoading(false);
    }
  };

  // Don't render if there's a critical error
  if (hasError && !randomizedPlaylist.length) {
    return null;
  }
  return (
    <>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        preload="auto"
        loop={false}
      />
      
      {/* Mute/Unmute Toggle Button */}
      <button
        onClick={toggleMute}
        onMouseDown={handleUserInteraction} // Trigger user interaction for autoplay
        className={`audio-control fixed bottom-6 left-6 z-50 bg-black/60 backdrop-blur-sm border border-white/20 rounded-full p-3 text-white hover:bg-black/80 transition-all duration-300 hover:scale-110 shadow-lg ${hasError ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
        disabled={hasError}
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : hasError ? (
          <VolumeX className="w-6 h-6 opacity-50" />
        ) : isMuted ? (
          <VolumeX className="w-6 h-6" />
        ) : (
          <Volume2 className="w-6 h-6" />
        )}
      </button>

    </>
  );
};

export default AudioPlayer;