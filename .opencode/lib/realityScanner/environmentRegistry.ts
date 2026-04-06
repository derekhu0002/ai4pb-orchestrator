import * as path from 'node:path';

export type EnvironmentProfile = {
  profileId: string;
  displayName: string;
  detectionSignatures: string[];
  recommendedSkills: string[];
  recommendedTools: string[];
};

export const ENVIRONMENT_PROFILE_REGISTRY: EnvironmentProfile[] = [
  {
    profileId: 'chrome-extension',
    displayName: 'Chrome Extension',
    detectionSignatures: ['manifest.json'],
    recommendedSkills: ['chrome-extension-testing'],
    recommendedTools: ['run_chrome_sandbox'],
  },
];

function normalizeWorkspacePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\//, '').trim();
}

function matchesDetectionSignature(relativeFile: string, signature: string): boolean {
  const normalizedFile = normalizeWorkspacePath(relativeFile);
  const normalizedSignature = normalizeWorkspacePath(signature);

  if (!normalizedFile || !normalizedSignature) {
    return false;
  }

  if (!normalizedSignature.includes('/')) {
    return path.posix.basename(normalizedFile) === normalizedSignature;
  }

  return normalizedFile === normalizedSignature || normalizedFile.endsWith(`/${normalizedSignature}`);
}

export function detectEnvironmentProfiles(files: string[]): EnvironmentProfile[] {
  const normalizedFiles = files.map(normalizeWorkspacePath).filter(Boolean);

  return ENVIRONMENT_PROFILE_REGISTRY
    .filter((profile) =>
      profile.detectionSignatures.some((signature) => normalizedFiles.some((file) => matchesDetectionSignature(file, signature)))
    )
    .map((profile) => ({
      ...profile,
      detectionSignatures: [...profile.detectionSignatures],
      recommendedSkills: [...profile.recommendedSkills],
      recommendedTools: [...profile.recommendedTools],
    }));
}