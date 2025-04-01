import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, ListChecks, ChevronDown } from 'lucide-react';

const TutorialModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Show tutorial on first visit
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">Welcome to VoiceScribe!</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-4">VoiceScribe lets you create documents using just your voice. Here's how to get started:</p>
          
          <div className="space-y-4 mb-4">
            <div className="flex items-center">
              <div className="bg-primary/10 rounded-full p-2 mr-3">
                <Mic className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm">Click the <strong>microphone button</strong> to start recording your voice</p>
            </div>
            
            <div className="flex items-center">
              <div className="bg-primary/10 rounded-full p-2 mr-3">
                <ListChecks className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm">Use <strong>voice commands</strong> to format your document (see command panel)</p>
            </div>
            
            <div className="flex items-center">
              <div className="bg-primary/10 rounded-full p-2 mr-3">
                <ChevronDown className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm">Select different <strong>document formats</strong> from the dropdown menu</p>
            </div>
          </div>
          
          <p className="text-sm text-neutral-400 mb-4">We'll need permission to access your microphone when you're ready to start.</p>
        </div>
        <DialogFooter>
          <Button onClick={handleClose}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TutorialModal;
