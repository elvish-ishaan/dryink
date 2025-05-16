"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToS3 = exports.s3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const dotenv_1 = require("dotenv");
const fs_1 = __importDefault(require("fs"));
(0, dotenv_1.config)();
exports.s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.S3_BUCKET_ACCESS_KEY,
        secretAccessKey: process.env.S3_BUCKET_SECRET_KEY,
    },
});
const uploadToS3 = (filePath, fileName) => __awaiter(void 0, void 0, void 0, function* () {
    // Create a readable stream from the file path
    const fileStream = fs_1.default.createReadStream(filePath);
    try {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: process.env.AWS_BUCKET,
            Key: fileName,
            Body: fileStream,
            ContentType: 'video/mp4',
        });
        const data = yield exports.s3Client.send(command);
        if (data.$metadata.httpStatusCode !== 200) {
            throw new Error('Failed to upload file to S3');
        }
        //return the public url of the uploaded file
        const url = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
        return url;
    }
    catch (error) {
        console.log(error, 'error in uploading to s3');
    }
});
exports.uploadToS3 = uploadToS3;
