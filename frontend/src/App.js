import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Mood colors and emojis
const MOODS = {
  happy: { emoji: "😊", color: "bg-yellow-400", label: "Heureux" },
  sad: { emoji: "😢", color: "bg-blue-400", label: "Triste" },
  anxious: { emoji: "😰", color: "bg-red-400", label: "Anxieux" },
  calm: { emoji: "😌", color: "bg-green-400", label: "Calme" },
  excited: { emoji: "🤩", color: "bg-orange-400", label: "Excité" },
  angry: { emoji: "😠", color: "bg-red-600", label: "En colère" },
  tired: { emoji: "😴", color: "bg-gray-400", label: "Fatigué" },
  confused: { emoji: "😕", color: "bg-purple-400", label: "Confus" },
  proud: { emoji: "😎", color: "bg-indigo-400", label: "Fier" }
};

const MoodCircle = ({ mood, moodData, isSelected, onClick }) => (
  <div
    className={`relative cursor-pointer transition-all duration-300 transform hover:scale-110 ${
      isSelected ? 'scale-125 ring-4 ring-white ring-opacity-50' : ''
    }`}
    onClick={() => onClick(mood)}
  >
    <div className={`w-20 h-20 rounded-full ${moodData.color} flex items-center justify-center text-3xl shadow-lg hover:shadow-xl transition-shadow`}>
      {moodData.emoji}
    </div>
    <p className="text-center mt-2 text-sm font-medium text-white">{moodData.label}</p>
  </div>
);

const IntensitySlider = ({ intensity, onChange }) => (
  <div className="w-full max-w-md mx-auto">
    <label className="block text-white text-sm font-medium mb-3">
      Intensité: {intensity}/10
    </label>
    <input
      type="range"
      min="1"
      max="10"
      value={intensity}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-2 bg-white bg-opacity-30 rounded-lg appearance-none cursor-pointer slider"
    />
    <div className="flex justify-between text-xs text-white text-opacity-70 mt-1">
      <span>Léger</span>
      <span>Intense</span>
    </div>
  </div>
);

