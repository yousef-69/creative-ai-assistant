from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
import os
import subprocess
from pathlib import Path
from dotenv import load_dotenv
from ibm_watsonx_ai.foundation_models import Model
from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams
import requests
from bs4 import BeautifulSoup
import json
import uuid
import base64

# Load environment variables
load_dotenv()

app = FastAPI(
    title="TrendCraft AI",
    description="AI-powered content creation and trend analysis platform",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# IBM watsonx.ai credentials
WATSONX_API_KEY = os.getenv("WATSONX_API_KEY")
WATSONX_PROJECT_ID = os.getenv("WATSONX_PROJECT_ID")
WATSONX_URL = os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")

# Create directories for uploads and frames
UPLOAD_DIR = Path("uploads")
FRAMES_DIR = Path("frames")
UPLOAD_DIR.mkdir(exist_ok=True)
FRAMES_DIR.mkdir(exist_ok=True)

# Initialize watsonx.ai model
def get_watsonx_model():
    """Initialize and return IBM Granite model"""
    credentials = {
        "url": WATSONX_URL,
        "apikey": WATSONX_API_KEY
    }
    
    model_id = "ibm/granite-13b-instruct-v2"
    
    parameters = {
        GenParams.DECODING_METHOD: "greedy",
        GenParams.MAX_NEW_TOKENS: 1000,
        GenParams.MIN_NEW_TOKENS: 1,
        GenParams.TEMPERATURE: 0.7,
        GenParams.TOP_K: 50,
        GenParams.TOP_P: 1
    }
    
    model = Model(
        model_id=model_id,
        params=parameters,
        credentials=credentials,
        project_id=WATSONX_PROJECT_ID
    )
    
    return model

# Request models
class AnalyzeRequest(BaseModel):
    url: HttpUrl

class GenerateRequest(BaseModel):
    prompt: str
    content_type: Optional[str] = "general"
    tone: Optional[str] = "professional"
    length: Optional[int] = 500

class VideoUploadRequest(BaseModel):
    filename: str
    video_data: str  # base64 encoded video

# Response models
class HealthResponse(BaseModel):
    status: str
    message: str

class AnalyzeResponse(BaseModel):
    url: str
    trends: list[str]
    sentiment: str
    keywords: list[str]

class GenerateResponse(BaseModel):
    content: str
    word_count: int
    content_type: str

class VideoUploadResponse(BaseModel):
    video_id: str
    filename: str
    duration: float
    size_mb: float
    platform: str
    frames: List[str]
    shot_list: List[dict]

def analyze_url_structure(url: str) -> dict:
    """
    Analyze URL structure to extract platform, keywords, and generate smart insights.
    This is instant and doesn't require external API calls.
    """
    from urllib.parse import urlparse, unquote
    import re
    
    parsed = urlparse(url)
    domain = parsed.netloc.replace('www.', '').lower()
    path = parsed.path.lower()
    
    # Extract keywords from path
    path_parts = [part for part in path.split('/') if part]
    path_keywords = []
    for part in path_parts:
        # Decode URL encoding
        decoded = unquote(part)
        # Split on common separators and filter
        words = re.findall(r'\b[a-zA-Z]{3,}\b', decoded.replace('-', ' ').replace('_', ' '))
        path_keywords.extend([w.lower() for w in words])
    
    # Remove common words
    common_words = {'the', 'and', 'for', 'with', 'from', 'this', 'that', 'are', 'was', 'were', 'been', 'have', 'has'}
    path_keywords = [k for k in path_keywords if k not in common_words]
    
    # Determine platform and generate platform-specific insights
    platform_data = {
        "platform": "Web Content",
        "trends": ["Digital Content", "Online Media", "Web Trends"],
        "sentiment": "neutral",
        "base_keywords": ["digital", "content", "online"]
    }
    
    if 'instagram' in domain:
        platform_data = {
            "platform": "Instagram",
            "trends": ["Instagram Reels", "Visual Storytelling", "Social Engagement"],
            "sentiment": "positive",
            "base_keywords": ["instagram", "social", "visual", "engagement", "reels"]
        }
    elif 'tiktok' in domain:
        platform_data = {
            "platform": "TikTok",
            "trends": ["Viral Videos", "Short-Form Content", "TikTok Trends"],
            "sentiment": "positive",
            "base_keywords": ["tiktok", "viral", "video", "trending", "fyp"]
        }
    elif 'youtube' in domain:
        platform_data = {
            "platform": "YouTube",
            "trends": ["Video Content", "YouTube Shorts", "Creator Economy"],
            "sentiment": "positive",
            "base_keywords": ["youtube", "video", "content", "creator", "subscribe"]
        }
    elif 'twitter' in domain or 'x.com' in domain:
        platform_data = {
            "platform": "Twitter/X",
            "trends": ["Social Commentary", "Real-Time Updates", "Viral Tweets"],
            "sentiment": "neutral",
            "base_keywords": ["twitter", "social", "trending", "viral", "tweet"]
        }
    elif 'facebook' in domain:
        platform_data = {
            "platform": "Facebook",
            "trends": ["Social Networking", "Community Content", "Facebook Stories"],
            "sentiment": "positive",
            "base_keywords": ["facebook", "social", "community", "share", "connect"]
        }
    elif 'linkedin' in domain:
        platform_data = {
            "platform": "LinkedIn",
            "trends": ["Professional Networking", "Career Growth", "Industry Insights"],
            "sentiment": "professional",
            "base_keywords": ["linkedin", "professional", "career", "business", "network"]
        }
    
    # Combine path keywords with base keywords
    all_keywords = path_keywords[:3] + platform_data["base_keywords"]
    # Remove duplicates while preserving order
    seen = set()
    unique_keywords = []
    for k in all_keywords:
        if k not in seen:
            seen.add(k)
            unique_keywords.append(k)
    
    # Enhance trends with path keywords if available
    if path_keywords:
        # Capitalize first keyword for trend
        enhanced_trend = ' '.join(path_keywords[:2]).title()
        if enhanced_trend and len(enhanced_trend) > 3:
            platform_data["trends"][0] = f"{enhanced_trend} on {platform_data['platform']}"
    
    return {
        "platform": platform_data["platform"],
        "trends": platform_data["trends"],
        "sentiment": platform_data["sentiment"],
        "keywords": unique_keywords[:5]
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint to verify the API is running.
    """
    return {
        "status": "healthy",
        "message": "TrendCraft AI API is running successfully"
    }

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_url(request: AnalyzeRequest):
    """
    Analyze a URL for trends, sentiment, and keywords based on URL structure.
    This is instant and doesn't require external API calls.
    
    Args:
        request: AnalyzeRequest containing the URL to analyze
        
    Returns:
        AnalyzeResponse with trends, sentiment, and keywords
    """
    try:
        url_str = str(request.url)
        
        # Analyze URL structure (instant, no external calls)
        analysis = analyze_url_structure(url_str)
        
        return {
            "url": url_str,
            "trends": analysis["trends"],
            "sentiment": analysis["sentiment"],
            "keywords": analysis["keywords"]
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

def generate_smart_content(prompt: str, tone: str, content_type: str) -> str:
    """
    Generate smart content based on trends and keywords from the prompt.
    This creates varied content without external API calls.
    """
    import re
    
    # Extract key information from prompt
    prompt_lower = prompt.lower()
    
    # Detect platform
    platform = "social media"
    if "instagram" in prompt_lower:
        platform = "Instagram"
    elif "tiktok" in prompt_lower:
        platform = "TikTok"
    elif "youtube" in prompt_lower:
        platform = "YouTube"
    elif "twitter" in prompt_lower or "x.com" in prompt_lower:
        platform = "Twitter"
    
    # Extract trends/keywords from prompt
    trends_match = re.search(r'trends?:\s*([^.]+)', prompt_lower)
    keywords_match = re.search(r'keywords?:\s*([^.]+)', prompt_lower)
    
    trends = []
    keywords = []
    
    if trends_match:
        trends = [t.strip() for t in trends_match.group(1).split(',')]
    if keywords_match:
        keywords = [k.strip() for k in keywords_match.group(1).split(',')]
    
    # Combine for content generation
    main_topic = trends[0] if trends else (keywords[0] if keywords else "trending content")
    
    # Generate caption based on tone and topic
    captions = {
        "enthusiastic": f"🔥 This is HUGE! {main_topic.title()} is taking over {platform} and you need to see this! The engagement is off the charts and creators are seeing massive growth. Don't miss out on this trend! 💯",
        "professional": f"Analyzing the latest {main_topic} trend on {platform}. This represents a significant shift in content strategy and audience engagement. Here's what you need to know to stay ahead of the curve.",
        "positive": f"✨ Loving this new {main_topic} trend on {platform}! It's bringing so much creativity and authentic connection to our feeds. Here's how you can join the movement and create amazing content! 🚀"
    }
    
    caption = captions.get(tone, captions["professional"])
    
    # Generate hashtags based on platform and topic
    base_hashtags = []
    if platform == "Instagram":
        base_hashtags = ["#InstagramReels", "#InstaGrowth", "#ContentCreator", "#ViralContent"]
    elif platform == "TikTok":
        base_hashtags = ["#TikTokTrends", "#FYP", "#Viral", "#TikTokCreator"]
    elif platform == "YouTube":
        base_hashtags = ["#YouTubeShorts", "#ContentCreation", "#VideoMarketing", "#CreatorEconomy"]
    else:
        base_hashtags = ["#SocialMedia", "#ContentStrategy", "#DigitalMarketing", "#Trending"]
    
    # Add topic-specific hashtags
    topic_words = main_topic.replace(' ', '').split()
    topic_hashtags = [f"#{word.title()}" for word in topic_words[:2]]
    
    all_hashtags = topic_hashtags + base_hashtags + ["#ContentCreation", "#GrowthHacking"]
    hashtags = all_hashtags[:8]
    
    # Generate script based on topic
    hook = f"Hook: Start with a bold statement or question about {main_topic} that immediately grabs attention. Use trending audio or visual effect to stop the scroll."
    
    value = f"Value: Deliver 3 key insights about {main_topic} that your audience can immediately apply. Show real examples or demonstrate the concept in action. Keep it fast-paced and engaging."
    
    cta = f"CTA: End with a clear call-to-action - ask viewers to follow for more {main_topic} content, share their thoughts in comments, or tag someone who needs to see this. Create urgency and community."
    
    # Suggest music based on tone and platform
    music_styles = {
        "enthusiastic": "Upbeat electronic music with high energy beats - think trending TikTok sounds with fast tempo",
        "professional": "Modern corporate background music - clean, sophisticated, and non-distracting",
        "positive": "Feel-good indie pop with uplifting melody - creates emotional connection and positive vibes"
    }
    
    music = music_styles.get(tone, "Trending audio that matches your content theme and platform algorithm preferences")
    
    # Format the complete content
    content = f"""Caption for Instagram/TikTok: {caption}

Suggested Hashtags: {' '.join(hashtags)}

Content Script (3 Scenes):
Scene 1: {hook}

Scene 2: {value}

Scene 3: {cta}

Recommended Music Style: {music}"""
    
    return content

@app.post("/generate", response_model=GenerateResponse)
async def generate_content(request: GenerateRequest):
    """
    Generate AI-powered content based on trends and keywords.
    Currently uses smart pre-generated content. IBM Granite integration ready for later.
    
    Args:
        request: GenerateRequest with prompt, content_type, tone, and length
        
    Returns:
        GenerateResponse with generated content and metadata
    """
    try:
        # Generate smart content without external API calls
        tone = request.tone or "professional"
        content_type = request.content_type or "social_media"
        response = generate_smart_content(request.prompt, tone, content_type)
        
        # Count words
        word_count = len(response.split())
        
        return {
            "content": response,
            "word_count": word_count,
            "content_type": request.content_type
        }
        
        # IBM Granite AI integration (commented out for now, ready to enable later)
        """
        # Initialize Granite model
        model = get_watsonx_model()
        
        # Create content generation prompt
        generation_prompt = f'''You are a professional social media content creator. Based on the following information, create engaging content for Instagram/TikTok.

{request.prompt}

Content Type: {request.content_type}
Tone: {request.tone}

Please provide:

1. Caption for Instagram/TikTok: (Write an engaging 2-3 sentence caption)

2. Suggested Hashtags: (Provide 6-8 relevant hashtags)

3. Content Script (3 Scenes):
Scene 1: Hook - (Describe the opening hook to grab attention)
Scene 2: Value - (Describe the main content that delivers value)
Scene 3: CTA - (Describe the call-to-action to encourage engagement)

4. Recommended Music Style: (Suggest appropriate background music style)

Generate the content now:'''
        
        # Generate content using Granite
        response = model.generate_text(prompt=generation_prompt)
        
        # Count words
        word_count = len(response.split())
        
        return {
            "content": response,
            "word_count": word_count,
            "content_type": request.content_type
        }
        """
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")

def extract_video_metadata(video_path: str) -> dict:
    """Extract video metadata using ffprobe"""
    try:
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration,size',
            '-of', 'json',
            video_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        data = json.loads(result.stdout)
        
        duration = float(data['format'].get('duration', 0))
        size_bytes = int(data['format'].get('size', 0))
        size_mb = size_bytes / (1024 * 1024)
        
        return {
            'duration': duration,
            'size_mb': round(size_mb, 2)
        }
    except Exception as e:
        return {
            'duration': 0.0,
            'size_mb': 0.0
        }

def extract_frames(video_path: str, video_id: str, num_frames: int = 5) -> List[str]:
    """Extract key frames from video using ffmpeg"""
    try:
        # Get video duration first
        metadata = extract_video_metadata(video_path)
        duration = metadata['duration']
        
        if duration <= 0:
            return []
        
        # Calculate frame timestamps
        interval = duration / (num_frames + 1)
        frame_paths = []
        
        for i in range(1, num_frames + 1):
            timestamp = interval * i
            frame_filename = f"{video_id}_frame_{i}.jpg"
            frame_path = FRAMES_DIR / frame_filename
            
            cmd = [
                'ffmpeg',
                '-ss', str(timestamp),
                '-i', video_path,
                '-vframes', '1',
                '-q:v', '2',
                '-y',
                str(frame_path)
            ]
            
            subprocess.run(cmd, capture_output=True, timeout=10)
            
            if frame_path.exists():
                frame_paths.append(f"/frames/{frame_filename}")
        
        return frame_paths
    except Exception as e:
        return []

def detect_platform_from_filename(filename: str) -> str:
    """Detect platform from filename"""
    filename_lower = filename.lower()
    
    if 'instagram' in filename_lower or 'ig' in filename_lower or 'reel' in filename_lower:
        return "Instagram"
    elif 'tiktok' in filename_lower or 'tt' in filename_lower:
        return "TikTok"
    elif 'youtube' in filename_lower or 'yt' in filename_lower or 'short' in filename_lower:
        return "YouTube"
    elif 'twitter' in filename_lower or 'tweet' in filename_lower:
        return "Twitter"
    else:
        return "General"

def generate_shot_list(duration: float, platform: str, num_shots: int = 5) -> List[dict]:
    """Generate detailed shot list based on video duration and platform"""
    
    # Calculate shot duration
    shot_duration = duration / num_shots
    
    shot_list = []
    
    # Platform-specific shot instructions
    platform_styles = {
        "Instagram": {
            "style": "vertical 9:16 format, bright and colorful",
            "tips": "Use trending filters, add text overlays, keep it under 60 seconds"
        },
        "TikTok": {
            "style": "vertical 9:16 format, fast-paced and dynamic",
            "tips": "Use trending sounds, add captions, hook in first 3 seconds"
        },
        "YouTube": {
            "style": "horizontal 16:9 format, high quality production",
            "tips": "Clear audio, good lighting, engaging thumbnail moment"
        },
        "Twitter": {
            "style": "square 1:1 or horizontal 16:9, concise and impactful",
            "tips": "Keep under 2 minutes, add captions, strong opening"
        },
        "General": {
            "style": "flexible format, professional quality",
            "tips": "Good lighting, clear audio, engaging content"
        }
    }
    
    style_info = platform_styles.get(platform, platform_styles["General"])
    
    # Generate 5 specific shots
    shots = [
        {
            "shot_number": 1,
            "timestamp": f"0:00 - {shot_duration:.1f}s",
            "type": "Hook/Opening",
            "instruction": f"Start with a bold visual or statement. {style_info['style']}. Capture attention immediately with movement or surprising element.",
            "camera_angle": "Eye-level or slightly above, centered subject",
            "lighting": "Bright, even lighting on subject's face",
            "action": "Subject looks directly at camera, confident expression"
        },
        {
            "shot_number": 2,
            "timestamp": f"{shot_duration:.1f}s - {shot_duration*2:.1f}s",
            "type": "Context/Setup",
            "instruction": f"Establish the scene and topic. Show what you're talking about. {style_info['tips']}.",
            "camera_angle": "Medium shot showing subject and environment",
            "lighting": "Natural or soft artificial light",
            "action": "Demonstrate or show the main subject matter"
        },
        {
            "shot_number": 3,
            "timestamp": f"{shot_duration*2:.1f}s - {shot_duration*3:.1f}s",
            "type": "Main Content",
            "instruction": f"Deliver the core message or demonstration. Keep energy high. Use {platform} best practices.",
            "camera_angle": "Close-up for emphasis, or wide for action",
            "lighting": "Consistent with previous shots",
            "action": "Main demonstration, key points, or transformation"
        },
        {
            "shot_number": 4,
            "timestamp": f"{shot_duration*3:.1f}s - {shot_duration*4:.1f}s",
            "type": "Value/Benefit",
            "instruction": f"Show the result or benefit. Make it visually clear why this matters. {style_info['style']}.",
            "camera_angle": "Focus on results or reaction",
            "lighting": "Highlight the positive outcome",
            "action": "Show before/after, results, or emotional reaction"
        },
        {
            "shot_number": 5,
            "timestamp": f"{shot_duration*4:.1f}s - {duration:.1f}s",
            "type": "Call-to-Action",
            "instruction": f"End with clear CTA. Point to follow button, ask for comments, or direct to link. {style_info['tips']}.",
            "camera_angle": "Back to eye-level, direct address",
            "lighting": "Bright and inviting",
            "action": "Gesture to follow/like, smile, create urgency"
        }
    ]
    
    shot_list = shots
    
    return shot_list

@app.post("/upload-video", response_model=VideoUploadResponse)
async def upload_video(request: VideoUploadRequest):
    """
    Upload a video file (as base64 JSON) and extract frames and metadata.
    
    Args:
        request: VideoUploadRequest with filename and base64 encoded video data
        
    Returns:
        VideoUploadResponse with metadata, frames, and shot list
    """
    try:
        # Validate file type
        allowed_extensions = ['.mp4', '.mov', '.avi', '.mkv']
        file_ext = Path(request.filename).suffix.lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Decode base64 video data
        try:
            video_bytes = base64.b64decode(request.video_data)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid base64 data: {str(e)}"
            )
        
        # Generate unique video ID
        video_id = str(uuid.uuid4())
        video_filename = f"{video_id}{file_ext}"
        video_path = UPLOAD_DIR / video_filename
        
        # Save decoded video file
        with video_path.open("wb") as buffer:
            buffer.write(video_bytes)
        
        # Extract metadata
        metadata = extract_video_metadata(str(video_path))
        
        # Extract frames
        frames = extract_frames(str(video_path), video_id)
        
        # Detect platform from filename
        platform = detect_platform_from_filename(request.filename)
        
        # Generate shot list
        shot_list = generate_shot_list(metadata['duration'], platform)
        
        return {
            "video_id": video_id,
            "filename": request.filename,
            "duration": metadata['duration'],
            "size_mb": metadata['size_mb'],
            "platform": platform,
            "frames": frames,
            "shot_list": shot_list
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video upload failed: {str(e)}")

@app.get("/frames/{filename}")
async def get_frame(filename: str):
    """Serve extracted frame images"""
    frame_path = FRAMES_DIR / filename
    if not frame_path.exists():
        raise HTTPException(status_code=404, detail="Frame not found")
    return FileResponse(frame_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# Made with Bob
