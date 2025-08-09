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
from fastapi import Request
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import traceback

app = FastAPI()

@app.post("/create-profile")
async def create_profile(request: Request):
    try:
        data = await request.json()
        print("📩 Données reçues du frontend :", data)

        # Ici tu mets ton code habituel pour créer le profil
        # Exemple :
        # result = await save_to_db(data)
        # print("✅ Profil sauvegardé :", result)

        return JSONResponse(content={"message": "Profil créé avec succès"}, status_code=200)
    except Exception as e:
        print("❌ Erreur pendant /create-profile :", e)
        traceback.print_exc()
        return JSONResponse(content={"error": str(e)}, status_code=500)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()
# début nouveau
@app.post("/profile")
async def create_profile(request: Request):
    data = await request.json()
    print("Données reçues pour le profil :", data)

    # Réponse simulée
    return {
        "message": "Profil créé avec succès (mode test)",
        "data": data
    }

@app.post("/login")
async def login(request: Request):
    data = await request.json()
    print("Tentative de connexion :", data)

    # Simulation de vérification
    if data.get("email") == "test@example.com" and data.get("password") == "1234":
        return {
            "message": "Connexion réussie (mode test)",
            "user": {
                "id": "fake-user-id",
                "name": "Utilisateur Test",
                "email": data["email"]
            }
        }
    else:
        return {
            "message": "Email ou mot de passe incorrect (mode test)"
        }
# fin nouveau
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

def get_fallback_emotional_response(mood: str, intensity: int, message: Optional[str] = None):
    """Generate intelligent fallback responses when OpenAI is unavailable"""
    
    fallback_responses = {
        "sad": [
            "Je comprends que tu traverses un moment difficile. Rappelle-toi que ces sentiments sont temporaires et que tu as la force de les surmonter.",
            "Il est normal de se sentir triste parfois. Prends le temps de respirer profondément et sois bienveillant envers toi-même.",
            "Ta tristesse est valide. Essaie de faire quelque chose de doux pour toi aujourd'hui, même quelque chose de petit."
        ],
        "anxious": [
            "L'anxiété peut être difficile, mais tu peux la gérer. Essaie de respirer lentement : inspire 4 secondes, retiens 4 secondes, expire 4 secondes.",
            "Je sens ton inquiétude. Concentre-toi sur le moment présent et rappelle-toi que tu as déjà surmonté des défis auparavant.",
            "L'anxiété est comme une vague - elle monte mais elle redescend toujours. Tu es plus fort que tu ne le penses."
        ],
        "angry": [
            "Ta colère est compréhensible. Prends quelques respirations profondes et essaie de canaliser cette énergie de manière constructive.",
            "Il est normal de ressentir de la colère. Essaie de faire de l'exercice ou d'écrire tes pensées pour libérer cette tension.",
            "Je vois que tu es frustré. Prends un moment pour toi, cette émotion intense va s'apaiser."
        ],
        "happy": [
            "C'est merveilleux de te voir si joyeux ! Profite pleinement de ce moment de bonheur, tu le mérites.",
            "Ta joie est contagieuse ! Continue à cultiver cette belle énergie positive.",
            "Quel plaisir de sentir ta bonne humeur ! Partage cette joie avec les personnes qui t'entourent."
        ],
        "excited": [
            "Ton enthousiasme est formidable ! Canalise cette belle énergie dans quelque chose qui te passionne.",
            "J'adore ton excitation ! Profite de cette motivation pour réaliser tes projets.",
            "Cette énergie positive est magnifique ! Utilise-la pour créer quelque chose d'extraordinaire."
        ],
        "calm": [
            "Cette sérénité que tu ressens est précieuse. Savoure ce moment de paix intérieure.",
            "Ton calme est apaisant. Profite de cette tranquillité pour te reconnecter avec toi-même.",
            "Cette paix que tu ressens est un cadeau. Garde cette sensation avec toi."
        ],
        "tired": [
            "Je sens ta fatigue. Il est important d'écouter ton corps et de te reposer quand tu en as besoin.",
            "Prends soin de toi. Un peu de repos et de douceur t'aideront à retrouver ton énergie.",
            "Ta fatigue est un signal de ton corps. Accorde-toi du temps pour récupérer."
        ],
        "confused": [
            "Il est normal de se sentir perdu parfois. Prends le temps de réfléchir, les réponses viendront.",
            "La confusion fait partie du processus de compréhension. Sois patient avec toi-même.",
            "Quand tout semble flou, concentre-toi sur une chose à la fois. La clarté reviendra."
        ],
        "proud": [
            "Ta fierté est méritée ! Célèbre tes accomplissements, tu as travaillé dur pour cela.",
            "C'est formidable de te voir si fier ! Continue sur cette lancée, tu es sur la bonne voie.",
            "Tes réussites méritent d'être célébrées. Sois fier du chemin parcouru !"
        ]
    }
    
    # Get responses for the mood, with fallback to general supportive messages
    responses = fallback_responses.get(mood.lower(), [
        "Je suis là pour t'accompagner dans ce que tu ressens. Tes émotions sont importantes et valides.",
        "Merci de partager tes sentiments avec moi. Tu n'es pas seul dans ce que tu traverses.",
        "Chaque émotion a sa place et son importance. Je suis là pour t'écouter et te soutenir."
    ])
    
    # Adjust response based on intensity
    if intensity <= 3:
        # Light intensity - gentle encouragement
        base_response = responses[0] if len(responses) > 0 else responses[0]
    elif intensity <= 6:
        # Moderate intensity - more supportive
        base_response = responses[1] if len(responses) > 1 else responses[0]
    else:
        # High intensity - strong support
        base_response = responses[2] if len(responses) > 2 else responses[-1]
    
    # Add personalized touch if user provided a message
    if message:
        base_response += f" Je comprends que tu veuilles partager : '{message[:50]}{'...' if len(message) > 50 else ''}'."
    
    return base_response

