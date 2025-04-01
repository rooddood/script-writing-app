/**
 * ULTRA-BASIC SPEECH RECOGNITION
 * Direct implementation of the Web Speech API with minimal complexity
 */

import { ScriptElement } from '@shared/schema';

export default class BasicSpeech {
  private recognition: any;
  private isListening: boolean = false;
  private callback: (text: string, isFinal: boolean) => void = () => {};
  private stateChange: (isRecording: boolean) => void = () => {};
  
  constructor() {
    // Initialize the speech recognition API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser");
      return;
    }
    
    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true; // Keep recording
      this.recognition.interimResults = true; // Show results as they come in
      this.recognition.lang = 'en-US';
      
      // Set up the basic event handlers
      this.recognition.onresult = this.handleResult.bind(this);
      this.recognition.onend = this.handleEnd.bind(this);
      this.recognition.onerror = this.handleError.bind(this);
      
      console.log("Speech recognition initialized successfully");
    } catch (error) {
      console.error("Failed to initialize speech recognition:", error);
    }
  }
  
  // Process speech recognition results
  private handleResult(event: any) {
    // Safety check
    if (!event.results) return;
    
    // Process the latest result
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (!result || !result[0]) continue;
      
      const transcript = result[0].transcript.trim();
      const isFinal = result.isFinal;
      
      if (!transcript) continue;
      
      console.log(`Speech result [${isFinal ? 'FINAL' : 'interim'}]: "${transcript}"`);
      
      // Pass the result to the callback function
      this.callback(transcript, isFinal);
    }
  }
  
  // Handle when speech recognition ends unexpectedly
  private handleEnd() {
    console.log("Speech recognition ended");
    
    // If we're still supposed to be listening, restart it
    if (this.isListening) {
      console.log("Still listening, restarting...");
      
      setTimeout(() => {
        try {
          this.recognition.start();
          console.log("Restarted speech recognition");
        } catch (error) {
          console.error("Failed to restart speech recognition:", error);
          this.isListening = false;
          this.stateChange(false);
        }
      }, 250); // Short delay to avoid browser issues
    }
  }
  
  // Handle speech recognition errors
  private handleError(event: any) {
    console.error("Speech recognition error:", event.error);
    
    if (event.error === 'not-allowed') {
      console.error("Microphone permission denied");
      this.isListening = false;
      this.stateChange(false);
    }
  }
  
  // Set the callback function for speech results
  public setCallback(callback: (text: string, isFinal: boolean) => void) {
    this.callback = callback;
  }
  
  // Set the callback function for state changes
  public setStateChangeCallback(callback: (isRecording: boolean) => void) {
    this.stateChange = callback;
    // Immediately send current state
    callback(this.isListening);
  }
  
  // Start listening for speech
  public start() {
    if (this.isListening) {
      console.log("Already listening");
      return;
    }
    
    if (!this.recognition) {
      console.error("Speech recognition not initialized");
      return;
    }
    
    try {
      console.log("Starting speech recognition");
      this.recognition.start();
      this.isListening = true;
      this.stateChange(true);
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
    }
  }
  
  // Stop listening for speech
  public stop() {
    if (!this.isListening) return;
    
    console.log("Stopping speech recognition");
    
    try {
      this.recognition.stop();
      this.isListening = false;
      this.stateChange(false);
    } catch (error) {
      console.error("Failed to stop speech recognition:", error);
    }
  }
  
  // Toggle between starting and stopping
  public toggle() {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }
  
  // Get the current state
  public isRecording(): boolean {
    return this.isListening;
  }
}