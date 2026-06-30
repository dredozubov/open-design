import { afterEach, describe, expect, it } from 'vitest';

import { deploymentProviderAppConfigPatch } from '../src/routes/media.js';

const ENV_KEYS = [
  'OD_PROVIDER_ORCHESTRATOR_BASE_URL',
  'OD_PROVIDER_ORCHESTRATOR_API_KEY',
  'OD_PROVIDER_ORCHESTRATOR_DEFAULT_MODEL',
] as const;

const previousEnv = new Map<string, string | undefined>();

function setDeploymentProviderEnv(values: Partial<Record<typeof ENV_KEYS[number], string | undefined>>) {
  previousEnv.clear();
  for (const key of ENV_KEYS) {
    previousEnv.set(key, process.env[key]);
    const value = values[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = previousEnv.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  previousEnv.clear();
});

describe('deployment provider app-config bootstrap', () => {
  it('seeds API mode with deployment credentials and no browser-held key material', () => {
    setDeploymentProviderEnv({
      OD_PROVIDER_ORCHESTRATOR_BASE_URL: 'https://gateway.example.test/v1',
      OD_PROVIDER_ORCHESTRATOR_API_KEY: 'deployment-secret',
      OD_PROVIDER_ORCHESTRATOR_DEFAULT_MODEL: 'deployment-chat-model',
    });

    expect(deploymentProviderAppConfigPatch({})).toEqual({
      onboardingCompleted: true,
      mode: 'api',
      apiProtocol: 'openai',
      apiCredentialSource: 'deployment',
      apiKey: '',
      baseUrl: '',
      model: 'deployment-chat-model',
      apiVersion: '',
      apiProviderBaseUrl: null,
    });
  });

  it('does not patch to BYOK when deployment provider config is unavailable', () => {
    setDeploymentProviderEnv({
      OD_PROVIDER_ORCHESTRATOR_BASE_URL: 'https://gateway.example.test/v1',
      OD_PROVIDER_ORCHESTRATOR_API_KEY: undefined,
      OD_PROVIDER_ORCHESTRATOR_DEFAULT_MODEL: 'deployment-chat-model',
    });

    expect(deploymentProviderAppConfigPatch({})).toBeNull();
  });

  it('preserves an existing deployment model selection', () => {
    setDeploymentProviderEnv({
      OD_PROVIDER_ORCHESTRATOR_BASE_URL: 'https://gateway.example.test/v1',
      OD_PROVIDER_ORCHESTRATOR_API_KEY: 'deployment-secret',
      OD_PROVIDER_ORCHESTRATOR_DEFAULT_MODEL: 'deployment-chat-model',
    });

    expect(deploymentProviderAppConfigPatch({
      onboardingCompleted: true,
      mode: 'api',
      apiProtocol: 'openai',
      apiCredentialSource: 'deployment',
      apiKey: '',
      baseUrl: '',
      model: 'alternate-deployment-model',
      apiVersion: '',
      apiProviderBaseUrl: null,
    })).toBeNull();
  });
});
