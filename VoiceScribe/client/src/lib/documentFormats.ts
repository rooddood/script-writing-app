import { DocumentFormat, ScriptElement } from "@shared/schema";

// Format options for the dropdown
export const formatOptions = [
  { value: 'script', label: 'Script Format' },
];

// Voice commands for each document format
export interface FormatCommand {
  command: string;
  description: string;
  action: (text: string) => ScriptElement;
}

// Script format commands
export const scriptCommands: FormatCommand[] = [
  {
    command: "New scene:",
    description: "Creates a scene heading",
    action: (text) => ({ type: 'scene-heading', content: text.toUpperCase() })
  },
  {
    command: "Scene:",
    description: "Creates a scene heading (alternate)",
    action: (text) => ({ type: 'scene-heading', content: text.toUpperCase() })
  },
  {
    command: "Int:",
    description: "Creates an interior scene heading",
    action: (text) => ({ type: 'scene-heading', content: `INT. ${text.toUpperCase()}` })
  },
  {
    command: "Ext:",
    description: "Creates an exterior scene heading",
    action: (text) => ({ type: 'scene-heading', content: `EXT. ${text.toUpperCase()}` })
  },
  {
    command: "Character:",
    description: "Creates a character name block",
    action: (text) => ({ type: 'character', content: text.toUpperCase() })
  },
  {
    command: "Enter:",
    description: "Creates a character name block (alternate)",
    action: (text) => ({ type: 'character', content: text.toUpperCase() })
  },
  {
    command: "Dialogue:",
    description: "Creates dialogue for the last character",
    action: (text) => ({ type: 'dialogue', content: text })
  },
  {
    command: "Says:",
    description: "Creates dialogue (alternate)",
    action: (text) => ({ type: 'dialogue', content: text })
  },
  {
    command: "Parenthetical:",
    description: "Creates a parenthetical direction",
    action: (text) => ({ type: 'parenthetical', content: `(${text})` })
  },
  {
    command: "Aside:",
    description: "Creates a parenthetical (alternate)",
    action: (text) => ({ type: 'parenthetical', content: `(${text})` })
  },
  {
    command: "Action:",
    description: "Creates action description",
    action: (text) => ({ type: 'action', content: text })
  },
  {
    command: "Describe:",
    description: "Creates action description (alternate)",
    action: (text) => ({ type: 'action', content: text })
  },
  {
    command: "Transition:",
    description: "Adds a transition",
    action: (text) => ({ type: 'transition', content: text.toUpperCase() })
  },
  {
    command: "Cut to:",
    description: "Adds a CUT TO transition",
    action: (text) => ({ type: 'transition', content: `CUT TO: ${text.toUpperCase()}` })
  },
  {
    command: "Fade to:",
    description: "Adds a FADE TO transition",
    action: (text) => ({ type: 'transition', content: `FADE TO: ${text.toUpperCase()}` })
  }
];

// Default script element type fallback
export const defaultElementForFormat = (format: DocumentFormat, text: string): ScriptElement => {
  switch (format) {
    case 'script':
      return { type: 'action', content: text };
    default:
      return { type: 'action', content: text };
  }
};

// Helper to process commands
export const processVoiceCommand = (
  format: DocumentFormat,
  text: string
): { matched: boolean; element?: ScriptElement } => {
  // Currently, we only have script commands implemented
  const commands = format === 'script' ? scriptCommands : [];
  
  for (const cmd of commands) {
    if (text.toLowerCase().startsWith(cmd.command.toLowerCase())) {
      const contentText = text.substring(cmd.command.length).trim();
      return { matched: true, element: cmd.action(contentText) };
    }
  }
  
  return { matched: false };
};

// Export command lists for different formats
export const getCommandsForFormat = (format: DocumentFormat): FormatCommand[] => {
  switch (format) {
    case 'script':
      return scriptCommands;
    default:
      return scriptCommands; // Default to script commands for now
  }
};

// Command hints
export interface CommandHint {
  category: string;
  commands: {
    command: string;
    description: string;
  }[];
}

export const scriptCommandHints: CommandHint[] = [
  {
    category: "Scene Elements",
    commands: [
      {
        command: "\"New scene: [scene description]\"",
        description: "Creates a scene heading"
      },
      {
        command: "\"Int: [location]\"",
        description: "Creates interior scene heading"
      },
      {
        command: "\"Ext: [location]\"",
        description: "Creates exterior scene heading"
      }
    ]
  },
  {
    category: "Character & Dialogue",
    commands: [
      {
        command: "\"Character: [name]\"",
        description: "Creates a character name block"
      },
      {
        command: "\"Enter: [name]\"",
        description: "Alternative for character name"
      },
      {
        command: "\"Dialogue: [text]\"",
        description: "Creates dialogue for a character"
      },
      {
        command: "\"Says: [text]\"",
        description: "Alternative for dialogue"
      },
      {
        command: "\"Parenthetical: [note]\"",
        description: "Adds direction for delivery"
      },
      {
        command: "\"Aside: [note]\"",
        description: "Alternative for parenthetical"
      }
    ]
  },
  {
    category: "Action & Transitions",
    commands: [
      {
        command: "\"Action: [description]\"",
        description: "Creates action description"
      },
      {
        command: "\"Describe: [action]\"",
        description: "Alternative for action"
      },
      {
        command: "\"Transition: [type]\"",
        description: "Adds a transition"
      },
      {
        command: "\"Cut to: [scene]\"",
        description: "Adds a CUT TO transition"
      },
      {
        command: "\"Fade to: [scene]\"",
        description: "Adds a FADE TO transition"
      }
    ]
  },
  {
    category: "Control Commands",
    commands: [
      {
        command: "\"Delete last line\"",
        description: "Removes the most recent line"
      },
      {
        command: "\"Pause\" or \"Stop\"",
        description: "Pauses voice recording"
      },
      {
        command: "\"Save document\"",
        description: "Saves current progress"
      }
    ]
  }
];

export const getCommandHintsForFormat = (format: DocumentFormat): CommandHint[] => {
  switch (format) {
    case 'script':
      return scriptCommandHints;
    default:
      return scriptCommandHints; // Default to script commands for now
  }
};
