This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Create env, activate, and install requirements: 

'''bash
python -m virtualenv env --python=python3.8.10
env\Scripts\activate
pip install -r requirements.txt
'''

If you just want to acitvate from the script-writing dir:
'''bash
cd ..
env\Scripts\activate
cd ./script-writing-app
'''

Then run python:
'''bash
python transcribe_recording.py
'''

CURRENTV ISSUE:
CUDA not aligning right with version of something
For now, just use the env in the Github repo
'''bash
cd .. 
env\Scripts\activate
cd ./script-writing-app
'''



First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Running the Flask App and React App

To ensure the Flask app and React app can interact properly, follow these steps:

1. **Set up the Flask App:**
   - Navigate to the root directory of the project.
   - Run the following command to start the Flask app:
     ```bash
     python flask_app.py
     ```
   - The Flask app will run on `http://localhost:5000` by default.

2. **Set up the React App:**
   - Navigate to the `VoiceScribe/client` directory.
   - Run the following commands to install dependencies and start the React app:
     ```bash
     npm install
     npm start
     ```
   - The React app will run on `http://localhost:3000` by default.

3. **Test the Integration:**
   - Use the "Test LLM Command" button in the Document Editor to send a prompt to the Flask app and receive a response.

Ensure both apps are running simultaneously for proper interaction.

## Running the Backend and HuggingFace AI Tools

To ensure the backend and HuggingFace AI tools are set up and running correctly, follow these steps:

1. **Set up the Backend:**
   - Navigate to the root directory of the project.
   - Run the following command to start the backend:
     ```bash
     python backend.py
     ```
   - The backend will run on `http://localhost:5000` by default.

2. **Set up HuggingFace AI Tools:**
   - Ensure you have the required Python dependencies installed. If not, install them using:
     ```bash
     pip install -r requirements.txt
     ```
   - Run the HuggingFace AI script:
     ```bash
     python HuggingFaceAI.py
     ```
   - This script will handle AI-related tasks such as text generation and processing.

3. **Editing Prompting Information:**
   - Locate the `script_formatting_prompt.txt` file in the root directory.
   - Open the file in a text editor to modify the prompt information as needed.
   - Save the changes and restart the backend or HuggingFace AI tools if necessary to apply the updates.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
