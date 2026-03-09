// Environment configuration for different deployment environments

export type Environment = "dev" | "qa" | "uat" | "prod"

interface EnvironmentConfig {
  name: string
  baseUrl: string
  apiVersion: string
}

const environmentConfigs: Record<Environment, EnvironmentConfig> = {
  dev: {
    name: "Development",
    baseUrl: "https://api-dv.brightspeed.com",
    apiVersion: "v1",
  },
  qa: {
    name: "QA",
    baseUrl: "https://api-qa.brightspeed.com",
    apiVersion: "v1",
  },
  uat: {
    name: "UAT",
    baseUrl: "https://api-uat.brightspeed.com",
    apiVersion: "v1",
  },
  prod: {
    name: "Production",
    baseUrl: "https://api.brightspeed.com",
    apiVersion: "v1",
  },
}

// Get current environment from env variable or default to dev
export function getCurrentEnvironment(): Environment {
  const env = process.env.NEXT_PUBLIC_APP_ENV as Environment
  return env && environmentConfigs[env] ? env : "dev"
}

export function getEnvironmentConfig(env?: Environment): EnvironmentConfig {
  const currentEnv = env || getCurrentEnvironment()
  return environmentConfigs[currentEnv]
}

export function getBaseUrl(env?: Environment): string {
  return getEnvironmentConfig(env).baseUrl
}

export { environmentConfigs }
