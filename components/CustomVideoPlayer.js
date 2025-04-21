import { useState, useRef, useEffect, useCallback } from "react";
import {
  FaPlay,
  FaPause,
  FaRedo,
  FaUndo,
  FaExpand,
  FaCompress,
  FaVolumeUp,
  FaVolumeMute,
} from "react-icons/fa";

const CustomVideoPlayer = ({ file }) => {
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const controlsRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const inactivityTimeout = useRef(null);

  // Function to show controls and reset timeout
  const resetInactivityTimer = () => {
    setControlsVisible(true);

    clearTimeout(inactivityTimeout.current);
    inactivityTimeout.current = setTimeout(() => {
      if (!videoRef.current.paused) {
        setControlsVisible(false);
      }
    }, 3000);
  };
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const formatTime = (time) => {
    const hrs = Math.floor(time / 3600);
    const mins = Math.floor((time % 3600) / 60);
    const secs = Math.floor(time % 60);
    return `${hrs > 0 ? hrs + ":" : ""}${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleProgress = () => {
    setCurrentTime(videoRef.current.currentTime);
    setProgress(
      (videoRef.current.currentTime / videoRef.current.duration) * 100
    );
  };

  const handleLoadedMetadata = () => {
    setDuration(videoRef.current.duration);
  };
  const changeVolume = useCallback(
    (delta) => {
      let newVolume = Math.min(1, Math.max(0, volume + delta));
      setVolume(newVolume);
      if (videoRef.current) {
        videoRef.current.volume = newVolume;
        setMuted(newVolume === 0);
      }
    },
    [volume]
  );

  const toggleMute = useCallback(() => {
    setMuted((prevMuted) => {
      const newMuted = !prevMuted;
      if (videoRef.current) videoRef.current.muted = newMuted;
      return newMuted;
    });
  }, []);

  // Hide controls after inactivity
  useEffect(() => {
    resetInactivityTimer();
    document.addEventListener("mousemove", resetInactivityTimer);
    document.addEventListener("touchstart", resetInactivityTimer);
    document.addEventListener("keydown", resetInactivityTimer);

    return () => {
      document.removeEventListener("mousemove", resetInactivityTimer);
      document.removeEventListener("touchstart", resetInactivityTimer);
      document.removeEventListener("keydown", resetInactivityTimer);
      clearTimeout(inactivityTimeout.current);
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!videoRef.current) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowleft":
        case "j":
          e.preventDefault();
          handleRewind();
          break;
        case "arrowright":
        case "l":
          e.preventDefault();
          handleForward();
          break;
        case "arrowup":
          e.preventDefault();
          changeVolume(0.1);
          break;
        case "arrowdown":
          e.preventDefault();
          changeVolume(-0.1);
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [changeVolume, toggleMute]); // ✅ now includes dependencies

  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const handleRewind = () => {
    videoRef.current.currentTime = Math.max(
      0,
      videoRef.current.currentTime - 5
    );
  };

  const handleForward = () => {
    videoRef.current.currentTime = Math.min(
      videoRef.current.duration,
      videoRef.current.currentTime + 5
    );
  };

  const handleSpeedChange = (e) => {
    setSpeed(e.target.value);
    videoRef.current.playbackRate = parseFloat(e.target.value);
  };

  const handleVolumeChange = (e) => {
    setVolume(e.target.value);
    videoRef.current.volume = e.target.value;
    setMuted(e.target.value == 0);
  };

  const handleSeek = (e) => {
    const newTime =
      (e.nativeEvent.offsetX / progressRef.current.offsetWidth) *
      videoRef.current.duration;
    videoRef.current.currentTime = newTime;
    setProgress((newTime / videoRef.current.duration) * 100);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (videoRef.current.parentElement.requestFullscreen) {
        videoRef.current.parentElement.requestFullscreen();
      }
      setFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setFullscreen(false);
    }
  };

  return (
    <div className="relative w-full group bg-black rounded-lg overflow-hidden">
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleProgress}
        onLoadedMetadata={handleLoadedMetadata} // Get video duration
      >
        <source src={file.url} type={`video/${file.url.split(".").pop()}`} />
        Your browser does not support the video tag.
      </video>

      {/* Controls */}
      <div
        ref={controlsRef}
        className={`absolute bottom-0 left-0 right-0 p-3 bg-black/70 text-white transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Seek Bar */}
        <div
          ref={progressRef}
          className="h-1 bg-gray-500 cursor-pointer relative rounded hover:h-2 transition-all mx-2"
          onClick={handleSeek}
        >
          {/* Progress Bar */}
          <div
            className="h-1 bg-[#00ACC1] rounded transition-all relative"
            style={{ width: `${progress}%` }}
          >
            {/* Progress Indicator (Balloon Tip) */}
            <div className="w-3 h-3 bg-[#00838F] rounded-full absolute -right-1 top-1/2 transform -translate-y-1/2"></div>
          </div>
        </div>

        {/* Video Time Display */}
        <div className="flex justify-between text-sm text-gray-300 mt-1 px-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Buttons & Controls */}
        <div className="flex justify-between items-center mt-2 px-2">
          {/* Left Controls */}
          <div className="flex space-x-4">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="text-2xl hover:text-[#00ACC1] transition"
            >
              {playing ? <FaPause /> : <FaPlay />}
            </button>

            {/* Rewind 5s */}
            <button
              onClick={handleRewind}
              className="text-xl hover:text-[#00ACC1] transition"
            >
              <FaUndo />
            </button>

            {/* Forward 5s */}
            <button
              onClick={handleForward}
              className="text-xl hover:text-[#00ACC1] transition"
            >
              <FaRedo />
            </button>

            {/* Volume */}
            <button
              onClick={toggleMute}
              className="text-xl hover:text-[#00ACC1] transition"
            >
              {muted ? <FaVolumeMute /> : <FaVolumeUp />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 hidden sm:block"
            />
          </div>

          {/* Right Controls */}
          <div className="flex space-x-4">
            {/* Speed Control */}
            <select
              value={speed}
              onChange={handleSpeedChange}
              className="bg-black text-white border border-gray-500 px-2 py-1 rounded"
            >
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-xl hover:text-[#00ACC1] transition"
            >
              {fullscreen ? <FaCompress /> : <FaExpand />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
