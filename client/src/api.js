const API = '/api';

export async function getRants() {
  const res = await fetch(`${API}/rants`);
  if (!res.ok) throw new Error('Failed to fetch rants');
  return res.json();
}

export async function createRant(username, content) {
  const res = await fetch(`${API}/rants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, content }),
  });
  if (!res.ok) throw new Error('Failed to create rant');
  return res.json();
}

export async function deleteRant(id) {
  const res = await fetch(`${API}/rants/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete rant');
  return res.json();
}

export async function getComments(rantId) {
  const res = await fetch(`${API}/rants/${rantId}/comments`);
  if (!res.ok) throw new Error('Failed to fetch comments');
  return res.json();
}

export async function createComment(rantId, username, content, parentId = null) {
  const res = await fetch(`${API}/rants/${rantId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, content, parent_id: parentId }),
  });
  if (!res.ok) throw new Error('Failed to create comment');
  return res.json();
}

export async function deleteComment(id) {
  const res = await fetch(`${API}/comments/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete comment');
  return res.json();
}

export async function toggleReaction({ rant_id, comment_id, username, type }) {
  const res = await fetch(`${API}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rant_id, comment_id, username, type }),
  });
  if (!res.ok) throw new Error('Failed to toggle reaction');
  return res.json();
}
