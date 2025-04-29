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
  const [formattingState, setFormattingState] = useState({
    bold: false,
    italic: false,
    underline: false,
    align: 'left'
  });

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
    a.click();
    document.body.removeChild(a);
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