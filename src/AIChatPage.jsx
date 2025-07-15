// src/pages/AIChatPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../firebase/config'; // Assuming firebase/config is correctly imported
import { useAuthState } from 'react-firebase-hooks/auth';

const AIChatPage = () => {
  const [user, loading, error] = useAuthState(auth);
  const [messages, setMessages] = useState([]); // Stores chat history: [{ role: 'user', content: '...' }, { role: 'assistant', content: '...' }]
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState('');

  const messagesEndRef = useRef(null); // Ref for scrolling to the latest message

  // Effect to scroll to the bottom of the chat window when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior (page reload)

    // Basic validation: ensure input is not empty, user is logged in, and not already sending
    if (!input.trim() || !user || isSending) {
      if (!user) {
        setChatError("Please log in to send messages.");
      } else if (!input.trim()) {
        setChatError("Message cannot be empty.");
      }
      return;
    }

    setChatError(''); // Clear any previous errors
    setIsSending(true); // Set sending state to true

    // Create the new user message object
    const newUserMessage = { role: 'user', content: input };
    // Create a new array of messages including the new user message
    const newMessages = [...messages, newUserMessage];
    // Optimistically update the UI with the user's message
    setMessages(newMessages);
    setInput(''); // Clear the input field immediately

    try {
      // Make a POST request to your Vercel Function endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send the entire chat history (including the current user message) and the user's UID
        body: JSON.stringify({ messages: newMessages, userId: user.uid })
      });

      // Parse the JSON response from the Vercel Function
      const result = await response.json();

      // Check if the request was successful based on HTTP status and custom 'status' field
      if (response.ok && result.status === 'success') {
        // Add the AI's response to the chat history
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: 'assistant', content: result.response }
        ]);
      } else {
        // Handle error from the Vercel function
        setChatError(result.message || 'Failed to get AI response. Please try again.');
        // If there's an error, remove the last user message that was added optimistically
        setMessages(prevMessages => prevMessages.slice(0, prevMessages.length - 1));
      }
    } catch (err) {
      // Handle network or unexpected errors during the fetch call
      console.error('Error sending message to Vercel Function:', err);
      const errorMessage = err.message || "An unexpected network error occurred.";
      setChatError(`Connection error: ${errorMessage}`);
      setMessages(prevMessages => prevMessages.slice(0, prevMessages.length - 1));
    } finally {
      // Reset sending state regardless of success or failure
      setIsSending(false);
    }
  };

  // Display loading, error, or login message based on authentication status
  if (loading) {
    return <div style={chatStyles.loading}>Loading chat...</div>;
  }

  if (error) {
    return <div style={chatStyles.error}>Error: {error.message}</div>;
  }

  if (!user) {
    return <div style={chatStyles.noUser}>Please log in to use the AI Chat.</div>;
  }

  return (
    <div style={chatStyles.container}>
      <h2 style={chatStyles.title}>AI Conversational Brain</h2>
      <p style={chatStyles.description}>Chat with your LIFE OS about anything you need!</p>

      {/* Chat window display area */}
      <div style={chatStyles.chatWindow}>
        {messages.length === 0 ? (
          <p style={chatStyles.welcomeMessage}>Type a message to start your conversation with the AI!</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} style={chatStyles.messageContainer(msg.role)}>
              <div style={chatStyles.messageBubble(msg.role)}>
                <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.content}
              </div>
            </div>
          ))
        )}
        {/* Loading indicator when AI is responding */}
        {isSending && (
          <div style={chatStyles.messageContainer('assistant')}>
            <div style={chatStyles.messageBubble('assistant')}>
              <span style={chatStyles.typingIndicator}>...thinking</span>
            </div>
          </div>
        )}
        {/* Element to scroll into view for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form for sending messages */}
      <form onSubmit={handleSendMessage} style={chatStyles.inputForm}>
        <textarea
          style={chatStyles.textarea}
          placeholder="Type your message here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows="3"
          disabled={isSending} // Disable input while sending to prevent multiple submissions
        ></textarea>
        <button type="submit" style={chatStyles.button} disabled={isSending}>
          {isSending ? 'Sending...' : 'Send Message'}
        </button>
        {chatError && <p style={chatStyles.errorText}>{chatError}</p>}
      </form>
    </div>
  );
};

