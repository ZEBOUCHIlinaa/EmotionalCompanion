#!/usr/bin/env python3
"""
Backend API Testing for EmotionalCompanion
Tests all backend endpoints systematically
"""

import requests
import json
import uuid
import time
from datetime import datetime
from typing import Dict, Any

# Configuration
BASE_URL = "https://2133bdb5-b59a-4267-bbe9-6cb30cff5b5b.preview.emergentagent.com/api"
TIMEOUT = 30

# Test data
MOODS = ["happy", "sad", "anxious", "calm", "excited", "angry", "tired", "confused", "proud"]
INTENSITIES = [1, 3, 5, 7, 10]

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = {}
        self.test_user_id = None
        self.test_session_id = str(uuid.uuid4())
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        self.test_results[test_name] = {
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def test_health_check(self):
        """Test basic health check endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}/", timeout=TIMEOUT)
            if response.status_code == 200:
                data = response.json()
                if "status" in data and data["status"] == "healthy":
                    self.log_test("Health Check", True, "API is healthy and responding")
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected response format: {data}")
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
        return False
    
    def test_user_creation(self):
        """Test user creation endpoint"""
        try:
            user_data = {
                "name": "Marie Dubois",
                "email": "marie.dubois@example.fr"
            }
            
            response = self.session.post(
                f"{BASE_URL}/users",
                json=user_data,
                timeout=TIMEOUT
            )
            
            if response.status_code == 200:
                data = response.json()
                # Validate UUID format
                try:
                    uuid.UUID(data["id"])
                    self.test_user_id = data["id"]
                    self.log_test("User Creation", True, f"User created with UUID: {data['id']}", data)
                    return True
                except ValueError:
                    self.log_test("User Creation", False, f"Invalid UUID format: {data.get('id')}")
            else:
                self.log_test("User Creation", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("User Creation", False, f"Error: {str(e)}")
        return False
    
    def test_user_retrieval(self):
        """Test user retrieval endpoint"""
        if not self.test_user_id:
            self.log_test("User Retrieval", False, "No test user ID available")
            return False
            
        try:
            response = self.session.get(
                f"{BASE_URL}/users/{self.test_user_id}",
                timeout=TIMEOUT
            )
            
            if response.status_code == 200:
                data = response.json()
                if data["id"] == self.test_user_id and "name" in data and "email" in data:
                    self.log_test("User Retrieval", True, f"User retrieved successfully: {data['name']}", data)
                    return True
                else:
                    self.log_test("User Retrieval", False, f"Data mismatch: {data}")
            else:
                self.log_test("User Retrieval", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("User Retrieval", False, f"Error: {str(e)}")
        return False
    
    def test_mood_logging(self):
        """Test mood logging with various moods and intensities"""
        if not self.test_user_id:
            self.log_test("Mood Logging", False, "No test user ID available")
            return False
            
        success_count = 0
        total_tests = 0
        
        for mood in MOODS[:3]:  # Test first 3 moods to save time
            for intensity in [1, 5, 10]:  # Test low, medium, high intensity
                total_tests += 1
                try:
                    mood_data = {
                        "user_id": self.test_user_id,
                        "mood": mood,
                        "intensity": intensity
                    }
                    
                    response = self.session.post(
                        f"{BASE_URL}/mood",
                        json=mood_data,
                        timeout=TIMEOUT
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        if data["mood"] == mood and data["intensity"] == intensity:
                            success_count += 1
                        else:
                            print(f"   Data mismatch for {mood}-{intensity}: {data}")
                    else:
                        print(f"   Failed {mood}-{intensity}: HTTP {response.status_code}")
                        
                except Exception as e:
                    print(f"   Error testing {mood}-{intensity}: {str(e)}")
        
        success = success_count == total_tests
        self.log_test("Mood Logging", success, f"Logged {success_count}/{total_tests} mood entries successfully")
        return success
    
    def test_mood_retrieval(self):
        """Test mood retrieval for user"""
        if not self.test_user_id:
            self.log_test("Mood Retrieval", False, "No test user ID available")
            return False
            
        try:
            response = self.session.get(
                f"{BASE_URL}/mood/{self.test_user_id}",
                timeout=TIMEOUT
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Validate mood entry structure
                    first_entry = data[0]
                    if all(key in first_entry for key in ["id", "user_id", "mood", "intensity", "timestamp"]):
                        self.log_test("Mood Retrieval", True, f"Retrieved {len(data)} mood entries", data[:2])
                        return True
                    else:
                        self.log_test("Mood Retrieval", False, f"Invalid mood entry structure: {first_entry}")
                else:
                    self.log_test("Mood Retrieval", False, "No mood entries found or invalid format")
            else:
                self.log_test("Mood Retrieval", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Mood Retrieval", False, f"Error: {str(e)}")
        return False
    
    def test_ai_response_generation(self):
        """Test AI response generation with OpenAI integration"""
        if not self.test_user_id:
            self.log_test("AI Response Generation", False, "No test user ID available")
            return False
            
        success_count = 0
        total_tests = 0
        
        # Test different moods and intensities
        test_cases = [
            ("sad", 8, "Je me sens vraiment triste aujourd'hui"),
            ("happy", 6, "Je suis content de cette belle journée"),
            ("anxious", 9, "J'ai beaucoup d'anxiété avant mon examen")
        ]
        
        for mood, intensity, message in test_cases:
            total_tests += 1
            try:
                ai_request = {
                    "user_id": self.test_user_id,
                    "mood": mood,
                    "intensity": intensity,
                    "message": message
                }
                
                response = self.session.post(
                    f"{BASE_URL}/ai-response",
                    json=ai_request,
                    timeout=TIMEOUT
                )
                
                if response.status_code == 200:
                    data = response.json()
                    ai_response = data.get("ai_response", "")
                    
                    # Validate response structure and French content
                    if (data["mood"] == mood and 
                        data["intensity"] == intensity and 
                        len(ai_response) > 10 and
                        any(french_word in ai_response.lower() for french_word in ["tu", "vous", "je", "le", "la", "de", "et"])):
                        success_count += 1
                        print(f"   ✅ {mood}-{intensity}: {ai_response[:100]}...")
                    else:
                        print(f"   ❌ {mood}-{intensity}: Invalid response format or not French")
                else:
                    print(f"   ❌ {mood}-{intensity}: HTTP {response.status_code}")
                    
            except Exception as e:
                print(f"   ❌ Error testing {mood}-{intensity}: {str(e)}")
        
        success = success_count == total_tests
        self.log_test("AI Response Generation", success, f"Generated {success_count}/{total_tests} AI responses successfully")
        return success
    
    def test_chat_system(self):
        """Test chat system with session management"""
        if not self.test_user_id:
            self.log_test("Chat System", False, "No test user ID available")
            return False
            
        try:
            # Test first chat message
            chat_request = {
                "user_id": self.test_user_id,
                "session_id": self.test_session_id,
                "message": "Bonjour, comment allez-vous ?",
                "current_mood": "calm",
                "mood_intensity": 5
            }
            
            response = self.session.post(
                f"{BASE_URL}/chat",
                json=chat_request,
                timeout=TIMEOUT
            )
            
            if response.status_code == 200:
                data = response.json()
                ai_response = data.get("ai_response", "")
                
                if (data["session_id"] == self.test_session_id and
                    len(ai_response) > 5 and
                    any(french_word in ai_response.lower() for french_word in ["bonjour", "salut", "comment", "ça", "va"])):
                    
                    # Test second message for session continuity
                    chat_request2 = {
                        "user_id": self.test_user_id,
                        "session_id": self.test_session_id,
                        "message": "Merci pour votre réponse précédente",
                        "current_mood": "happy",
                        "mood_intensity": 7
                    }
                    
                    response2 = self.session.post(
                        f"{BASE_URL}/chat",
                        json=chat_request2,
                        timeout=TIMEOUT
                    )
                    
                    if response2.status_code == 200:
                        self.log_test("Chat System", True, "Chat system working with session continuity", data)
                        return True
                    else:
                        self.log_test("Chat System", False, f"Second message failed: HTTP {response2.status_code}")
                else:
                    self.log_test("Chat System", False, f"Invalid chat response: {data}")
            else:
                self.log_test("Chat System", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Chat System", False, f"Error: {str(e)}")
        return False
    
    def test_chat_history(self):
        """Test chat history retrieval"""
        try:
            response = self.session.get(
                f"{BASE_URL}/chat/{self.test_session_id}",
                timeout=TIMEOUT
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) >= 2:  # Should have at least 2 messages from chat test
                    first_message = data[0]
                    if all(key in first_message for key in ["id", "user_id", "session_id", "user_message", "ai_response"]):
                        self.log_test("Chat History", True, f"Retrieved {len(data)} chat messages", data[:1])
                        return True
                    else:
                        self.log_test("Chat History", False, f"Invalid message structure: {first_message}")
                else:
                    self.log_test("Chat History", False, f"Expected at least 2 messages, got {len(data) if isinstance(data, list) else 'invalid format'}")
            else:
                self.log_test("Chat History", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Chat History", False, f"Error: {str(e)}")
        return False
    
    def run_all_tests(self):
        """Run all backend tests in sequence"""
        print(f"🚀 Starting EmotionalCompanion Backend API Tests")
        print(f"📍 Base URL: {BASE_URL}")
        print("=" * 60)
        
        # Test sequence following priority order
        tests = [
            ("Health Check", self.test_health_check),
            ("User Creation", self.test_user_creation),
            ("User Retrieval", self.test_user_retrieval),
            ("Mood Logging", self.test_mood_logging),
            ("Mood Retrieval", self.test_mood_retrieval),
            ("AI Response Generation", self.test_ai_response_generation),
            ("Chat System", self.test_chat_system),
            ("Chat History", self.test_chat_history),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n🧪 Running {test_name}...")
            if test_func():
                passed += 1
            time.sleep(1)  # Brief pause between tests
        
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All backend tests PASSED!")
        else:
            print(f"⚠️  {total - passed} tests FAILED")
            
        return passed, total, self.test_results

def main():
    """Main test execution"""
    tester = BackendTester()
    passed, total, results = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            "summary": {"passed": passed, "total": total, "success_rate": passed/total},
            "detailed_results": results,
            "test_timestamp": datetime.now().isoformat()
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to backend_test_results.json")
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)