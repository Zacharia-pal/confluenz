// src/utils/github.js
export async function getAccessToken(clientId) {
    const res = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ client_id: clientId, scope: 'repo' })
    });
    const data = await res.json();
    alert(`Go to ${data.verification_uri} and enter code: ${data.user_code}`);
  
    while (true) {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          device_code: data.device_code,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
        })
      });
      const tokenData = await tokenRes.json();
      if (tokenData.access_token) return tokenData.access_token;
      await new Promise(r => setTimeout(r, 2000)); // wait before retrying
    }
  }

import { Octokit } from '@octokit/rest';
import { Base64 } from 'js-base64';

export function createOctokit(token) {
  return new Octokit({ auth: token });
}

export async function getRepoContent(octokit, owner, repo, path = '') {
  const res = await octokit.repos.getContent({ owner, repo, path });
  return res.data;  // This will return a list of files/folders
}

export async function getFile(octokit, owner, repo, path) {
  const res = await octokit.repos.getContent({ owner, repo, path });
  return Base64.decode(res.data.content);  // Decoding base64 encoded content
}

export async function saveFile(octokit, owner, repo, path, content, sha) {
  return await octokit.repos.createOrUpdateFileContents({
    owner, repo, path,
    message: `update ${path}`,
    content: Base64.encode(content),
    sha
  });
}

export async function createFile(octokit, owner, repo, path, content) {
  return await octokit.repos.createOrUpdateFileContents({
    owner, repo, path,
    message: `create ${path}`,
    content: Base64.encode(content),
  });
}

export async function deleteFile(octokit, owner, repo, path, sha) {
  return await octokit.repos.deleteFile({
    owner, repo, path,
    message: `delete ${path}`,
    sha
  });
}
