import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDocument } from '@/context/DocumentContext';
import { 
  Undo, Redo, Bold, Italic, Underline, HelpCircle, Mic, FileType,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Heading1, Heading2, List, ListOrdered
} from 'lucide-react';
import { ScriptElement } from '@shared/schema';
import BasicSpeech from '@/lib/basicSpeech';

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
    addToCommandHistory
  } = useDocument();
  
  const contentRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Document formatting type selection
  const [showFormats, setShowFormats] = useState(false);
  const formatClass = documentFormat === 'script' ? 'script-format' : '';
  const [deleteCountdown, setDeleteCountdown] = useState(0); // Countdown state
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for timeout

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
    console.log("Toggle recording called");

    // Toggle the recording state only on button click
    setIsRecording((prev) => {
      const newState = !prev;
      if (newState) {
        speechRecognizer.start(); // Start recording
        console.log("Microphone turned ON");
      } else {
        speechRecognizer.stop(); // Stop recording
        console.log("Microphone turned OFF");
      }
      return newState;
    });
  };

  // Set up basic speech recognition when component mounts
  useEffect(() => {
    // Debugging: Ensure speechRecognizer is initialized
    console.log("Initializing speechRecognizer...");

    // Process speech results
    speechRecognizer.setCallback((text, isFinal) => {
      console.log(`SpeechRecognizer callback triggered. Text: "${text}", Final: ${isFinal}`);

      if (!text.trim()) {
        console.warn("SpeechRecognizer returned empty or whitespace text. Skipping...");
        return; // Skip empty results
      }

      if (isFinal) {
        // Process final speech results
        let type = 'action'; // Default type
        let content = text;

        console.log(`Processing final text: "${text}"`);

        // Basic command detection
        if (text.toLowerCase().startsWith("scene:")) {
          type = 'scene-heading';
          content = text.substring(6).trim();
        } else if (text.toLowerCase().startsWith("character:")) {
          type = 'character';
          content = text.substring(10).trim();
        } else if (text.toLowerCase().startsWith("dialogue:")) {
          type = 'dialogue';
          content = text.substring(9).trim();
        } else if (text.toLowerCase().startsWith("transition:")) {
          type = 'transition';
          content = text.substring(11).trim();
        }

        const element: ScriptElement = {
          type: type as any,
          content: content || text,
        };

        console.log("Adding element to document:", element);

        // Replace the interim element with the finalized element
        setDocumentContent((prev) => ({
          ...prev,
          elements: prev.elements.map((el) =>
            el.type === 'interim' ? element : el
          ),
        }));

        // Add to command history if needed
        if (element.type !== 'action' && element.type !== 'dialogue') {
          addToCommandHistory(element.type, element.content);
        }

        // Clear interim text
        setInterimText(null);
      } else {
        // For interim results, update the existing interim element or add a new one
        console.log(`Interim text: "${text}"`);
        setInterimText(text);

        setDocumentContent((prev) => {
          const existingInterimIndex = prev.elements.findIndex((el) => el.type === 'interim');
          if (existingInterimIndex !== -1) {
            // Update the existing interim element
            const updatedElements = [...prev.elements];
            updatedElements[existingInterimIndex] = {
              ...updatedElements[existingInterimIndex],
              content: text,
            };
            return { ...prev, elements: updatedElements };
          } else {
            // Add a new interim element
            return {
              ...prev,
              elements: [...prev.elements, { type: 'interim', content: text }],
            };
          }
        });
      }
    });

    // Debugging: Log state changes in speechRecognizer
    speechRecognizer.setStateChangeCallback((recording) => {
      console.log(`SpeechRecognizer state changed: ${recording ? 'Recording' : 'Stopped'}`);
    });

    // Cleanup on unmount
    return () => {
      if (speechRecognizer.isRecording()) {
        console.log("Stopping speechRecognizer on unmount...");
        speechRecognizer.stop();
      }
      setInterimText(null);
    };
  }, [addElement, setInterimText, addToCommandHistory]);

  // Helper to render script elements
  const renderScriptElement = (element: ScriptElement, index: number) => {
    switch (element.type) {
      case 'scene-heading':
        return <div key={index} className="scene-heading">{element.content}</div>;
      case 'action':
        return <div key={index} className="action">{element.content}</div>;
      case 'character':
        return <div key={index} className="character">{element.content}</div>;
      case 'parenthetical':
        return <div key={index} className="parenthetical">{element.content}</div>;
      case 'dialogue':
        return <div key={index} className="dialogue">{element.content}</div>;
      case 'transition':
        return <div key={index} className="transition">{element.content}</div>;
      default:
        return <div key={index}>{element.content}</div>;
    }
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

  return (
    <div className="flex-1 bg-white md:border-r border-neutral-200 flex flex-col relative">
      {/* Delete Button */}
      <div className="absolute top-4 right-4">
        <Button
          onMouseDown={handleDeletePress}
          onMouseUp={handleDeleteRelease}
          onMouseLeave={handleDeleteRelease}
          className="relative w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
          title="Hold to Clear Document"
        >
          {deleteCountdown > 0 ? (
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
              {deleteCountdown}
            </span>
          ) : (
            <span>🗑️</span>
          )}
        </Button>
      </div>

      {/* Document Toolbar */}
      <div className="border-b border-neutral-200 px-4 py-2 flex items-center flex-wrap">
        <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100 mr-1" title="Undo"
          onClick={() => document.execCommand('undo')}>
          <Undo className="h-4 w-4 text-neutral-400" />
        </Button>
        <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100 mr-1" title="Redo"
          onClick={() => document.execCommand('redo')}>
          <Redo className="h-4 w-4 text-neutral-400" />
        </Button>
        <div className="h-5 w-px bg-neutral-200 mx-2"></div>
        
        {/* Text Formatting */}
        <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100 mr-1" title="Bold"
          onClick={() => document.execCommand('bold')}>
          <Bold className="h-4 w-4 text-neutral-400" />
        </Button>
        <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100 mr-1" title="Italic"
          onClick={() => document.execCommand('italic')}>
          <Italic className="h-4 w-4 text-neutral-400" />
        </Button>
        <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100 mr-1" title="Underline"
          onClick={() => document.execCommand('underline')}>
          <Underline className="h-4 w-4 text-neutral-400" />
        </Button>
        
        <div className="h-5 w-px bg-neutral-200 mx-2"></div>
        
        {/* Document Format Selection - Added to this toolbar */}
        <div className="relative">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1.5 rounded hover:bg-neutral-100 mr-1 flex items-center" 
            title="Document Format"
            onClick={() => setShowFormats(!showFormats)}
          >
            <FileType className="h-4 w-4 text-neutral-400 mr-1" />
            <span className="text-xs text-neutral-500">{documentFormat}</span>
          </Button>
          
          {showFormats && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 rounded-md shadow-md z-10 min-w-[120px]">
              <div 
                className="px-3 py-2 text-sm hover:bg-neutral-100 cursor-pointer" 
                onClick={() => {
                  setShowFormats(false);
                  // Handle format change if needed
                }}
              >
                Script
              </div>
              <div className="px-3 py-2 text-sm text-neutral-400 cursor-not-allowed">
                Novel (Coming Soon)
              </div>
              <div className="px-3 py-2 text-sm text-neutral-400 cursor-not-allowed">
                Poem (Coming Soon)
              </div>
            </div>
          )}
        </div>
        
        <div className="h-5 w-px bg-neutral-200 mx-2"></div>
        
        {/* Text Alignment */}
        <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100 mr-1" title="Align Left"
          onClick={() => document.execCommand('justifyLeft')}>
          <AlignLeft className="h-4 w-4 text-neutral-400" />
        </Button>
        <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100 mr-1" title="Align Center"
          onClick={() => document.execCommand('justifyCenter')}>
          <AlignCenter className="h-4 w-4 text-neutral-400" />
        </Button>
        <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100 mr-1" title="Align Right"
          onClick={() => document.execCommand('justifyRight')}>
          <AlignRight className="h-4 w-4 text-neutral-400" />
        </Button>
        <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100 mr-1" title="Justify"
          onClick={() => document.execCommand('justifyFull')}>
          <AlignJustify className="h-4 w-4 text-neutral-400" />
        </Button>
        
        <div className="h-5 w-px bg-neutral-200 mx-2"></div>
        
        {/* Headings and Lists */}
        <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100 mr-1" title="Heading 1"
          onClick={() => document.execCommand('formatBlock', false, '<h1>')}>
          <Heading1 className="h-4 w-4 text-neutral-400" />
        </Button>
        <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100 mr-1" title="Heading 2"
          onClick={() => document.execCommand('formatBlock', false, '<h2>')}>
          <Heading2 className="h-4 w-4 text-neutral-400" />
        </Button>
        <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100 mr-1" title="Bullet List"
          onClick={() => document.execCommand('insertUnorderedList')}>
          <List className="h-4 w-4 text-neutral-400" />
        </Button>
        <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100 mr-1" title="Numbered List"
          onClick={() => document.execCommand('insertOrderedList')}>
          <ListOrdered className="h-4 w-4 text-neutral-400" />
        </Button>
        
        <div className="h-5 w-px bg-neutral-200 mx-2"></div>
        
        <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100 mr-1" title="Voice Command Help">
          <HelpCircle className="h-4 w-4 text-neutral-400" />
        </Button>
      </div>
      
      {/* Document Content Area */}
      <div 
        ref={contentRef}
        className="flex-1 overflow-auto p-8 bg-white" 
        id="documentContent"
      >
        <div 
          ref={editorRef}
          className={`max-w-3xl mx-auto font-mono ${formatClass} leading-relaxed`}
          contentEditable={true}
          suppressContentEditableWarning={true}
          style={{ minHeight: '300px', outline: 'none' }}
          onInput={(e) => {
            // You can capture manual edits here if needed
            // For now, we're just allowing direct editing without syncing to state
            // This gives users the flexibility to manually edit
            console.log("Manual edit detected");
          }}
        >
          {documentContent.elements.map(renderScriptElement)}
          
          {/* Show interim transcription while recording */}
          {isRecording && interimText && (
            <div className="text-gray-600 border-l-2 border-primary pl-2 py-1 my-2 bg-gray-50/50 italic flex items-center" key="interim-text">
              <div className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse mr-2"></div>
              <span className="font-normal">{interimText}</span>
              <span className="animate-pulse">...</span>
            </div>
          )}

          {/* Empty state message */}
          {documentContent.elements.length === 0 && !interimText && (
            <div className="text-gray-400 text-center mt-8 p-8 border border-dashed border-gray-200 rounded-lg">
              <Mic className="h-10 w-10 mx-auto mb-4 text-gray-300" />
              <p className="font-medium mb-1">Start Speaking or Type Directly</p>
              <p className="text-sm">Click the microphone button at the bottom of the screen to begin dictating your script, or click anywhere in this area to start typing.</p>
              <div className="mt-4 flex justify-center">
                <div className="animate-bounce bg-primary/10 p-2 rounded-full">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Floating Record Button */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
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
      
      {/* Recording Status Bar - ALWAYS VISIBLE */}
      <div
        id="recordingStatus"
        className={`${
          isRecording ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
        } border-t px-4 py-3 transition-colors duration-300 fixed bottom-0 left-0 w-full`}
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