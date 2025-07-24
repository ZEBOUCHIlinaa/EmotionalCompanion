from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: str
    name: str

class MoodEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    mood: str  # happy, sad, anxious, calm, excited, angry, etc.
    intensity: int  # 1-10 scale
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class MoodEntryCreate(BaseModel):
    user_id: str
    mood: str
    intensity: int

class AIResponseRequest(BaseModel):
    user_id: str
    mood: str
    intensity: int
    message: Optional[str] = None

class AIResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    mood: str
    intensity: int
    ai_response: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_id: str
    user_message: str
    ai_response: str
    mood_context: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    user_id: str
    session_id: str
    message: str
    current_mood: str
    mood_intensity: int

# Initialize OpenAI client
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')

def get_emotional_system_message(mood: str, intensity: int):
    """Generate system message based on mood and intensity"""
    
    emotional_guidance = {
        "sad": "Tu es un compagnon émotionnel bienveillant et empathique. L'utilisateur se sent triste. Offre du réconfort, de la compréhension et des conseils doux pour l'aider à se sentir mieux. Propose des exercices de respiration, des pensées positives, ou des activités apaisantes.",
        "anxious": "Tu es un compagnon émotionnel calme et rassurant. L'utilisateur est anxieux. Aide-le à se détendre avec des techniques de respiration, de la pleine conscience, et des paroles apaisantes. Rappelle-lui que l'anxiété est temporaire.",
        "angry": "Tu es un compagnon émotionnel patient et compréhensif. L'utilisateur est en colère. Aide-le à canaliser cette émotion de manière constructive. Propose des techniques de relaxation et d'expression saine de la colère.",
        "happy": "Tu es un compagnon émotionnel joyeux et encourageant. L'utilisateur est heureux ! Célèbre avec lui, encourage cette énergie positive, et propose des activités ou défis qui maintiennent cette belle humeur.",
        "excited": "Tu es un compagnon émotionnel dynamique et motivant. L'utilisateur est excité ! Nourris cette énergie positive, propose des projets stimulants ou des défis créatifs qui canalisent cette excitation.",
        "calm": "Tu es un compagnon émotionnel paisible et sage. L'utilisateur se sent calme. Renforce ce sentiment de sérénité, propose des moments de méditation ou de réflexion pour approfondir cette paix intérieure.",
        "tired": "Tu es un compagnon émotionnel doux et réconfortant. L'utilisateur est fatigué. Encourage le repos, propose des techniques de relaxation, et rappelle l'importance de prendre soin de soi.",
        "confused": "Tu es un compagnon émotionnel patient et éclairant. L'utilisateur se sent confus. Aide-le à clarifier ses pensées, pose des questions bienveillantes pour l'aider à voir plus clair.",
        "proud": "Tu es un compagnon émotionnel admiratif et encourageant. L'utilisateur se sent fier ! Célèbre ses accomplissements, renforce sa confiance en lui, et encourage cette fierté méritée."
    }
    
    base_message = emotional_guidance.get(mood.lower(), 
        "Tu es un compagnon émotionnel bienveillant qui s'adapte à tous les états émotionnels avec empathie et sagesse.")
    
    intensity_guidance = ""
    if intensity <= 3:
        intensity_guidance = " L'émotion est légère, accompagne avec douceur."
    elif intensity <= 6:
        intensity_guidance = " L'émotion est modérée, sois présent et attentif."
    else:
        intensity_guidance = " L'émotion est intense, sois particulièrement bienveillant et offre un soutien fort."
    
    return base_message + intensity_guidance + " Réponds toujours en français avec chaleur et authenticité. Limite tes réponses à 2-3 phrases maximum pour rester accessible."

# API Routes
@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    """Create a new user"""
    user = User(**user_data.dict())
    await db.users.insert_one(user.dict())
    return user

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Get user by ID"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

@api_router.post("/mood", response_model=MoodEntry)
async def log_mood(mood_data: MoodEntryCreate):
    """Log a mood entry"""
    mood_entry = MoodEntry(**mood_data.dict())
    await db.mood_entries.insert_one(mood_entry.dict())
    return mood_entry

@api_router.get("/mood/{user_id}", response_model=List[MoodEntry])
async def get_user_moods(user_id: str, limit: int = 10):
    """Get user's recent mood entries"""
    moods = await db.mood_entries.find(
        {"user_id": user_id}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    return [MoodEntry(**mood) for mood in moods]

@api_router.post("/ai-response", response_model=AIResponse)
async def get_ai_response(request: AIResponseRequest):
    """Get AI response based on user's mood"""
    try:
        # Create system message based on mood
        system_message = get_emotional_system_message(request.mood, request.intensity)
        
        # Initialize LLM chat
        chat = LlmChat(
            api_key=OPENAI_API_KEY,
            session_id=f"mood-{request.user_id}-{datetime.utcnow().timestamp()}",
            system_message=system_message
        ).with_model("openai", "gpt-4o").with_max_tokens(200)
        
        # Prepare user message
        if request.message:
            user_text = f"Je me sens {request.mood} (intensité: {request.intensity}/10). {request.message}"
        else:
            user_text = f"Je me sens {request.mood} avec une intensité de {request.intensity}/10. Peux-tu m'aider ?"
        
        user_message = UserMessage(text=user_text)
        
        # Get AI response
        ai_response_text = await chat.send_message(user_message)
        
        # Save to database
        ai_response = AIResponse(
            user_id=request.user_id,
            mood=request.mood,
            intensity=request.intensity,
            ai_response=ai_response_text
        )
        
        await db.ai_responses.insert_one(ai_response.dict())
        
        return ai_response
        
    except Exception as e:
        logging.error(f"Error generating AI response: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating AI response")

@api_router.post("/chat", response_model=ChatMessage)
async def chat_with_ai(request: ChatRequest):
    """Continue conversation with AI companion"""
    try:
        system_message = get_emotional_system_message(request.current_mood, request.mood_intensity)
        
        # Initialize chat with session ID for conversation continuity
        chat = LlmChat(
            api_key=OPENAI_API_KEY,
            session_id=request.session_id,
            system_message=system_message
        ).with_model("openai", "gpt-4o").with_max_tokens(250)
        
        user_message = UserMessage(text=request.message)
        ai_response_text = await chat.send_message(user_message)
        
        # Save chat message
        chat_message = ChatMessage(
            user_id=request.user_id,
            session_id=request.session_id,
            user_message=request.message,
            ai_response=ai_response_text,
            mood_context=f"{request.current_mood}-{request.mood_intensity}"
        )
        
        await db.chat_messages.insert_one(chat_message.dict())
        
        return chat_message
        
    except Exception as e:
        logging.error(f"Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail="Error in chat")

@api_router.get("/chat/{session_id}", response_model=List[ChatMessage])
async def get_chat_history(session_id: str, limit: int = 20):
    """Get chat history for a session"""
    messages = await db.chat_messages.find(
        {"session_id": session_id}
    ).sort("timestamp", 1).limit(limit).to_list(limit)
    return [ChatMessage(**msg) for msg in messages]

# Health check
@api_router.get("/")
async def root():
    return {"message": "EmotionalCompanion API is running", "status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()