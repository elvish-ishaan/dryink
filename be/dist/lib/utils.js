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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getS3SignedUrl = getS3SignedUrl;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const s3Client_1 = require("../configs/s3Client");
function getS3SignedUrl(bucket_1, key_1) {
    return __awaiter(this, arguments, void 0, function* (bucket, key, expiresInSeconds = 3600) {
        try {
            // Create a GetObjectCommand to specify the S3 object
            const getObjectCommandparams = {
                Bucket: bucket,
                Key: key,
                expiresInSeconds: expiresInSeconds,
            };
            const command = new client_s3_1.GetObjectCommand(getObjectCommandparams);
            const url = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client_1.s3Client, command, { expiresIn: expiresInSeconds });
            return url;
        }
        catch (error) {
            console.error("Error getting signed URL:", error);
            throw error;
        }
    });
}
