
async function verify() {
    try {
        console.log("Fetching http://127.0.0.1:3000/api/test-firebase...");
        const res = await fetch('http://127.0.0.1:3000/api/test-firebase');
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Verification failed:", err.message);
    }
}
verify();
