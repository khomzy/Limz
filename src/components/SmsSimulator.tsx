import { useEffect, useState } from 'react';
import { Check, Send, Volume2, Shield } from 'lucide-react';

interface SmsSimulatorProps {
  sms: {
    to: string;
    patientName: string;
    text: string;
  } | null;
  onClose: () => void;
}

export default function SmsSimulator({ sms, onClose }: SmsSimulatorProps) {
  const [visible, setVisible] = useState(false);
  const [timeStr, setTimeStr] = useState('');

  // Format local clock for the smartphone status bar
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 60000);
    return () => clearInterval(interval);
  }, []);

  // Trigger sound effect and slide-in transition
  useEffect(() => {
    if (sms) {
      setVisible(true);
      
      // Play a standard double-chime SMS notification using Web Audio API
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // First note
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gain1.gain.setValueAtTime(0, audioCtx.currentTime);
        gain1.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
        gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start();
        osc1.stop(audioCtx.currentTime + 0.4);

        // Second note (slightly delayed, higher pitch)
        setTimeout(() => {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1046.5, audioCtx.currentTime); // C6
          gain2.gain.setValueAtTime(0, audioCtx.currentTime);
          gain2.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
          gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.start();
          osc2.stop(audioCtx.currentTime + 0.45);
        }, 150);

      } catch (e) {
        console.warn('Web Audio API not supported or blocked by user gesture:', e);
      }
    } else {
      setVisible(false);
    }
  }, [sms]);

  if (!sms) return null;

  return (
    <div className={`sms-simulator-overlay ${visible ? 'slide-up' : 'slide-down'}`}>
      <div className="phone-body">
        {/* Phone Speaker & Camera Notch */}
        <div className="phone-notch">
          <div className="speaker"></div>
          <div className="camera"></div>
        </div>

        {/* Phone Screen */}
        <div className="phone-screen">
          {/* Status Bar */}
          <div className="phone-status-bar">
            <span className="phone-time">{timeStr}</span>
            <div className="phone-status-icons">
              <span className="battery">88%</span>
              <span className="network">📶 4G</span>
            </div>
          </div>

          {/* Messaging App Header */}
          <div className="phone-app-header">
            <div className="avatar">ZT</div>
            <div className="app-contact">
              <span className="contact-name">AfricasTalking Gateway</span>
              <span className="contact-status">online (Zingwangwa LIMS)</span>
            </div>
          </div>

          {/* Message List */}
          <div className="phone-message-body">
            <div className="sms-disclaimer">
              <Shield size={12} className="shield-icon" />
              <span>End-to-end encrypted notification</span>
            </div>

            {/* Inbound message bubble */}
            <div className="sms-bubble inbound fade-in">
              <div className="sms-text">{sms.text}</div>
              <div className="sms-time">Just now</div>
            </div>

            {/* Simulating phone read confirmation */}
            <div className="sms-status">
              <Check size={14} className="double-check-icon" />
              <span>Delivered to {sms.to}</span>
            </div>
          </div>

          {/* Input Panel */}
          <div className="phone-input-panel">
            <input type="text" placeholder="Text message" disabled />
            <button className="send-btn" disabled>
              <Send size={14} />
            </button>
          </div>
        </div>

        {/* Home Indicator bar */}
        <div className="home-bar" onClick={onClose}></div>
        
        {/* Close Button / Simulator Controls */}
        <button className="simulator-close-btn" onClick={onClose}>
          Dismiss Simulator
        </button>
      </div>

      <div className="simulator-label">
        <Volume2 size={14} className="icon-pulse" />
        <span>SMS Simulator (AfricasTalking API Output)</span>
      </div>
    </div>
  );
}
