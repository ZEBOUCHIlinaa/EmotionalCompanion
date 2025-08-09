# backend/emergentintegrations/llm/chat.py

class UserMessage:
    def __init__(self, content):
        self.content = content


class LlmChat:
    def __init__(self, user_id=None, mood=None):
        self.user_id = user_id
        self.mood = mood

    def get_ai_response(self, message):
        # Réponse temporaire pour tester la connexion
        return f"[Réponse IA factice] Tu as dit : {message}"

    def start_chat(self):
        return "[Chat IA démarré - version simplifiée]"
