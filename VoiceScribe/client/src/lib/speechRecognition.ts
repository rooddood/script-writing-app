import { DocumentFormat, ScriptElement } from '@shared/schema';

// Type definitions for callbacks
export type RecognitionResultCallback = (element: ScriptElement | null, isFinal: boolean) => void;
export type RecognitionStateCallback = (isRecording: boolean) => void;
export type RecognitionErrorCallback = (error: string) => void;

// Define SpeechRecognition interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

/**
 * MOST BASIC WORKING SPEECH RECOGNITION
 * 
 * Ultra-simple implementation - just plain vanilla Web Speech API
 * with native continuous mode. No fancy chaining, transitions, or watchdogs.
 */
class BasicSpeechRecognition {
  private recognition: any = null;
  private isRecording: boolean = false;
  private format: DocumentFormat = 'script';
  
  // Callbacks
  private onResult: RecognitionResultCallback = () => {};
  private onStateChange: RecognitionStateCallback = () => {};
  private onError: RecognitionErrorCallback = () => {};
  
  constructor() {
    this.createRecognitionInstance();
    console.log("MOST BASIC speech recognition initialized");
  }
  
  private createRecognitionInstance() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser");
      return;
    }
    
    try {
      // Create a new instance and configure it
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;  // THIS IS CRITICAL! USE BUILT-IN CONTINUOUS MODE
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      
      // Set up event handlers
      this.recognition.onresult = (event: any) => {
        if (!event.results) return;
        
        try {
          // Process all results
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (!result || !result[0]) continue;
            
            const transcript = result[0].transcript.trim();
            const isFinal = result.isFinal;
            
            if (!transcript) continue;
            
            console.log(`SPEECH: ${isFinal ? 'FINAL' : 'interim'}: "${transcript}"`);
            
            // Process the text
            if (isFinal) {
              // Basic command detection
              let type = 'action';  // Default type
              let content = transcript;
              
              if (transcript.toLowerCase().startsWith("scene:")) {
                type = 'scene-heading';
                content = transcript.split(':')[1]?.trim() || transcript;
              }
              else if (transcript.toLowerCase().startsWith("character:")) {
                type = 'character';
                content = transcript.split(':')[1]?.trim() || transcript;
              }
              else if (transcript.toLowerCase().startsWith("dialogue:")) {
                type = 'dialogue';
                content = transcript.split(':')[1]?.trim() || transcript;
              }
              else if (transcript.toLowerCase().startsWith("transition:")) {
                type = 'transition';
                content = transcript.split(':')[1]?.trim() || transcript;
              }
              
              // Send the result to the callback
              const element = {
                type: type as 'scene-heading' | 'action' | 'character' | 'parenthetical' | 'dialogue' | 'transition',
                content: content
              };
              
              console.log("ADDING TEXT:", element);
              this.onResult(element, true);
            } 
            else {
              // Just pass interim results through
              this.onResult({ type: 'action', content: transcript }, false);
            }
          }
        } catch (error) {
          console.error("Error processing results:", error);
        }
      };
      
      // Error handler
      this.recognition.onerror = (event: any) => {
        console.error("Speech error:", event.error);
        
        // Only show serious errors
        if (event.error !== 'no-speech') {
          this.onError(`Speech error: ${event.error}`);
        }
        
        // Stop for permission errors
        if (event.error === 'not-allowed' || event.error === 'audio-capture') {
          this.stop();
        }
      };
      
      // End handler
      this.recognition.onend = () => {
        console.log("Recognition ended");
        
        // If we're still supposed to be recording but it stopped, restart it
        if (this.isRecording) {
          console.log("Restarting recognition after unexpected end");
          setTimeout(() => {
            if (this.isRecording) {
              try {
                this.recognition.start();
                console.log("Restarted successfully");
              } catch (error) {
                console.error("Error restarting:", error);
                this.isRecording = false;
                this.onStateChange(false);
              }
            }
          }, 300);
        }
      };
      
      console.log("Speech recognition instance created");
    } catch (error) {
      console.error("Error creating speech recognition:", error);
    }
  }
  
  /**
   * Set callbacks
   */
  public setCallbacks(
    onResult: RecognitionResultCallback,
    onStateChange: RecognitionStateCallback,
    onError: RecognitionErrorCallback
  ) {
    this.onResult = onResult;
    this.onStateChange = onStateChange;
    this.onError = onError;
  }
  
  /**
   * Set format
   */
  public setFormat(format: DocumentFormat) {
    this.format = format;
  }
  
  /**
   * Start recognition
   */
  public start() {
    if (this.isRecording) {
      console.log("Already recording");
      return;
    }
    
    if (!this.recognition) {
      this.createRecognitionInstance();
      if (!this.recognition) {
        this.onError("Speech recognition not available");
        return;
      }
    }
    
    try {
      console.log("Starting recognition - BASIC CONTINUOUS MODE");
      this.recognition.start();
      this.isRecording = true;
      this.onStateChange(true);
    } catch (error) {
      console.error("Error starting recognition:", error);
      
      // Try once more after recreating
      try {
        this.createRecognitionInstance();
        this.recognition.start();
        this.isRecording = true;
        this.onStateChange(true);
      } catch (finalError) {
        console.error("Final error starting recognition:", finalError);
        this.onError("Could not start speech recognition");
        this.isRecording = false;
        this.onStateChange(false);
      }
    }
  }
  
  /**
   * Stop recognition
   */
  public stop() {
    if (!this.isRecording) return;
    
    console.log("Stopping recognition");
    this.isRecording = false;
    this.onStateChange(false);
    
    try {
      this.recognition.stop();
    } catch (error) {
      console.error("Error stopping recognition:", error);
    }
  }
  
  /**
   * Toggle recognition
   */
  public toggle() {
    console.log("Toggle called, current state:", this.isRecording);
    if (this.isRecording) {
      this.stop();
    } else {
      this.start();
    }
  }
}

// Create and export a singleton instance
export const speechRecognition = new BasicSpeechRecognition();