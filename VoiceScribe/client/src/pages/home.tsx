import Header from '@/components/Header';
import DocumentEditor from '@/components/DocumentEditor';
import TutorialModal from '@/components/TutorialModal';
import { useDocument } from '@/context/DocumentContext';
import { useEffect } from 'react';
import { speechRecognition } from '@/lib/speechRecognition';
import { useToast } from '@/hooks/use-toast';

// CSS for script formatting
const scriptStyles = `
  @keyframes pulse-ring {
    0% {
      transform: scale(0.8);
      opacity: 0.8;
    }
    70% {
      transform: scale(1.2);
      opacity: 0;
    }
    100% {
      transform: scale(1.2);
      opacity: 0;
    }
  }
  
  .pulse-ring::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: rgba(234, 67, 53, 0.6);
    animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
    z-index: -1;
  }
  
  .recording .pulse-ring::before {
    background-color: rgba(234, 67, 53, 0.6);
    animation: pulse-ring 1.5s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
  }
  
  /* Script formatting styles */
  .script-format .character {
    text-transform: uppercase;
    font-weight: 500;
    margin-top: 1.5rem;
    margin-bottom: 0.25rem;
  }
  
  .script-format .dialogue {
    margin-left: 2rem;
    margin-bottom: 1rem;
  }
  
  .script-format .parenthetical {
    margin-left: 1.5rem;
    font-style: italic;
    color: #5F6368;
  }
  
  .script-format .action {
    margin-top: 1rem;
    margin-bottom: 1rem;
  }
  
  .script-format .transition {
    text-align: right;
    margin-top: 1.5rem;
    margin-bottom: 1.5rem;
    text-transform: uppercase;
    font-weight: 500;
  }
  
  .script-format .scene-heading {
    text-transform: uppercase;
    font-weight: 700;
    margin-top: 2rem;
    margin-bottom: 1rem;
  }
`;

export default function Home() {
  const { 
    activeDocument, 
    documentFormat, 
    isRecording, 
    setIsRecording, 
    interimText,
    setInterimText,
    addToCommandHistory,
    addElement,
    saveDocument
  } = useDocument();
  
  const { toast } = useToast();

  // Initialize speech recognition
  useEffect(() => {
    speechRecognition.setFormat(documentFormat);
    
    speechRecognition.setCallbacks(
      // Result callback
      (element, isFinal) => {
        if (isFinal) {
          // Clear interim text when we have final result
          setInterimText(null);
          
          // Process final result
          if (element) {
            // Add new element to document
            addElement(element);
            // Add to command history
            addToCommandHistory(element.type, element.content);
          } else if (element === null) {
            // Special command received (null element)
            saveDocument();
            addToCommandHistory('command', 'Save document');
          }
        } else if (!isFinal && element) {
          // Update interim text for non-final results
          setInterimText(element.content);
        }
      },
      // State change callback
      (isRec) => {
        setIsRecording(isRec);
        if (!isRec) {
          // Clear interim text when recording stops
          setInterimText(null);
        }
      },
      // Error callback
      (error) => {
        toast({
          title: "Speech Recognition Error",
          description: error,
          variant: "destructive"
        });
        setIsRecording(false);
        setInterimText(null);
      }
    );
    
    return () => {
      // Clean up by stopping recognition if component unmounts
      if (isRecording) {
        speechRecognition.stop();
      }
    };
  }, [documentFormat, addElement, setIsRecording, setInterimText, addToCommandHistory, toast, saveDocument, isRecording]);

  // Add script styles to the document
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = scriptStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100 font-sans text-neutral-400">
      <Header />
      
      <main className="flex flex-1 flex-col">
        <DocumentEditor />
      </main>
      
      <TutorialModal />
    </div>
  );
}
