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
import './DocumentEditor.css';

// Create a singleton instance of our speech recognition
const speechRecognizer = new BasicSpeech();

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

  // Ensure microphone starts off
  useEffect(() => {
    setIsRecording(false); // Ensure recording is off initially
    speechRecognizer.stop(); // Ensure recognizer is not running
  }, [setIsRecording]);

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
    
    if (newState) {
      speechRecognizer.start();
    } else {
      speechRecognizer.stop();
    }
  };

  // Set up basic speech recognition when component mounts
  useEffect(() => {
    console.log("Initializing speechRecognizer...");

    // Process speech results
    speechRecognizer.setCallback((text, isFinal) => {
      if (!isRecording) return;

      if (!text.trim()) return;

      if (isFinal) {
        // For final text, add it to the document
        setDocumentContent((prev) => {
          const elements = [...prev.elements];
          const lastElement = elements[elements.length - 1];
          
          // If the last element is an action, append to it
          if (lastElement && lastElement.type === 'action') {
            lastElement.content += ' ' + text;
            return { ...prev, elements };
          }
          
          // Otherwise create a new element
          return {
            ...prev,
            elements: [...elements, { type: 'action', content: text }]
          };
        });
        setInterimText(null);
      } else {
        // For interim text, update it immediately
        setInterimText(text);
      }
    });

    speechRecognizer.setStateChangeCallback((recording) => {
      console.log(`SpeechRecognizer state changed: ${recording ? 'Recording' : 'Stopped'}`);
    });

    return () => {
      if (speechRecognizer.isRecording()) {
        speechRecognizer.stop();
      }
      setInterimText(null);
    };
  }, [isRecording, setDocumentContent, setInterimText]);

  useEffect(() => {
    if (isRecording) {
      lockInIntervalRef.current = setInterval(() => {
        setInterimText((prev) => {
          if (prev) {
            setDocumentContent((prevContent) => {
              const elements = [...prevContent.elements];
              const lastElement = elements[elements.length - 1];

              if (lastElement && lastElement.type === 'interim') {
                lastElement.type = 'action';
              } else {
                elements.push({ type: 'action', content: prev });
              }

              return { ...prevContent, elements };
            });

            return null;
          }
          return prev;
        });
      }, 2000);
    } else {
      if (lockInIntervalRef.current) {
        clearInterval(lockInIntervalRef.current);
        lockInIntervalRef.current = null;
      }
    }

    return () => {
      if (lockInIntervalRef.current) {
        clearInterval(lockInIntervalRef.current);
        lockInIntervalRef.current = null;
      }
    };
  }, [isRecording, setDocumentContent, setInterimText]);

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
      console.log("Recording stopped, clearing interim text");
      setInterimText(null);
    }
  }, [isRecording, interimText, setInterimText]);

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
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Toggle formatting palette
  const [showFormatting, setShowFormatting] = useState(false);

  return (
    <div className="document-editor h-screen flex flex-col overflow-hidden">
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
    </div>
  );
};

export default DocumentEditor;