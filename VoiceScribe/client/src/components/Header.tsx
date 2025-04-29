import { useState, useRef } from 'react';
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
  HistoryIcon, Command, Trash2, Clock, FileType, Undo, Redo, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Header = () => {
  const { 
    documentFormat, 
    setDocumentFormat, 
    saveDocument, 
    commandHistory,
    clearCommandHistory,
    documentContent,
    setDocumentContent
  } = useDocument();
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [fontSize, setFontSize] = useState(12);
  const [deleteCountdown, setDeleteCountdown] = useState(0);
  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const commandHints = getCommandHintsForFormat(documentFormat);
  
  const handleFormatChange = (format: string) => {
    setDocumentFormat(format as any);
    setIsFormatDropdownOpen(false);
  };

  const handleSave = async () => {
    await saveDocument();
  };

  const handleDeletePress = () => {
    setDeleteCountdown(3);
    deleteTimerRef.current = setInterval(() => {
      setDeleteCountdown(prev => {
        if (prev <= 1) {
          if (deleteTimerRef.current) {
            clearInterval(deleteTimerRef.current);
            deleteTimerRef.current = null;
          }
          setDocumentContent({ elements: [] }); // Clear the document
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleDeleteRelease = () => {
    if (deleteTimerRef.current) {
      clearInterval(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    setDeleteCountdown(0); // Reset countdown when released
  };

  const handleExport = () => {
    const content = documentContent.elements
      .map((element: { content: string }) => element.content)
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

  // Formatting handlers
  const handleFormatCommand = (command: string, value?: string) => {
    const editor = document.querySelector('.editor');
    if (!editor) return;

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
          document.execCommand('fontSize', false, value);
        }
        break;
    }
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
        {/* Trash Button */}
        <Button
          onMouseDown={handleDeletePress}
          onMouseUp={handleDeleteRelease}
          onMouseLeave={handleDeleteRelease}
          className={`relative w-10 h-10 rounded-full flex items-center justify-center ${
            deleteCountdown > 0 ? 'bg-gray-500 text-white' : 'bg-white text-gray-500 hover:text-gray-600'
          }`}
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

        {/* Formatting Toggle Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          title="Formatting"
          onClick={() => setShowFormatting(!showFormatting)}
        >
          <FileType className="h-5 w-5" />
        </Button>

        {/* Formatting Palette */}
        {showFormatting && (
          <div className="absolute top-full right-0 mt-1 bg-white border border-neutral-200 rounded-md shadow-md z-10 p-2">
            <div className="flex flex-wrap gap-2">
              {/* Undo/Redo */}
              <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100" title="Undo"
                onClick={() => document.execCommand('undo', false)}>
                <Undo className="h-4 w-4 text-neutral-400" />
              </Button>
              <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100" title="Redo"
                onClick={() => document.execCommand('redo', false)}>
                <Redo className="h-4 w-4 text-neutral-400" />
              </Button>
              
              <div className="h-5 w-px bg-neutral-200 mx-2"></div>
              
              {/* Text Formatting */}
              <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100" title="Bold"
                onClick={() => handleFormatCommand('bold')}>
                <Bold className="h-4 w-4 text-neutral-400" />
              </Button>
              <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100" title="Italic"
                onClick={() => handleFormatCommand('italic')}>
                <Italic className="h-4 w-4 text-neutral-400" />
              </Button>
              <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100" title="Underline"
                onClick={() => handleFormatCommand('underline')}>
                <Underline className="h-4 w-4 text-neutral-400" />
              </Button>
              
              <div className="h-5 w-px bg-neutral-200 mx-2"></div>
              
              {/* Text Alignment */}
              <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100" title="Align Left"
                onClick={() => handleFormatCommand('align', 'left')}>
                <AlignLeft className="h-4 w-4 text-neutral-400" />
              </Button>
              <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100" title="Align Center"
                onClick={() => handleFormatCommand('align', 'center')}>
                <AlignCenter className="h-4 w-4 text-neutral-400" />
              </Button>
              <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100" title="Align Right"
                onClick={() => handleFormatCommand('align', 'right')}>
                <AlignRight className="h-4 w-4 text-neutral-400" />
              </Button>
              <Button variant="ghost" size="sm" className="p-1.5 rounded hover:bg-neutral-100" title="Justify"
                onClick={() => handleFormatCommand('align', 'full')}>
                <AlignJustify className="h-4 w-4 text-neutral-400" />
              </Button>
              
              <div className="h-5 w-px bg-neutral-200 mx-2"></div>
              
              {/* Font Size */}
              <div className="flex items-center gap-2">
                <label htmlFor="fontSizeSelector" className="text-sm text-neutral-500">Font Size:</label>
                <input
                  id="fontSizeSelector"
                  type="number"
                  min="8"
                  max="36"
                  step="1"
                  value={fontSize}
                  onChange={(e) => {
                    const newSize = Number(e.target.value);
                    setFontSize(newSize);
                    handleFormatCommand('fontSize', newSize.toString());
                  }}
                  className="p-1 w-16 rounded border border-neutral-300 text-sm"
                  title="Font Size (in pt)"
                />
              </div>
            </div>
          </div>
        )}

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
        <Button variant="ghost" size="icon" title="Export Document" onClick={handleExport}>
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
