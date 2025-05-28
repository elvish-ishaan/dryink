# DRYINK

## Introduction

DRYINK is a web application that allows users to generate videos with a prompt. The application uses LLMs to generate video content and AI to enhance the video with audio and text overlays.

## Features

- Generate videos with AI
- Add audio and text overlays
- Share videos with a unique URL
- Save videos to the user's device

## Installation

1. Clone the repository
2. Install dependencies
3. Configure environment variables
4. Run the application

### Clone the repository

```bash
git clone https://github.com/nafri/dryink.git
```

### Install dependencies

```bash
cd dryink
cd fe
npm install 
cd ../be
npm install
cd ../worker
npm install
```

### Configure environment variables

copy the env variables from `env.example` file and add the required values to it.
Create a `.env` file in the root directory of the project and add the following variables:

```bash
PORT=5000

LLM_API_KEY='get you api key from " https://aistudio.google.com/apikey "'

S3_BUCKET_ACCESS_KEY = 'demo-s3-bucket-access-key'
S3_BUCKET_SECRET_KEY = 'demo-s3-bucket-secret-key'
AWS_REGION = 'ap-south-1'
AWS_BUCKET = 'aws-bucket-name'

LLM_MODEL= "gemini-2.0-flash"

REDIS_URL= " demo-redis-url"
```

### Run the application

```bash
cd be
npm run dev

cd fe
npm run dev

cd worker
npm run dev
```

The application will be available at `http://localhost:3000`.

## Contributing

Contributions are welcome! If you find a bug or have a suggestion, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.