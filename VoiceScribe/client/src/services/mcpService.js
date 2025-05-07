import axios from 'axios';

const BASE_URL = 'stdio'; // Update to use stdio instead of a fixed port

export const createDocument = async (filename, title, author) => {
  const response = await axios.post(`${BASE_URL}/create_document`, {
    filename,
    title,
    author,
  });
  return response.data;
};

export const addHeading = async (filename, text, level = 1) => {
  const response = await axios.post(`${BASE_URL}/add_heading`, {
    filename,
    text,
    level,
  });
  return response.data;
};

export const addParagraph = async (filename, text, style = null) => {
  const response = await axios.post(`${BASE_URL}/add_paragraph`, {
    filename,
    text,
    style,
  });
  return response.data;
};

// Add more functions for other MCP server API endpoints as needed