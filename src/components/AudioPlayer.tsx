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
    '/audio/Tom Petty - Love Is A Long Road (Official Audio).mp3',
    '/audio/Wang Chung - Everybody Have Fun Tonight (Official Music Video).mp3',
    '/audio/Stardust - Music Sounds Better With You (Official Music Video).mp3',
    '/audio/The Pointer Sisters - Hot Together (GTA VI Trailer)(Lyrics).mp3',
    '/audio/Laura Branigan - Self Control (Official Music Video).mp3'
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

    // Set initial volume to 15% for better audibility
    audio.volume = 0.15;
    
    // Add error handling
    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
      console.warn('Audio failed to load:', randomizedPlaylist[currentTrackIndex]);
      // Try next track if current one fails
      setTimeout(() => {
        const nextIndex = (currentTrackIndex + 1) % randomizedPlaylist.length;
        setCurrentTrackIndex(nextIndex);
        setHasError(false);
      }, 2000);
    };
    
    const handleCanPlay = () => {
      setIsLoading(false);
      setHasError(false);
    };

    // Auto-play with better error handling
    const playAudio = async () => {
      try {
        setIsLoading(true);
        await audio.play();
        setIsPlaying(true);
        setIsLoading(false);
      } catch (error) {
        console.log('Autoplay prevented by browser or audio failed:', error);
        setIsLoading(false);
        setHasError(false); // Don't mark as error for autoplay prevention
      }
    };

    // Delay autoplay attempt to ensure audio element is ready
    const autoplayTimer = setTimeout(() => {
      if (randomizedPlaylist[currentTrackIndex]) {
        playAudio();
      }
    }, 1000);

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
      clearTimeout(autoplayTimer);
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
    if (!audio || !randomizedPlaylist[currentTrackIndex]) return;

    console.log(`Loading track ${currentTrackIndex}: ${randomizedPlaylist[currentTrackIndex]}`);
    setIsLoading(true);
    setHasError(false);
    
    // Force reload the audio element with new source
    audio.pause();
    audio.currentTime = 0;
    audio.src = randomizedPlaylist[currentTrackIndex];
    audio.load(); // Important: reload the audio element
    
    // Wait for audio to be ready before playing
    const handleCanPlayThrough = async () => {
      try {
        await audio.play();
        setIsPlaying(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to play audio:', error);
        setHasError(true);
        setIsLoading(false);
      }
      // Remove the event listener after use
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
    };

    // Add event listener for when audio is ready to play
    audio.addEventListener('canplaythrough', handleCanPlayThrough);

    // Cleanup function to remove event listener if component unmounts or track changes
    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, [currentTrackIndex, randomizedPlaylist]);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // If there's an error, try to reload and play
    if (hasError) {
      setHasError(false);
      setIsLoading(true);
      audio.load();
      audio.play().catch(() => {
        setHasError(true);
        setIsLoading(false);
      });
      return;
    }
    if (isMuted) {
      audio.volume = 0.15;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  // Handle user interaction to start audio (for browsers that block autoplay)
  const handleUserInteraction = async () => {
    const audio = audioRef.current;
    if (!audio || isPlaying) return;

    // If there's an error, try to reload
    if (hasError) {
      setHasError(false);
      setIsLoading(true);
      audio.load();
    }

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
        preload="metadata"
        loop={false}
        crossOrigin="anonymous"
      />
      
      {/* Mute/Unmute Toggle Button */}
      <button
        onClick={toggleMute}
        onMouseDown={handleUserInteraction} // Trigger user interaction for autoplay
        className={`audio-control fixed bottom-6 left-6 bg-black/60 backdrop-blur-sm border border-white/20 rounded-full p-3 text-white hover:bg-black/80 transition-all duration-300 hover:scale-110 shadow-lg ${hasError ? 'opacity-75 hover:opacity-100' : ''}`}
        style={{
          zIndex: 9999,
          pointerEvents: 'all',
          position: 'fixed',
          cursor: 'pointer'
        }}
        aria-label={hasError ? 'Retry audio' : isMuted ? 'Unmute audio' : 'Mute audio'}
        title={hasError ? 'Click to retry audio' : isMuted ? 'Unmute audio' : 'Mute audio'}
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : hasError ? (
          <VolumeX className="w-6 h-6" />
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