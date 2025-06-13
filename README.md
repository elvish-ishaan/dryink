# Dryink



## Overview



Dryink is an AI-powered video generation platform that enables users to create engaging videos using natural language prompts. The application leverages Large Language Models (LLMs) to generate video content and enhances it with AI-generated audio and text overlays.



## 🚀 Features



- **AI Video Generation**: Create videos using natural language prompts

- **Smart Enhancements**: 

  - AI-generated audio narration

  - Dynamic text overlays

  - Custom styling options

- **Easy Sharing**: Generate unique URLs for video sharing

- **Export Options**: Download videos in various formats

- **User Dashboard**: Manage and organize your video projects



## 🏗️ Project Structure



```

dryink/

├── fe/                 # Frontend (Next.js)

├── be/                 # Backend API

├── worker/            # Background processing worker

└── db/                # Database migrations and schemas

```



## 🛠️ Tech Stack



- **Frontend**: Next.js, TypeScript, Tailwind CSS

- **Backend**: Node.js, Express

- **Database**: PostgreSQL

- **Queue System**: Redis

- **Storage**: AWS S3

- **AI/ML**: Google's Gemini 2.0 Flash



## 📋 Prerequisites



- Node.js (v18 or higher)

- npm or yarn

- PostgreSQL

- Redis

- AWS Account (for S3)

- Google AI Studio API Key



## 🚀 Getting Started



### 1. Clone the Repository



```bash

git clone https://github.com/nafri/dryink.git

cd dryink

```



### 2. Install Dependencies



```bash

# Frontend

cd fe

npm install



# Backend

cd ../be

npm install



# Worker

cd ../worker

npm install

```



### 3. Environment Setup



Create `.env` files in each service directory (fe, be, worker) with the following variables:



```env

# Backend (.env)

PORT=5000

LLM_API_KEY='your-google-ai-studio-api-key'

S3_BUCKET_ACCESS_KEY='your-s3-access-key'

S3_BUCKET_SECRET_KEY='your-s3-secret-key'

AWS_REGION='ap-south-1'

AWS_BUCKET='your-bucket-name'

LLM_MODEL='gemini-2.0-flash'

REDIS_URL='your-redis-url'

```



### 4. Start the Services



```bash

# Terminal 1 - Backend

cd be

npm run dev



# Terminal 2 - Frontend

cd fe

npm run dev



# Terminal 3 - Worker

cd worker

npm run dev

```



The application will be available at:

- Frontend: http://localhost:3000

- Backend API: http://localhost:5000



## 🔧 Development



### Code Style



- We use ESLint and Prettier for code formatting

- TypeScript for type safety

- Follow the existing code style and patterns



### Running Tests



```bash

# Frontend tests

cd fe

npm test



# Backend tests

cd be

npm test

```



## 🤝 Contributing



1. Fork the repository

2. Create your feature branch (`git checkout -b feature/amazing-feature`)

3. Commit your changes (`git commit -m 'Add some amazing feature'`)

4. Push to the branch (`git push origin feature/amazing-feature`)

5. Open a Pull Request



## 📝 License



This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.



## 🙏 Acknowledgments



- All contributors who have helped shape this project