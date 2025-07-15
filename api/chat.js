// api/chat.js
const admin = require('firebase-admin');
const OpenAI = require('openai');

// Initialize Firebase Admin SDK (if not already initialized)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
    });
  } catch (error) {
    console.error("Firebase Admin initialization error in chat.js:", error);
  }
}

const db = admin.firestore(); // Firestore instance is needed if you decide to save chat history
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async (req, res) => {
  // Ensure the request method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  // Extract messages array and userId from the request body
  const { messages, userId } = req.body;

  // Basic validation
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Invalid messages array provided.' });
  }
  if (!userId) {
    // This is crucial for distinguishing chat histories per user
    return res.status(401).json({ status: 'error', message: 'Authentication required. User ID missing.' });
  }

  try {
    // Call OpenAI's chat completion API
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // You can change this to 'gpt-4' or 'gpt-4o' if preferred and available
      messages: messages, // Pass the array of messages (user + assistant history)
      temperature: 0.7, // Adjust creativity (0.0 - 1.0)
    });

    const aiResponseContent = chatCompletion.choices[0].message.content;

    // --- Optional: Save chat history to Firestore ---
    // If you want to persist chat conversations for each user, uncomment and adjust this section.
    // This would allow users to resume past conversations.
    /*
    const chatHistoryCollectionRef = db.collection('chatHistories').doc(userId).collection('conversations');
    // Save the last user message and the AI's response
    await chatHistoryCollectionRef.add({
      userMessage: messages[messages.length - 1].content, // The last message in the array is the current user's input
      aiResponse: aiResponseContent,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      fullChatHistoryAtTime: messages // Optionally save the full context if needed for debugging/analysis
    });
    */
    // --- End Optional Section ---

    // Send the AI's response back to the frontend
    res.status(200).json({ status: 'success', response: aiResponseContent });

  } catch (error) {
    console.error('Error in Vercel Function (chat):', error);

    // Provide more specific error messages if possible
    let errorMessage = 'Internal Server Error';
    if (error.response && error.response.data && error.response.data.error) {
      errorMessage = error.response.data.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    res.status(500).json({ status: 'error', message: `Failed to process chat: ${errorMessage}` });
  }
};