export async function gqlFetch(query, variables={}, token) {
  const res = await fetch("https://learn.reboot01.com/api/graphql-engine/v1/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization" : `Bearer ${token}`
    },
    body: JSON.stringify({query, variables})
  });

  const json = await res.json().catch(()=>null);

  if (!res.ok) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }

  if (json?.errors && json.errors.length) {
    const message = json.errors[0]?.message || "GraphQL error";
    throw new Error(message);
  }

  return json.data;
}