const ChatBubble = ({ message, isUser, timestamp }) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
      isUser 
        ? 'bg-blue-500 text-white' 
        : 'bg-white bg-opacity-90 text-gray-800'
    }`}>
      <p className="text-sm">{message}</p>
      {timestamp && (
        <p className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
          {new Date(timestamp).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      )}
    </div>
  </div>
);

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [intensity, setIntensity] = useState(5);
  const [aiResponse, setAiResponse] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [step, setStep] = useState("welcome"); // welcome, mood-selection, ai-response, chat

  // Initialize user and session
  useEffect(() => {
    if (step === "welcome") {
      // Generate session ID
      setSessionId(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    }
  }, [step]);

  const createUser = async () => {
    if (!userName.trim() || !userEmail.trim()) {
      alert("Veuillez remplir votre nom et email");
      return;
    }
    
    try {
      const response = await axios.post(`${API}/users`, {
        name: userName,
        email: userEmail
      });
      setCurrentUser(response.data);
      setStep("mood-selection");
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Erreur lors de la création du profil");
    }
  };

  const handleMoodSelection = async () => {
    if (!selectedMood || !currentUser) {
      alert("Veuillez sélectionner une humeur");
      return;
    }

    setLoading(true);
    try {
      // Log mood
      await axios.post(`${API}/mood`, {
        user_id: currentUser.id,
        mood: selectedMood,
        intensity: intensity
      });

      // Get AI response
      const aiResponseData = await axios.post(`${API}/ai-response`, {
        user_id: currentUser.id,
        mood: selectedMood,
        intensity: intensity
      });

      setAiResponse(aiResponseData.data);
      setStep("ai-response");
    } catch (error) {
      console.error("Error processing mood:", error);
      alert("Erreur lors du traitement de votre humeur");
    } finally {
      setLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !currentUser || !sessionId) return;

    const userMessage = chatInput.trim();
    setChatInput("");

    // Add user message to chat
    const userChatBubble = {
      id: Date.now(),
      user_message: userMessage,
      ai_response: "",
      timestamp: new Date().toISOString(),
      isUser: true
    };

    setChatMessages(prev => [...prev, userChatBubble]);
    setLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        user_id: currentUser.id,
        session_id: sessionId,
        message: userMessage,
        current_mood: selectedMood,
        mood_intensity: intensity
      });

      // Add AI response to chat
      const aiChatBubble = {
        ...response.data,
        isUser: false
      };

      setChatMessages(prev => [...prev, aiChatBubble]);
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        ai_response: "Désolé, je n'ai pas pu traiter votre message. Veuillez réessayer.",
        timestamp: new Date().toISOString(),
        isUser: false
      }]);
    } finally {
      setLoading(false);
    }
  };

  const resetApp = () => {
    setCurrentUser(null);
    setSelectedMood(null);
    setIntensity(5);
    setAiResponse(null);
    setChatMessages([]);
    setChatInput("");
    setSessionId(null);
    setShowChat(false);
    setUserName("");
    setUserEmail("");
    setStep("welcome");
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800"
      style={{
        backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8)), url('https://images.unsplash.com/photo-1464618663641-bbdd760ae84a?ixlib=rb-4.1.0&q=85')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="container mx-auto px-4 py-8">
        
        {/* Welcome Step */}
        {step === "welcome" && (
          <div className="max-w-md mx-auto bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">🧠 EmotionalCompanion</h1>
              <p className="text-white text-opacity-90">
                Votre compagnon IA pour comprendre et améliorer votre humeur
              </p>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Votre nom"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-70 border border-white border-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              />
              <input
                type="email"
                placeholder="Votre email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-70 border border-white border-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              />
              <button
                onClick={createUser}
                className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 backdrop-blur-sm"
              >
                Commencer 🚀
              </button>
            </div>
          </div>
        )}

        {/* Mood Selection Step */}
        {step === "mood-selection" && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                Bonjour {currentUser?.name} ! 👋
              </h2>
              <p className="text-xl text-white text-opacity-90">
                Comment vous sentez-vous en ce moment ?
              </p>
            </div>

            {/* Mood Circle Selection */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-12">
              {Object.entries(MOODS).map(([mood, moodData]) => (
                <MoodCircle
                  key={mood}
                  mood={mood}
                  moodData={moodData}
                  isSelected={selectedMood === mood}
                  onClick={setSelectedMood}
                />
              ))}
            </div>

            {/* Intensity Slider */}
            {selectedMood && (
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 max-w-lg mx-auto mb-8">
                <IntensitySlider intensity={intensity} onChange={setIntensity} />
              </div>
            )}

            {/* Action Buttons */}
            {selectedMood && (
              <div className="text-center space-x-4">
                <button
                  onClick={handleMoodSelection}
                  disabled={loading}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 backdrop-blur-sm disabled:opacity-50"
                >
                  {loading ? "Analyse en cours..." : "Obtenir des conseils IA 🤖"}
                </button>
                <button
                  onClick={resetApp}
                  className="bg-red-500 bg-opacity-20 hover:bg-opacity-30 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
                >
                  Recommencer
                </button>
              </div>
            )}
          </div>
        )}

        {/* AI Response Step */}
        {step === "ai-response" && aiResponse && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 shadow-2xl mb-8">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">
                  {MOODS[selectedMood]?.emoji}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Vous vous sentez {MOODS[selectedMood]?.label?.toLowerCase()}
                </h3>
                <p className="text-white text-opacity-70">
                  Intensité: {intensity}/10
                </p>
              </div>

              <div className="bg-white bg-opacity-20 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">💝 Votre compagnon IA dit:</h4>
                <p className="text-white text-lg leading-relaxed">
                  {aiResponse.ai_response}
                </p>
              </div>

              <div className="text-center space-x-4">
                <button
                  onClick={() => setStep("chat")}
                  className="bg-green-500 bg-opacity-20 hover:bg-opacity-30 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
                >
                  Continuer la conversation 💬
                </button>
                <button
                  onClick={() => setStep("mood-selection")}
                  className="bg-blue-500 bg-opacity-20 hover:bg-opacity-30 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
                >
                  Changer d'humeur
                </button>
                <button
                  onClick={resetApp}
                  className="bg-red-500 bg-opacity-20 hover:bg-opacity-30 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
                >
                  Recommencer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Step */}
        {step === "chat" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden">
              {/* Chat Header */}
              <div className="bg-white bg-opacity-20 p-4 border-b border-white border-opacity-20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🤖</span>
                    <div>
                      <h3 className="text-white font-semibold">Compagnon IA</h3>
                      <p className="text-white text-opacity-70 text-sm">
                        Humeur: {MOODS[selectedMood]?.label} ({intensity}/10)
                      </p>
                    </div>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => setStep("mood-selection")}
                      className="text-white text-opacity-70 hover:text-opacity-100 text-sm"
                    >
                      Changer humeur
                    </button>
                    <button
                      onClick={resetApp}
                      className="text-red-300 hover:text-red-100 text-sm"
                    >
                      Recommencer
                    </button>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {/* Initial AI message */}
                {aiResponse && (
                  <ChatBubble
                    message={aiResponse.ai_response}
                    isUser={false}
                    timestamp={aiResponse.timestamp}
                  />
                )}
                
                {/* Chat messages */}
                {chatMessages.map((msg, index) => (
                  <ChatBubble
                    key={msg.id || index}
                    message={msg.isUser ? msg.user_message : msg.ai_response}
                    isUser={msg.isUser}
                    timestamp={msg.timestamp}
                  />
                ))}
                
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white bg-opacity-90 text-gray-800 px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-white border-opacity-20">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Écrivez votre message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    className="flex-1 px-4 py-2 rounded-lg bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-70 border border-white border-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={loading || !chatInput.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Envoyer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;