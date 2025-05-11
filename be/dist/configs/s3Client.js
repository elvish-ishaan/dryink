"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
exports.s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.S3_BUCKET_ACCESS_KEY,
        secretAccessKey: process.env.S3_BUCKET_SECRET_KEY,
    },
});
