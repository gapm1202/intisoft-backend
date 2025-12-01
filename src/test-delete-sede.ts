#!/usr/bin/env node

(async () => {
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTc2MzEzNzQ1NSwiZXhwIjoxNzYzMTQxMDU1fQ.rKqRXVsgNl8xtE0S7c151JYcDPhf9OU_LbS1t_n2J0o";
  const baseUrl = "http://localhost:4000";

  console.log("=== TEST 1: CREATE SEDE ===");
  const createRes = await fetch(`${baseUrl}/api/empresas/1/sedes`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      nombre: "Test Delete Seat",
      direccion: "Prueba Elim"
    })
  });

  if (createRes.status !== 201) {
    console.error("Failed to create sede:", createRes.status);
    process.exit(1);
  }

  const sedes = await createRes.json() as any;
  const sedeId = sedes.id;
  console.log(`Created sede with ID: ${sedeId}`);

  console.log("\n=== TEST 2: DELETE SEDE (without motivo) ===");
  const deleteRes = await fetch(`${baseUrl}/api/empresas/1/sedes/${sedeId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  console.log(`DELETE Status: ${deleteRes.status}`);
  const deleteBody = await deleteRes.json();
  console.log(`DELETE Response:`, JSON.stringify(deleteBody, null, 2));

  if (deleteRes.status === 200) {
    console.log("\n✓ DELETE SEDE WORKS!");
  } else {
    console.log("\n✗ DELETE SEDE FAILED!");
  }

  process.exit(0);
})();
