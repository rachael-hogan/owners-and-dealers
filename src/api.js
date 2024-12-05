// Function to fetch employee data
export async function fetchOwnersAndDeals() {
    try {
        const response = await fetch('https://candidate.hubteam.com/candidateTest/v3/problem/dataset?userKey=4b450f67cd60735bef54efffc307');

        if (!response.ok) {
            throw new Error(`Failed to users and deals: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching users and deals:', error);
        throw error; // rethrow to handle in the caller
    }
}

// Function to send updated employee data
export async function sendUpdatedDeals(ownerAndDeals) {
    const results = {
        results: ownerAndDeals
    }
    try {
        const response = await fetch('https://candidate.hubteam.com/candidateTest/v3/problem/result?userKey=4b450f67cd60735bef54efffc307', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(results),
        });
        if (!response.ok) {
            throw new Error(`Failed to send user and deal report: ${response.statusText}`);
        }
        console.log('User and deal report successfully sent.');
    } catch (error) {
        console.error('Error sending user and deal report:', error);
        throw error;
    }
}
