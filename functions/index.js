// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const OpenAI = require('openai');

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Initialize OpenAI client with the API key from Firebase environment config
const openai = new OpenAI({
  apiKey: functions.config().openai.api_key,
});

exports.processUserPlan = functions.https.onCall(async (data, context) => {
  // 1. Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const userId = context.auth.uid;
  const rawInput = data.planInput;

  if (!rawInput || typeof rawInput !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with a valid "planInput" string.'
    );
  }

  try {
    // 2. Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // You can use "gpt-4" if you have access and budget
      messages: [
        {
          role: "system",
          content: `You are an AI assistant for a personal day planner. Your task is to parse user input about their day's plans and extract actionable items, including an estimated time, description, and an overall sentiment or priority. Return the response as a JSON array of objects.

Example of desired JSON output for "I have a wedding tomorrow at 2 PM, a test at 10 AM, and an online meeting from 4-5 PM":
[
  {
    "time": "Tomorrow 10:00 AM",
    "description": "Prepare for and take test",
    "category": "Education",
    "priority": "High"
  },
  {
    "time": "Tomorrow 2:00 PM",
    "description": "Attend wedding ceremony",
    "category": "Social",
    "priority": "Medium"
  },
  {
    "time": "Tomorrow 4:00 PM - 5:00 PM",
    "description": "Online team meeting",
    "category": "Work",
    "priority": "High"
  }
]

Categories can include: "Work", "Education", "Social", "Health", "Personal", "Chores", "Finance", "Appointments", "Uncategorized".
Priorities can include: "Very High", "High", "Medium", "Low".
If the date/time is implied (e.g., "tomorrow"), infer it based on the current date, assuming the current date is ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})} in Bengaluru, India. Ensure all dates are explicitly stated if inferred (e.g., "Tomorrow 10:00 AM").`
        },
        {
          role: "user",
          content: rawInput
        }
      ],
      response_format: { type: "json_object" }, // Request JSON output
    });

    let parsedSchedule = null;
    let rawJsonOutput = completion.choices[0].message.content;

    try {
        // LLM might wrap JSON in markdown, so extract it if needed
        if (rawJsonOutput.startsWith('```json')) {
            rawJsonOutput = rawJsonOutput.substring(7, rawJsonOutput.lastIndexOf('```'));
        }
        parsedSchedule = JSON.parse(rawJsonOutput);
        // Ensure it's an array if the LLM sometimes gives a single object
        if (!Array.isArray(parsedSchedule)) {
            parsedSchedule = [parsedSchedule];
        }
    } catch (jsonParseError) {
        console.warn("Failed to parse LLM response as JSON, storing raw LLM output:", rawJsonOutput, jsonParseError);
        parsedSchedule = { error: "LLM output not valid JSON", raw: rawJsonOutput };
    }

    // 3. Save to Firestore
    const userPlansCollectionRef = db.collection('plans').doc(userId).collection('userPlans');
    await userPlansCollectionRef.add({
      rawInput: rawInput,
      parsedSchedule: parsedSchedule, // Save the AI-parsed structure
      timestamp: admin.firestore.FieldValue.serverTimestamp(), // Use server timestamp for accuracy
    });

    return { status: 'success', message: 'Plan processed and saved successfully!', parsedSchedule: parsedSchedule };

  } catch (openaiError) {
    console.error("OpenAI API or processing error:", openaiError);
    if (openaiError.response) {
      console.error("OpenAI API response error:", openaiError.response.data);
      throw new functions.https.HttpsError(
        'internal',
        `OpenAI API error: ${openaiError.response.data.error.message || 'Unknown OpenAI error'}`
      );
    }
    throw new functions.https.HttpsError(
      'internal',
      `Failed to process plan: ${openaiError.message}`
    );
  }
});