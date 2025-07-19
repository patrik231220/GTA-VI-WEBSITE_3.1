import React, { useState, useEffect } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import BackgroundSlideshow from './components/BackgroundSlideshow';
import AudioPlayer from './components/AudioPlayer';

function App() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  const [prevTimeLeft, setPrevTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  const [vhsStates, setVhsStates] = useState({
    days: false,
    hours: false,
    minutes: false,
    seconds: false
  });
  
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Calculate time until Tuesday, May 26 at 12:00 AM GMT+2
  useEffect(() => {
    const targetDate = new Date('2026-05-26T00:00:00+02:00').getTime();
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;
      
      if (difference > 0) {
        const newTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        };
        
        // Check for changes and trigger glitch effects
        setTimeLeft(prevTime => {
          const changes = {
            days: newTimeLeft.days !== prevTime.days,
            hours: newTimeLeft.hours !== prevTime.hours,
            minutes: newTimeLeft.minutes !== prevTime.minutes,
            seconds: newTimeLeft.seconds !== prevTime.seconds
          };
          
          // Trigger glitch animations for changed units
          if (changes.days || changes.hours || changes.minutes || changes.seconds) {
            setVhsStates(changes);
            
            // Reset glitch states after animation duration
            setTimeout(() => {
              setVhsStates({
                days: false,
                hours: false,
                minutes: false,
                seconds: false
              });
            }, 100);
          }
          
          setPrevTimeLeft(prevTime);
          return newTimeLeft;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  const handleSecureSubmit = async (isRetry = false) => {
    if (!isRetry) {
      setRetryCount(0);
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Enhanced fetch with timeout and retry logic
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch("https://connect.mailerlite.com/api/subscribers", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0IiwianRpIjoiMzFkOWI5ZjZkZmQ5ZjU5MmZiMTAxYmFmNGE3NTc0NWEzOWU5NGQwNDY2MGQxYzgxNTRjN2Y3ZTEwNmEyZTg5YmJhMTQxZDY3MTRlZjI2OTYiLCJpYXQiOjE3NTI3OTY5MTQuODgzMTA2LCJuYmYiOjE3NTI3OTY5MTQuODgzMTA4LCJleHAiOjQ5MDg0NzA1MTQuODc5NzQ5LCJzdWIiOiIxNjgyNDgxIiwic2NvcGVzIjpbXX0.xLQBeuHVAaUCA-8W5-LBN-_0VegmwyrKyM6dLyHVpR3xau_g8ojsQswEhplOs1dOlK0fjsMArEOUvRwH7vtyP9plJ5QfxD8_8B1Kd441c-gV_VcR56n1hwQDp7cz5XWE9vvKALNh2iqsE-gHb7RvKEy64vmUecyBlBJBylAfqq6PUxamgLhmvrU5nvmCr-VssoeaSiPiqKvPUyUo3p_vC_zRONXg3qVviLrsMm_rEPvB6blC5xc0Zr6U6vcRoBHHrMMjj6UxJOLDhKMECukGBvM9mHXZR41ywwOWM02P2EGFCiinmD28ekoK8MUmL9y7pzUMR525NoOg6apC2jhdlzhapHenq0CfIWxoGrFkDZXAGJQhROwUbCRI6Pd3WDPehmE28Ok1fC15EUyRNG3A5YxtNaoSI7G-NVo6lga2Pit6vqh99Ueyhza_SfMkLeNw6WApYaMdKW0dqsiIcQvXBWsQW4xKKBQUGzqNwHPzfxJHrq4h9kPfoprqvIehnhbUZVOpdn6GdCKEWacGTndCxNIAFwoxqXWs7rJOmZ-XpC_sPZbw61EtOb14KL0iNVPHL9wFeuLnBVZMBxyiK8h0oYd9YulkC81dAE9JnhVS6LiG9g69HrgVaMMgcjwgCN35aiGwww337XXFkwMeqnMwE0FaIzBmSmosAkUdte3xIjM',
          'Accept': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          email: email.trim(),
          fields: {
            name: firstName.trim()
          },
          groups: ["160072846854325674"], // Add group IDs if you want to assign to specific groups
          status: 'active'
        })
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('MailerLite submission successful:', result);
      
      setIsSubmitted(true);
      setRetryCount(0);
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Implement retry logic for network errors
      if ((error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch'))) && retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          handleSecureSubmit(true);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        setSubmitError(`Connection issue. Retrying... (${retryCount + 1}/${maxRetries})`);
      } else {
        setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toString().padStart(2, '0');
  };

  return (
    <BackgroundSlideshow>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        {/* Main Content */}
        <div className="text-center w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-5xl mx-auto space-y-6 sm:space-y-8">
          {/* Main Headline - Replace with Logo */}
          <div className="flex items-center justify-center logo-container mb-4 sm:mb-6">
            <img 
              src="/TRANSPARENT_LOGO/GTA-6-Logo-PNG-from-Grand-Theft-Auto-VI-Transparent.png"
              alt="Grand Theft Auto VI Logo"
              className="max-h-[15vh] sm:max-h-[18vh] md:max-h-[20vh] w-auto object-contain"
              loading="eager"
              decoding="async"
            />
          </div>

          {/* Countdown Timer */}
          <div className="my-8 sm:my-10 md:my-12">
            <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-6 lg:gap-8 max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
              {[
                { value: timeLeft.days, label: 'DAYS', vhs: vhsStates.days, vhsClass: 'vhs-days' },
                { value: timeLeft.hours, label: 'HRS', vhs: vhsStates.hours, vhsClass: 'vhs-hours' },
                { value: timeLeft.minutes, label: 'MIN', vhs: vhsStates.minutes, vhsClass: 'vhs-minutes' },
                { value: timeLeft.seconds, label: 'SEC', vhs: vhsStates.seconds, vhsClass: 'vhs-seconds' }
              ].map((unit, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className={`countdown-digit bg-black/60 backdrop-blur-sm rounded-lg p-2 sm:p-3 md:p-4 lg:p-6 mb-2 sm:mb-3 border border-red-500/40 shadow-2xl w-full aspect-square flex items-center justify-center ${unit.vhs ? unit.vhsClass : ''}`}>
                    <div className="text-lg sm:text-xl md:text-3xl lg:text-4xl xl:text-5xl font-pixel leading-none tracking-wider transform transition-all duration-300 hover:scale-105 digit-glow pixel-perfect" style={{ 
                      color: '#FF0000',
                      imageRendering: 'pixelated',
                      textRendering: 'geometricPrecision'
                    }}>
                      {formatNumber(unit.value)}
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm md:text-base font-semibold text-white tracking-widest enhanced-text-visibility">
                    {unit.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subtitle */}
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight mb-3 sm:mb-4 enhanced-text-visibility px-2" style={{ 
            color: '#FFFFFF'
          }}>
            <span className="neon-highlight-primary">EXCLUSIVE</span> GTA VI <span className="neon-highlight-secondary">Countdown Clock</span>
          </h2>

          {/* Subheading */}
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl leading-snug mb-4 sm:mb-6 -mt-1 enhanced-text-visibility px-2" style={{ 
            color: '#FFFFFF'
          }}>
            The <span className="neon-highlight-secondary">PREMIUM</span> Collector's Item for <span className="neon-highlight-primary">True GTA Fans</span>
          </h3>

          {/* Action Buttons */}
          <div className="space-y-4 w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto px-2">
            {/* Frosted Glass Card */}
            <div className="frosted-glass-card">
            {!isSubmitted ? (
              <>
                {/* Email Input Form */}
                <form onSubmit={handleEmailSubmit} className="space-y-3 sm:space-y-4">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    required
                    autoComplete="given-name"
                    className="retro-input w-full px-4 sm:px-6 py-3 sm:py-4 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/70 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-400/30 transition-all duration-300 text-center text-sm sm:text-base enhanced-text-visibility min-h-[48px]"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    autoComplete="email"
                    className="retro-input w-full px-4 sm:px-6 py-3 sm:py-4 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/70 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-400/30 transition-all duration-300 text-center text-sm sm:text-base enhanced-text-visibility min-h-[48px]"
                  />
                
                  {/* Secure Button */}
                  <button
                  onClick={handleSecureSubmit}
                  disabled={isSubmitting || !email.trim() || !firstName.trim()}
                  className="retro-button w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 button-glow enhanced-text-visibility heartbeat-animation text-sm sm:text-base lg:text-lg font-bold min-h-[48px] touch-manipulation"
                  >
                  {isSubmitting ? (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="text-center">CLAIM YOUR CLOCK NOW →</span>
                    </>
                  )}
                  </button>
                </form>
                
                {/* Error Message */}
                {submitError && (
                  <div className={`backdrop-blur-sm border rounded-lg p-4 text-center mt-3 ${
                    retryCount > 0 ? 'bg-yellow-500/30 border-yellow-400/40' : 'bg-red-500/30 border-red-400/40'
                  }`}>
                    <p className="text-sm sm:text-base text-white enhanced-text-visibility">
                      {submitError}
                    </p>
                    {retryCount > 0 && (
                      <p className="text-xs sm:text-sm text-white/80 mt-1">
                        Automatically retrying connection...
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-green-500/30 backdrop-blur-sm border border-green-400/40 rounded-lg p-4 sm:p-6 text-center">
                <Check className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 mx-auto mb-2 sm:mb-3" />
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-2 enhanced-text-visibility leading-tight">You're In!</h3>
                <p className="text-sm sm:text-base text-white enhanced-text-visibility leading-relaxed">
                  Welcome to the exclusive pre-order list. We'll notify you when the GTA VI Countdown Clock becomes available.
                </p>
              </div>
            )}
          </div>
          </div>

          {/* Bottom Text */}
          <div className="text-center w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-3xl mx-auto px-2">
            <p className="text-sm sm:text-base md:text-lg text-white enhanced-text-visibility leading-relaxed mb-3 sm:mb-4">
              Be among the <span className="neon-highlight-primary">FIRST 300 FANS</span> to secure your <span className="neon-highlight-secondary">EXCLUSIVE GTA VI</span> collector's countdown clock. Reserve your <span className="underline decoration-white">piece of gaming history</span> now!
            </p>
            
            {/* Scarcity Reminder */}
            <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold enhanced-text-visibility mt-3 sm:mt-4 mb-4 sm:mb-5 leading-snug text-white">
              <span className="neon-highlight-warning">LIMITED AVAILABILITY</span> – just <span className="font-pixel digit-glow pixel-perfect" style={{ 
                color: '#FF0000',
                imageRendering: 'pixelated',
                textRendering: 'geometricPrecision'
              }}>{timeLeft.days} days</span> until GTA VI launches!
            </p>
            
            {/* Trust Indicators */}
            <div className="text-center">
              <p className="text-xs sm:text-sm text-white enhanced-text-visibility leading-normal opacity-90">
                Premium Quality • Limited Edition • Worldwide Shipping • Satisfaction Guaranteed
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Audio Player */}
      <AudioPlayer />
    </BackgroundSlideshow>
  );
}

export default App;