def get_chat_fallback_response(message: str, mood: str, intensity: int):
    """Generate intelligent fallback responses for chat when OpenAI is unavailable"""
    
    # Use the existing fallback response function as base
    base_response = get_fallback_emotional_response(mood, intensity, message)
    
    # Add conversational elements for chat context
    chat_starters = [
        "Merci de partager cela avec moi. ",
        "Je t'écoute. ",
        "C'est important ce que tu me dis. ",
        "Je comprends. "
    ]
    
    # Select starter based on mood intensity
    if intensity <= 3:
        starter = chat_starters[0]
    elif intensity <= 6:
        starter = chat_starters[1]
    else:
        starter = chat_starters[2]
    
    return starter + base_response

# API Routes
#@api_router.post("/users", response_model=User)
#async def create_user(user_data: UserCreate):
#    """Create a new user"""
#    user = User(**user_data.dict())
#   await db.users.insert_one(user.dict())
#    return user
# API Routes

@api_router.post("/create-profile", response_model=User)
async def create_profile(user_data: UserCreate):
    """Create a new user"""
    user = User(**user_data.dict())
    await db.users.insert_one(user.dict())
    return user
@api_router.post("/users", response_model=User)
async def create_user_alias(user_data: UserCreate):
    # Appeler directement la fonction existante
    return await create_profile(user_data)

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
    """Get AI response based on user's mood - with fallback for OpenAI quota issues"""
    try:
        # Try OpenAI integration first
        if OPENAI_API_KEY:
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
                ai_response_text = await chat.send_message(user_message)
                
            except Exception as openai_error:
                # Fallback to intelligent mock responses if OpenAI fails
                logging.warning(f"OpenAI error, using fallback: {str(openai_error)}")
                ai_response_text = get_fallback_emotional_response(request.mood, request.intensity, request.message)
        else:
            # Use fallback if no API key
            ai_response_text = get_fallback_emotional_response(request.mood, request.intensity, request.message)
        
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
    """Continue conversation with AI companion - with fallback for OpenAI quota issues"""
    try:
        # Try OpenAI integration first
        if OPENAI_API_KEY:
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
                
            except Exception as openai_error:
                # Fallback to intelligent mock responses if OpenAI fails
                logging.warning(f"OpenAI error in chat, using fallback: {str(openai_error)}")
                ai_response_text = get_chat_fallback_response(request.message, request.current_mood, request.mood_intensity)
        else:
            # Use fallback if no API key
            ai_response_text = get_chat_fallback_response(request.message, request.current_mood, request.mood_intensity)
        
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