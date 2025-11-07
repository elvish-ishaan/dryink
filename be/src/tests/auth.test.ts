import { describe, expect, test, it, vi } from 'vitest';
import request from "supertest";
import { app } from '../src';
import { prismaClient } from '../src/__mocks__/db';

vi.mock('../src/__mock__/db')

describe("sign-up", () => {
    prismaClient.user.create.mockResolvedValue({
            id: "1",
            name: "test",
            email: "test@test.com",
            password: "test123",
            authProvider: "credentials",
            createdOn: new Date(),
        })
    it("it should throw error when user already exists", async () => {
        const res = await request(app).post("/api/v1/auth/signup").send({
            name: "test",
            email: "test@test.com",
            password: "test123",
            authProvider: "credentials",
        })
        expect(res.status).toBe(400)
        expect(res.body.success).toBe(false)
    })
    
    it("it should sign up a user when only name, email, authprovider is present", async () => {
        const res = await request(app).post("/api/v1/auth/signup").send({
            name: "test",
            email: "test@test.com",
            password: "test123",
            authProvider: "credentials",
        })
        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
    })
})