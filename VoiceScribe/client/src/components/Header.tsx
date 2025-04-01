import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useDocument } from '@/context/DocumentContext';
import { formatOptions, getCommandHintsForFormat } from '@/lib/documentFormats';
import { 
  Check, Download, ChevronDown, Save, Settings, Mic, 
  HistoryIcon, Command, Trash2, Clock 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Header = () => {
  const { 
    documentFormat, 
    setDocumentFormat, 
    saveDocument, 
    commandHistory,
    clearCommandHistory
  } = useDocument();
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
  
  const commandHints = getCommandHintsForFormat(documentFormat);
  
  const handleFormatChange = (format: string) => {
    setDocumentFormat(format as any);
    setIsFormatDropdownOpen(false);
  };

  const handleSave = async () => {
    await saveDocument();
  };

  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm px-4 py-2 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <Mic className="text-primary text-2xl" />
          <h1 className="text-xl font-medium text-neutral-400 ml-1">VoiceScribe</h1>
        </div>
        
        {/* Document Format Selector */}
        <DropdownMenu open={isFormatDropdownOpen} onOpenChange={setIsFormatDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center px-3 py-1.5 text-sm bg-white border border-neutral-200 rounded-md hover:bg-neutral-100">
              {formatOptions.find(f => f.value === documentFormat)?.label || 'Script Format'}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {formatOptions.map((format) => (
              <DropdownMenuItem 
                key={format.value}
                onClick={() => handleFormatChange(format.value)}
                className="flex items-center px-3 py-2 text-sm cursor-pointer"
              >
                {format.value === documentFormat && (
                  <Check className="h-4 w-4 text-primary mr-2" />
                )}
                {format.value !== documentFormat && <span className="w-6" />}
                {format.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Command History Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Command History">
              <HistoryIcon className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <p className="text-sm font-medium">Command History</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => clearCommandHistory()}
                title="Clear History"
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="max-h-96 overflow-auto py-2">
              {commandHistory.length === 0 && (
                <div className="px-4 py-6 text-center text-neutral-400">
                  <Clock className="h-5 w-5 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No commands yet</p>
                </div>
              )}
              
              {commandHistory.map((cmd, index) => (
                <div key={index} className="px-4 py-2 hover:bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="bg-white capitalize">
                      {cmd.type}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(cmd.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Voice Commands Help Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Voice Commands">
              <Command className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="px-4 py-2 border-b">
              <p className="text-sm font-medium">Voice Commands</p>
            </div>
            
            <div className="max-h-96 overflow-auto p-2 space-y-4">
              {commandHints.map((section, index) => (
                <div key={index} className="pb-2 border-b border-neutral-100 last:border-b-0">
                  <h4 className="font-medium text-sm mb-2 text-primary bg-primary/5 p-2 rounded-md flex items-center">
                    <Command className="h-3 w-3 mr-1.5" />
                    {section.category}
                  </h4>
                  <div className="grid grid-cols-1 gap-2 pl-2">
                    {section.commands.map((cmd, cmdIndex) => (
                      <div key={cmdIndex} className="flex flex-col bg-gray-50 rounded-md p-2 border border-gray-100">
                        <Badge variant="outline" className="mb-1 self-start font-mono bg-white">{cmd.command}</Badge>
                        <p className="text-neutral-600 text-xs">{cmd.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" onClick={handleSave} title="Save Document">
          <Save className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" title="Export Document">
          <Download className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" title="Settings">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
