// api/process-plan.js

// Initialize Firebase Admin SDK
// This is crucial for securely accessing Firestore from your Vercel Function
const admin = require('firebase-admin');

// Check if Firebase Admin app is already initialized to prevent re-initialization errors
if (!admin.apps.length) {
  // It's best practice to use environment variables for Firebase credentials in production.
  // For Vercel, you'll set these as "Environment Variables" in the Vercel project settings.
  // Example structure of the service account key:
  // {
  //   "type": "service_account",
  //   "project_id": "your-project-id",
  //   "private_key_id": "...",
  //   "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  //   "client_email": "...",
  //   "client_id": "...",
  //   "auth_uri": "...",
  //   "token_uri": "...",
  //   "auth_provider_x509_cert_url": "...",
  //   "client_x509_cert_url": "..."
  // }
  // Convert this JSON object to a single-line string and set it as an environment variable
  // e.g., FIREBASE_SERVICE_ACCOUNT_KEY = '{"type": "service_account", ...}'
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
    });
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

const db = admin.firestore(); // Get Firestore instance
const OpenAI = require('openai');

// Initialize OpenAI client with API key from environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Set this in Vercel Environment Variables
});

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  const { planInput } = req.body;
  const userId = req.headers['x-user-id']; // We'll pass userId from frontend

  if (!planInput || typeof planInput !== 'string') {
    return res.status(400).json({ status: 'error', message: 'Invalid plan input provided.' });
  }

  if (!userId) {
    return res.status(401).json({ status: 'error', message: 'Authentication required. User ID missing.' });
  }

  try {
    const prompt = `You are a highly efficient personal assistant specializing in daily planning.
    The user will provide a raw input describing their tasks, appointments, and general plans for a day or week.
    Your goal is to parse this raw input into a structured JSON array of daily schedule items.
    Each item in the array should have the following properties:
    - "time": (string) The specific time or time range for the activity (e.g., "9:00 AM", "10:00 AM - 12:00 PM", "Afternoon", "Evening").
    - "description": (string) A concise description of the activity.
    - "category": (string) Categorize the activity (e.g., "Work", "Personal", "Health", "Social", "Study", "Errand", "Meal").
    - "priority": (string) Assign a priority ("High", "Medium", "Low").

    If a specific time is not given, infer a logical time of day (e.g., "Morning", "Afternoon", "Evening").
    If multiple items are mentioned in one sentence, split them into separate objects if they have distinct times or clear separate activities.
    If the input is vague or cannot be structured, return an array with one object and a "category": "Unstructured" and "description": "Original input: [raw input]".

    Ensure the output is ONLY the JSON array, nothing else.

    Raw input: "${planInput}"
    `;

    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // You can use gpt-4 or gpt-4o if you have access and prefer
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" }, // Request JSON output
      temperature: 0.7,
    });

    const aiResponseContent = chatCompletion.choices[0].message.content;
    let parsedSchedule = [];
    try {
      // OpenAI's response_format type json_object guarantees a JSON string.
      // However, it might be nested, so we ensure we're parsing the right part.
      parsedSchedule = JSON.parse(aiResponseContent);

      // If it's an object instead of an array (e.g., single item response)
      // or has an error property from the AI, handle it.
      if (!Array.isArray(parsedSchedule)) {
        if (typeof parsedSchedule === 'object' && parsedSchedule !== null && parsedSchedule.error) {
            parsedSchedule = { error: true, raw: parsedSchedule.error };
        } else {
            parsedSchedule = [parsedSchedule]; // Wrap single object in array
        }
      }
    } catch (parseError) {
      console.error("Failed to parse AI response JSON:", parseError);
      // If AI response isn't perfect JSON, save raw for debugging
      parsedSchedule = { error: true, raw: aiResponseContent };
    }

    // Save to Firestore
    const userPlansCollectionRef = db.collection('plans').doc(userId).collection('userPlans');
    await userPlansCollectionRef.add({
      rawInput: planInput,
      parsedSchedule: parsedSchedule,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userId: userId, // Store userId for direct queries if needed
    });

    res.status(200).json({ status: 'success', data: parsedSchedule });

  } catch (error) {
    console.error('Error in Vercel Function (process-plan):', error);
    res.status(500).json({ status: 'error', message: `Internal Server Error: ${error.message}` });
  }
};