# TrendCraft AI - Backend

FastAPI backend powered by IBM Granite AI through watsonx.ai for trend analysis and content generation.

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure IBM watsonx.ai Credentials

Edit the `.env` file and add your IBM watsonx.ai credentials:

```env
WATSONX_API_KEY=your_api_key_here
WATSONX_PROJECT_ID=your_project_id_here
WATSONX_URL=https://us-south.ml.cloud.ibm.com
```

**How to get your credentials:**

1. Go to [IBM Cloud](https://cloud.ibm.com/)
2. Create a watsonx.ai instance or use an existing one
3. Get your API key from IBM Cloud IAM
4. Get your Project ID from your watsonx.ai project settings

### 3. Run the Server

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check
- **GET** `/health`
- Returns API status

### Analyze URL
- **POST** `/analyze`
- Body: `{ "url": "https://example.com" }`
- Returns: trends, sentiment, and keywords using IBM Granite AI

### Generate Content
- **POST** `/generate`
- Body: 
  ```json
  {
    "prompt": "Create content about...",
    "content_type": "social_media",
    "tone": "professional",
    "length": 500
  }
  ```
- Returns: AI-generated content including captions, hashtags, script, and music suggestions

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Model Information

- **Model**: IBM Granite 13B Instruct v2 (`ibm/granite-13b-instruct-v2`)
- **Provider**: IBM watsonx.ai
- **Capabilities**: Text analysis, content generation, sentiment analysis

## Features

- ✅ URL content fetching and analysis
- ✅ IBM Granite AI integration
- ✅ Trend detection
- ✅ Sentiment analysis
- ✅ Keyword extraction
- ✅ Social media content generation
- ✅ CORS enabled for frontend integration