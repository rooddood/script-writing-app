import { Button } from '@/components/ui/button';
import axios from 'axios';

const TestMcpButton = () => {
  const handleTestRequest = async () => {
    try {
      const response = await axios.post('/api/mcp', {
        command: 'add_heading',
        args: {
          filename: 'test.docx',
          text: 'Test Heading',
          level: 1,
        },
      });
      console.log('MCP server response:', response.data);
      alert('Test request successful! Check console for details.');
    } catch (error) {
      console.error('Error testing MCP server:', error);
      alert('Test request failed. Check console for details.');
    }
  };

  return (
    <Button onClick={handleTestRequest} className="bg-blue-500 hover:bg-blue-600 text-white">
      Test MCP Server
    </Button>
  );
};

export default TestMcpButton;