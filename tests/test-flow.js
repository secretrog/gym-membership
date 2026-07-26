const axios = require('axios');

async function run() {
    try {
        console.log("1. Admin Login");
        const adminRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@ironpulse.com',
            password: 'admin123'
        });
        const token = adminRes.data.token;

        console.log("2. Fetching Pending");
        const pendingRes = await axios.get('http://localhost:5000/api/memberships/pending', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const target = pendingRes.data.find(p => p.member.email === 'test.final@example.com');
        if (!target) throw new Error("Could not find test.final in pending list!");
        console.log("Found Pending ID:", target.id);

        console.log("3. Approving");
        const appRes = await axios.put(`http://localhost:5000/api/memberships/approve/${target.id}`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log("Approved! Status:", appRes.status);

        console.log("4. User Login with phone password");
        const userRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test.final@example.com',
            password: '1112223334'
        });
        console.log("User Login Success! Token:", userRes.data.token ? "RECEIVED ✅" : "FAILED ❌");

    } catch (err) {
        console.error("Test Failed:", err.response ? err.response.data : err.message);
    }
}
run();
