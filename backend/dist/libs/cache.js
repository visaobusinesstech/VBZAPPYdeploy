"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const hmac_sha512_1 = __importDefault(require("crypto-js/hmac-sha512"));
const enc_base64_1 = __importDefault(require("crypto-js/enc-base64"));
const redis_1 = require("../config/redis");
class CacheSingleton {
    constructor(redisInstance) {
        this.redis = redisInstance;
    }
    static getInstance(redisInstance) {
        if (!CacheSingleton.instance) {
            CacheSingleton.instance = new CacheSingleton(redisInstance);
        }
        return CacheSingleton.instance;
    }
    static encryptParams(params) {
        const str = JSON.stringify(params);
        const key = enc_base64_1.default.stringify((0, hmac_sha512_1.default)(params, str));
        return key;
    }
    async set(key, value, option, optionValue) {
        if (option !== undefined && optionValue !== undefined) {
            return this.redis.set(key, value, option, optionValue);
        }
        return this.redis.set(key, value);
    }
    async get(key) {
        return this.redis.get(key);
    }
    async getKeys(pattern) {
        const stream = this.redis.scanStream({
            match: pattern,
            count: 100
        });
        const keys = [];
        for await (const resultKeys of stream) {
            keys.push(...resultKeys);
        }
        return keys;
    }
    async del(key) {
        return this.redis.del(key);
    }
    async delFromPattern(pattern) {
        const stream = this.redis.scanStream({
            match: pattern,
            count: 100
        });
        for await (const resultKeys of stream) {
            if (resultKeys.length > 0) {
                await this.redis.del(...resultKeys);
            }
        }
    }
    async setFromParams(key, params, value, option, optionValue) {
        const finalKey = `${key}:${CacheSingleton.encryptParams(params)}`;
        if (option !== undefined && optionValue !== undefined) {
            return this.set(finalKey, value, option, optionValue);
        }
        return this.set(finalKey, value);
    }
    async getFromParams(key, params) {
        const finalKey = `${key}:${CacheSingleton.encryptParams(params)}`;
        return this.get(finalKey);
    }
    async delFromParams(key, params) {
        const finalKey = `${key}:${CacheSingleton.encryptParams(params)}`;
        return this.del(finalKey);
    }
    getRedisInstance() {
        return this.redis;
    }
}
const redisInstance = new ioredis_1.default(redis_1.REDIS_URI_CONNECTION);
exports.default = CacheSingleton.getInstance(redisInstance);
