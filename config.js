/* Blue Chain Aqua public frontend configuration.
   IMPORTANT: Never put a Groq API key in this file.
   The Groq key is stored as an environment variable on the deployment server.
*/
window.BCA_CONFIG = {
  GROQ_MODEL: 'openai/gpt-oss-120b',
  GROQ_STT_MODEL: 'whisper-large-v3-turbo'
};