// Styles for the AI Chat Page
const chatStyles = {
    container: {
        padding: '30px',
        backgroundColor: 'var(--background-dark)',
        color: 'var(--text-light)',
        minHeight: 'calc(100vh - 60px)', // Adjust for potential header/footer
        maxWidth: '900px', // Constrain width
        margin: '0 auto', // Center content
        display: 'flex',
        flexDirection: 'column', // Layout content vertically
    },
    title: {
        fontSize: '2.5em',
        color: 'var(--primary-purple)',
        marginBottom: '10px',
        textAlign: 'center',
    },
    description: {
        fontSize: '1.1em',
        color: 'var(--text-secondary)',
        marginBottom: '30px',
        textAlign: 'center',
    },
    chatWindow: {
        flexGrow: 1, // Allows chat window to take available space
        backgroundColor: 'var(--surface-dark)',
        padding: '20px',
        borderRadius: '15px',
        marginBottom: '20px',
        overflowY: 'auto', // Enable vertical scrolling for chat history
        height: '400px', // Fixed height for the chat display area
        display: 'flex',
        flexDirection: 'column', // Messages stack vertically
        gap: '15px', // Space between message bubbles
        border: '1px solid var(--border-color)',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
    },
    messageContainer: (role) => ({
        display: 'flex',
        justifyContent: role === 'user' ? 'flex-end' : 'flex-start', // Align messages left/right
    }),
    messageBubble: (role) => ({
        backgroundColor: role === 'user' ? 'var(--primary-purple)' : 'var(--background-dark)', // Different colors for user/AI
        color: 'white',
        padding: '12px 18px',
        borderRadius: '20px', // Rounded corners for bubbles
        maxWidth: '75%', // Limit bubble width
        wordBreak: 'break-word', // Ensure long words wrap
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        fontSize: '0.95em',
        textAlign: role === 'user' ? 'right' : 'left',
        border: role === 'assistant' ? '1px solid var(--border-color)' : 'none', // Border for AI messages
    }),
    typingIndicator: {
        fontStyle: 'italic',
        color: 'rgba(255, 255, 255, 0.7)',
    },
    welcomeMessage: {
        color: 'var(--text-secondary)',
        textAlign: 'center',
        marginTop: 'auto', // Pushes message to center if chat is empty
        marginBottom: 'auto',
    },
    inputForm: {
        backgroundColor: 'var(--surface-dark)',
        padding: '20px',
        borderRadius: '15px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
    },
    textarea: {
        width: '100%',
        padding: '12px',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        fontSize: '1em',
        minHeight: '80px',
        resize: 'vertical', // Allow vertical resizing
        fontFamily: 'inherit', // Inherit font from body
        backgroundColor: 'var(--background-dark)', // Darker input background
        color: 'var(--text-light)',
    },
    button: {
        backgroundColor: 'var(--primary-purple)',
        color: 'white',
        padding: '12px 25px',
        borderRadius: '8px',
        fontSize: '1.1em',
        fontWeight: 'bold',
        alignSelf: 'flex-end', // Aligns button to the right within the form
        cursor: 'pointer',
        transition: 'background-color 0.3s ease',
    },
    loading: {
        textAlign: 'center',
        fontSize: '1.5em',
        marginTop: '50px',
        color: 'var(--text-light)',
    },
    error: {
        textAlign: 'center',
        fontSize: '1.1em',
        marginTop: '20px',
        color: 'var(--accent-red)',
    },
    errorText: {
        color: 'var(--accent-red)',
        marginTop: '10px',
        fontSize: '0.9em',
        textAlign: 'center',
    },
    noUser: {
        textAlign: 'center',
        fontSize: '1.1em',
        marginTop: '50px',
        color: 'var(--text-secondary)',
    },
};

export default AIChatPage;