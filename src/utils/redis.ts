import Redis, { Cluster } from 'ioredis';
import { ENV } from '../config/env';

const createRedis = (): Redis | Cluster => {
    if (ENV.REDIS.useCluster === 'true') {
        const clusterNodes = JSON.parse(ENV.REDIS.clusterNodes);
        let redisOptions: any = {};
        if (ENV.REDIS.password != "") {
            redisOptions = {
                ...redisOptions,
                password: ENV.REDIS.password
            }
        }
        if (ENV.REDIS.tls === 'true') {
            redisOptions = {
                ...redisOptions,
                tls: {}
            }
        }
        return new Redis.Cluster(clusterNodes, {
            redisOptions
        });
    } else {
        let config: any = {
            host: ENV.REDIS.host,
            port: Number(ENV.REDIS.port)
        }
        if (ENV.REDIS.tls === 'true') {
            config = {
                ...config,
                tls: {}
            }
        }
        if (ENV.REDIS.password != "") {
            config = {
                ...config,
                password: ENV.REDIS.password
            }
        }
        return new Redis(config);
    }
}

export const redis = createRedis();
