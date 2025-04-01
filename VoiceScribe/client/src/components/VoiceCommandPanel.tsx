import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useDocument } from '@/context/DocumentContext';
import { speechRecognition } from '@/lib/speechRecognition';
import { getCommandHintsForFormat } from '@/lib/documentFormats';
import { useToast } from '@/hooks/use-toast';
import { Mic, X, Command, HistoryIcon } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';

const VoiceCommandPanel = () => {
  const { 
    isRecording, 
    setIsRecording, 
    documentFormat,
    interimText,
    setInterimText,
    commandHistory,
    addToCommandHistory,
    clearCommandHistory,
    addElement, 
    saveDocument
  } = useDocument();
  
  const { toast } = useToast();
  const commandHints = getCommandHintsForFormat(documentFormat);

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
  }, [documentFormat, addElement, setIsRecording, setInterimText, addToCommandHistory, toast, saveDocument]);

  const toggleRecording = () => {
    speechRecognition.toggle();
  };

  return (
    <div className="md:w-80 bg-white border-t md:border-t-0 md:border-l border-neutral-200 flex flex-col h-full overflow-hidden">
      {/* Command Help & History - Scrollable Section */}
      <div className="flex-1 overflow-y-auto">
        <Accordion
          type="single"
          collapsible
          defaultValue="commands"
        >
          <AccordionItem value="history" className="border-b border-neutral-100">
            <AccordionTrigger className="p-4 pb-3 text-base font-medium flex items-center hover:no-underline">
              <div className="flex items-center">
                <HistoryIcon className="w-4 h-4 mr-2 text-primary" />
                Command History
                {commandHistory.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {commandHistory.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {commandHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <HistoryIcon className="h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No commands issued yet</p>
                  <p className="text-xs text-gray-400 mt-1">Your voice commands will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {commandHistory.length} commands
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs bg-white"
                      onClick={clearCommandHistory}
                    >
                      <X className="h-3 w-3 mr-1" /> Clear
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 border border-gray-100 rounded-md p-2 bg-gray-50">
                    {commandHistory.slice().reverse().map((cmd, index) => {
                      // Get appropriate color styling based on command type
                      let badgeStyle = "";
                      
                      if (cmd.type === 'command') {
                        badgeStyle = "bg-blue-50 text-blue-700 border-blue-200";
                      } else {
                        badgeStyle = "bg-green-50 text-green-700 border-green-200";
                      }
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded-md text-sm border border-gray-100 shadow-sm">
                          <Badge 
                            className={`text-xs capitalize ${badgeStyle}`}
                            variant="outline"
                          >
                            {cmd.type}
                          </Badge>
                          <span className="text-[10px] text-gray-400">
                            {new Date(cmd.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
          
          {/* Voice Commands Help */}
          <AccordionItem value="commands" className="border-b-0">
            <AccordionTrigger className="p-4 pb-3 text-base font-medium flex items-center hover:no-underline">
              <div className="flex items-center">
                <Command className="w-4 h-4 mr-2 text-primary" />
                Voice Commands
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-6">
                {commandHints.map((section, index) => (
                  <div key={index} className="pb-4 border-b border-neutral-100 last:border-b-0">
                    <h4 className="font-medium text-sm mb-3 text-primary bg-primary/5 p-2 rounded-md flex items-center">
                      <Command className="h-3 w-3 mr-1.5" />
                      {section.category}
                    </h4>
                    <div className="grid grid-cols-1 gap-3 pl-2">
                      {section.commands.map((cmd, cmdIndex) => (
                        <div key={cmdIndex} className="flex flex-col bg-gray-50 rounded-md p-2.5 border border-gray-100">
                          <Badge variant="outline" className="mb-2 self-start font-mono bg-white">{cmd.command}</Badge>
                          <p className="text-neutral-600 text-xs">{cmd.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      
      {/* Fixed Mic Button at the bottom */}
      <div className="p-4 border-t border-neutral-200 flex items-center justify-center">
        <div className={`relative flex items-center justify-center ${isRecording ? 'pulse-ring' : ''}`}>
          <Button
            onClick={toggleRecording}
            className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center ${
              isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
            }`}
          >
            <Mic className="text-white h-6 w-6" />
          </Button>
        </div>
      </div>
      
      {/* Interim text display at the bottom */}
      {isRecording && interimText && (
        <div className="p-3 border-t border-neutral-200 bg-gray-50">
          <div className="flex items-center p-2 bg-white rounded-md border border-gray-100">
            <div className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
            <span className="text-sm text-gray-600 italic">{interimText}...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceCommandPanel;