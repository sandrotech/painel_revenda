// Testa o endpoint de login com revenda-teste
fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'revenda-teste', password: 'revenda-teste' })
})
.then(r => r.json())
.then(d => console.log(JSON.stringify(d, null, 2)));
