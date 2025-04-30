import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDocument } from '@/context/DocumentContext';
import { 
  Undo, Redo, Bold, Italic, Underline, HelpCircle, Mic, FileType,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Heading1, Heading2, List, ListOrdered, FileText
} from 'lucide-react';
import { ScriptElement, DocumentContent } from '@shared/schema';
import BasicSpeech from '@/lib/basicSpeech';
import { pipeline } from '@xenova/transformers'; // Import pipeline from @xenova/transformers
import './DocumentEditor.css';
import axios from 'axios'; // Add axios for API requests

// Create a singleton instance of our speech recognition
const speechRecognizer = new BasicSpeech();

// Configuration to switch between local LLM and OpenAI
const USE_LOCAL_LLM = true; // Set to true to use the local model exclusively

const DocumentEditor = () => {
  const { 
    documentContent, 
    documentFormat, 
    isRecording, 
    interimText, 
    setIsRecording,
    setInterimText,
    addElement,
    setDocumentContent, 
    updateElement, 
    removeElement,
    addToCommandHistory,
    setDocumentFormat
  } = useDocument();
  
  const contentRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Document formatting type selection
  const [showFormats, setShowFormats] = useState(false);
  const formatClass = documentFormat === 'script' ? 'script-format' : '';
  const [deleteCountdown, setDeleteCountdown] = useState(0); // Countdown state
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for timeout
  const lockInIntervalRef = useRef<NodeJS.Timeout | null>(null); // Ref for the lock-in interval
  const [fontSize, setFontSize] = useState(12); // Default font size in pt
  const [formattingState, setFormattingState] = useState({
    bold: false,
    italic: false,
    underline: false,
    align: 'left'
  });

  const [modelPipeline, setModelPipeline] = useState<any>(null); // State to store the loaded model pipeline
  const [loadingModel, setLoadingModel] = useState(false); // State to track model loading

  // Load the Hugging Face model in the browser
  useEffect(() => {
    const loadModel = async () => {
      setLoadingModel(true);
      console.log("Loading Hugging Face model...");
      try {
        const pipelineInstance = await pipeline('text-generation', 'gpt2'); // Replace 'gpt2' with your model
        setModelPipeline(pipelineInstance);
        console.log("Model loaded successfully!");
      } catch (error) {
        console.error("Error loading model:", error);
      } finally {
        setLoadingModel(false);
      }
    };

    loadModel();
  }, []);

  // Function to generate text using the loaded model
  const generateText = async (prompt: string) => {
    if (!modelPipeline) {
      console.error("Model is not loaded yet."); // Debugging: Log the error
      alert("The model is still loading. Please wait until the model is ready."); // Provide user feedback
      return;
    }

    console.log("Generating text with prompt:", prompt);
    try {
      const output = await modelPipeline(prompt, { max_length: 512 });
      console.log("Generated text:", output);
      const newElements = [...documentContent.elements, { type: 'action', content: output[0]?.generated_text || "No response" }];
      setDocumentContent({ elements: newElements });
    } catch (error) {
      console.error("Error generating text:", error);
    }
  };

  // Ensure microphone starts off
  useEffect(() => {
    // Set up speech recognition callbacks immediately
    speechRecognizer.setCallback((text, isFinal) => {
      if (!isRecording) return;
      if (!text.trim()) return;

      if (isFinal) {
        const newElements = [...documentContent.elements];
        const lastElement = newElements[newElements.length - 1];
        
        if (lastElement && lastElement.type === 'action') {
          lastElement.content += ' ' + text;
        } else {
          newElements.push({ type: 'action' as const, content: text });
        }
        
        setDocumentContent({ elements: newElements });
        setInterimText(null);
      } else {
        setInterimText(text);
      }
    });

    speechRecognizer.setStateChangeCallback((recording) => {
      console.log(`SpeechRecognizer state changed: ${recording ? 'Recording' : 'Stopped'}`);
      setIsRecording(recording);
    });

    // Initialize speech recognition
    if (isRecording) {
      speechRecognizer.start();
    } else {
      speechRecognizer.stop();
    }

    return () => {
      if (speechRecognizer.isRecording()) {
        speechRecognizer.stop();
      }
      setInterimText(null);
    };
  }, [isRecording, setDocumentContent, setInterimText, setIsRecording]);

  // Handle clearing the document
  const clearDocument = () => {
    console.log("Clearing document...");
    setDocumentContent({ elements: [] }); // Clear all elements
    setInterimText(null); // Clear interim text
  };

  // Handle delete button press
  const handleDeletePress = () => {
    console.log("Delete button pressed, starting countdown...");
    setDeleteCountdown(3); // Start countdown
    deleteTimeoutRef.current = setInterval(() => {
      setDeleteCountdown((prev) => {
        if (prev <= 1) {
          clearDocument(); // Clear document when countdown ends
          clearInterval(deleteTimeoutRef.current!); // Clear interval
          return 0;
        }
        return prev - 1; // Decrement countdown
      });
    }, 1000);
  };

  // Handle delete button release
  const handleDeleteRelease = () => {
    console.log("Delete button released, stopping countdown...");
    if (deleteTimeoutRef.current) {
      clearInterval(deleteTimeoutRef.current); // Clear interval
      deleteTimeoutRef.current = null;
    }
    setDeleteCountdown(0); // Reset countdown
  };

  // Toggle recording state
  const toggleRecording = () => {
    const newState = !isRecording;
    setIsRecording(newState);
  };

  // Function to send commands to the LLM (local or OpenAI based on configuration)
  const sendCommandToLLM = async (command: string) => {
    console.log("Sending command to LLM:", command); // Debugging: Log the command being sent
    if (USE_LOCAL_LLM) {
      console.log("Using local LLM exclusively.");
      await sendCommandToLocalLLM(command);
    } else {
      console.log("Using OpenAI as fallback.");
      await sendCommandToOpenAI(command);
    }
  };

  // Function to send commands to the local LLM API
  const sendCommandToLocalLLM = async (command: string) => {
    console.log("Preparing to send command to local LLM API...");
    console.log("Command Payload:", { command }); // Debugging: Log the payload being sent
  
    try {
      const response = await axios.post('http://localhost:5000/process-command', { command }, {
        timeout: 5000, // Set a timeout to detect unresponsive API
      });
      console.log("Raw API Response from local LLM:", response); // Debugging: Log the raw API response
      console.log("Response Headers:", response.headers); // Debugging: Log response headers
      const { result } = response.data;
      console.log("Parsed LLM Response:", result); // Debugging: Log the parsed LLM response
      if (!result) {
        console.warn("Local LLM Response is undefined or empty."); // Debugging: Warn if the response is undefined
        throw new Error("No response from local LLM");
      }
      // Handle the response (e.g., update the document content)
      const newElements = [...documentContent.elements, { type: 'action', content: result }];
      setDocumentContent({ elements: newElements });
    } catch (error) {
      console.error("Error communicating with local LLM API:", error.message); // Debugging: Log the error message
  
      // Log additional error details
      if (error.response) {
        console.error("Local LLM API Error Details:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        }); // Debugging: Log detailed error response
      } else if (error.request) {
        console.error("No response received from local LLM API. Possible connection issue.");
        console.error("Request Details:", error.request); // Debugging: Log the request details
      } else {
        console.error("Unexpected error:", error); // Debugging: Log unexpected errors
      }
  
      // Log the full stack trace for debugging
      console.error("Error Stack Trace:", error.stack);
  
      // Additional debugging: Check network connectivity
      try {
        const connectivityCheck = await axios.get('http://localhost:5000/health-check');
        console.log("Local LLM API Health Check Response:", connectivityCheck.data); // Debugging: Log health check response
      } catch (connectivityError) {
        console.error("Failed to connect to local LLM API during health check:", connectivityError.message);
      }
    }
  };

  // Function to send commands to the OpenAI API (using Chat Completions)
  const sendCommandToOpenAI = async (command: string) => {
    console.log("Sending command to OpenAI API (Chat):", command); // Debugging: Log the command being sent
    try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions', // Changed endpoint
      {
      model: 'gpt-3.5-turbo', // Or another suitable chat model
      messages: [{ role: 'user', content: command }], // Format for chat API
      max_tokens: 512,
      temperature: 0.7,
      },
      {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      }
    );
    console.log("Raw OpenAI API Response (Chat):", response); // Debugging: Log the raw API response
    const result = response.data.choices[0]?.message?.content?.trim(); // Different response structure
    console.log("Parsed OpenAI Response (Chat):", result); // Debugging: Log the parsed OpenAI response
    if (!result) {
      console.warn("OpenAI Chat Response is undefined or empty."); // Debugging: Warn if the response is undefined
    }
    // Handle the response (e.g., update the document content)
    const newElements = [...documentContent.elements, { type: 'action', content: result || "No response from OpenAI" }];
    setDocumentContent({ elements: newElements });
    } catch (error) {
    console.error("Error communicating with OpenAI Chat API:", error.response?.data || error.message); // Debugging: Log detailed error
    if (error.response) {
      console.error("OpenAI Chat API Error Details:", {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data,
      });
    }
    }
  };

  // Example usage: Call this function when a specific command is triggered
  const handleCustomCommand = () => {
    const command = `
    Can you create a quick, formatted basic scene for a movie script? 
    Include all the typical elements such as:
    - A scene heading (e.g., INT. LIVING ROOM - DAY)
    - Action descriptions
    - Character names
    - Dialogue
    - Parentheticals (if necessary)
    - Transitions (if applicable)
    
    Please ensure the scene is formatted correctly and adheres to standard scriptwriting conventions.
    `;
    console.log("Triggering custom command:", command); // Debugging: Log the custom command trigger
    generateText(command);
  };

  // Predefined scriptwriting prompt
  const scriptwritingPrompt = `
You are an expert scriptwriter and assistant. Your task is to transform the following transcription into a professionally formatted script.
Follow standard scriptwriting conventions, ensuring the output includes the following elements:
- **Scene Headings**: Clearly indicate the location and time of day (e.g., INT. LIVING ROOM - DAY).
- **Action Descriptions**: Describe what is happening in the scene in present tense.
- **Character Names**: Clearly identify the speaker before each line of dialogue.
- **Dialogue**: Format spoken lines under the character's name, ensuring clarity and brevity.
- **Parentheticals**: Include brief instructions for how dialogue is delivered (e.g., angrily, softly) if necessary.
- **Transitions**: Add transitions like FADE IN, FADE OUT, or CUT TO where appropriate.

Ensure the script is engaging, clear, and adheres to professional standards. Add any missing details, such as character names, scene descriptions, or formatting, to enhance readability and storytelling.
Here is the transcription to format into a script:
`;

  // Function to handle the scriptwriting prompt
  const handleScriptwritingPrompt = () => {
    console.log("Triggering scriptwriting prompt"); // Debugging: Log the prompt trigger
    sendCommandToLLM(scriptwritingPrompt);
  };

  // Helper to render script elements
  const renderScriptElement = (element: ScriptElement, index: number) => {
    return (
      <span 
        key={index} 
        className={`action ${element.type === 'action' ? 'typing' : ''}`}
        style={{ 
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          display: 'inline'
        }}
      >
        {element.content}
      </span>
    );
  };

  // Scroll to bottom when content changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [documentContent, interimText]);
  
  // Clear interim text when recording stops
  useEffect(() => {
    if (!isRecording && interimText) {
      console.log("Recording stopped, finalizing interim text");
      const newElements = [...documentContent.elements];
      const lastElement = newElements[newElements.length - 1];

      if (lastElement && lastElement.type === 'action') {
        lastElement.content += ' ' + interimText;
      } else {
        newElements.push({ type: 'action' as const, content: interimText });
      }

      setDocumentContent({ elements: newElements });
      setInterimText(null);
    }
  }, [isRecording, interimText, documentContent.elements, setDocumentContent, setInterimText]);

  // Handle export to PDF
  const handleExport = () => {
    const content = documentContent.elements
      .map(element => element.content)
      .join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'script.txt';
    document.body.appendChild(a);

    // Ensure the node is still a child before removing it
    a.click();
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  };

  // Toggle formatting palette
  const [showFormatting, setShowFormatting] = useState(false);

  // Handle formatting commands
  const handleFormatCommand = (command: string, value?: string) => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection) return;

    switch (command) {
      case 'bold':
        document.execCommand('bold', false);
        break;
      case 'italic':
        document.execCommand('italic', false);
        break;
      case 'underline':
        document.execCommand('underline', false);
        break;
      case 'align':
        if (value) {
          document.execCommand('justify' + value.charAt(0).toUpperCase() + value.slice(1), false);
        }
        break;
      case 'fontSize':
        if (value) {
          setFontSize(Number(value));
          if (editorRef.current) {
            editorRef.current.style.fontSize = `${value}pt`;
          }
        }
        break;
    }
  };

  // Handle undo/redo
  const handleUndo = () => {
    if (!editorRef.current) return;
    document.execCommand('undo', false);
  };

  const handleRedo = () => {
    if (!editorRef.current) return;
    document.execCommand('redo', false);
  };

  // Update formatting state when selection changes
  useEffect(() => {
    const updateFormattingState = () => {
      if (!editorRef.current) return;
      
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const parentElement = range.commonAncestorContainer.parentElement;
      
      if (parentElement) {
        setFormattingState({
          bold: window.getComputedStyle(parentElement).fontWeight === '700',
          italic: window.getComputedStyle(parentElement).fontStyle === 'italic',
          underline: window.getComputedStyle(parentElement).textDecoration.includes('underline'),
          align: window.getComputedStyle(editorRef.current).textAlign
        });
      }
    };

    document.addEventListener('selectionchange', updateFormattingState);
    return () => document.removeEventListener('selectionchange', updateFormattingState);
  }, []);

  return (
    <div className="document-editor h-screen flex flex-col overflow-hidden">
      {/* Show loading state while the model is being loaded */}
      {loadingModel && <div className="loading-indicator">Loading model, please wait...</div>}

      {/* Document Content Area */}
      <div 
        className="content-area flex-1 overflow-y-auto" 
        ref={contentRef} 
        style={{ maxHeight: 'calc(100vh - 180px)' }}
      >
        <div 
          ref={editorRef}
          className={`editor ${formatClass}`}
          contentEditable={true}
          suppressContentEditableWarning={true}
          style={{ fontSize: `${fontSize}pt` }}
        >
          {documentContent.elements.map(renderScriptElement)}
          
          {/* Show interim transcription while recording */}
          {isRecording && interimText && (
            <span className="interim-text">
              <span className="pulse-indicator"></span>
              {interimText}
            </span>
          )}

          {/* Empty state message */}
          {documentContent.elements.length === 0 && !interimText && (
            <div className="empty-state">
              <Mic className="icon" />
              <p className="title">Start Speaking or Type Directly</p>
              <p className="description">Click the microphone button at the bottom of the screen to begin dictating your script, or click anywhere in this area to start typing.</p>
              <div className="bounce-indicator">
                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Record Button */}
      <div className="record-button">
        <Button
          onClick={toggleRecording}
          className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-primary hover:bg-primary/90'
          }`}
        >
          <Mic className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Recording Status Bar */}
      <div
        id="recordingStatus"
        className={`status-bar fixed bottom-0 left-0 right-0 ${
          isRecording ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
        } flex-shrink-0 border-t p-2`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {isRecording ? (
              <>
                <span className="inline-block w-3 h-3 rounded-full bg-red-500 animate-pulse mr-2"></span>
                <span className="text-sm font-medium text-red-700">Recording in progress</span>
              </>
            ) : (
              <>
                <span className="inline-block w-3 h-3 rounded-full bg-gray-300 mr-2"></span>
                <span className="text-sm font-medium text-gray-500">Click microphone to start recording</span>
              </>
            )}
          </div>
          <div className="flex items-center text-xs text-red-600">
            {isRecording && (
              <>
                <span className="hidden md:inline">Use commands like </span>
                <Badge className="ml-1 bg-white text-red-600 border-red-200">
                  "Character: John"
                </Badge>
                <Badge className="ml-1 bg-white text-red-600 border-red-200">
                  "Scene: Interior"
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add a button to trigger the custom command for testing */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-2">
        <Button 
          onClick={handleCustomCommand} 
          className={`test-command-button bg-blue-500 hover:bg-blue-600 text-white`}
          disabled={loadingModel} // Disable button while model is loading
        >
          {loadingModel ? "Loading Model..." : "Test LLM Command"}
        </Button>
        <Button 
          onClick={handleScriptwritingPrompt} 
          className="scriptwriting-prompt-button bg-green-500 hover:bg-green-600 text-white"
          disabled={loadingModel} // Disable button while model is loading
        >
          {loadingModel ? "Loading Model..." : "Script Formatting Prompt"}
        </Button>
      </div>
    </div>
  );
};

export default DocumentEditor;