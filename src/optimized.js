import {fetchOwnersAndDeals, sendUpdatedDeals} from "./api.js";

// Function to process the owners and deals data
function processOwnersAndDeals(ownersAndDeals) {
    const usersMap = new Map();
    const teamsMap = new Map();
    const results = [];

    // Group deals by userId for faster access
    const dealsByOwner = new Map();
    ownersAndDeals['deals'].forEach(deal => {
        if (!dealsByOwner.has(deal['ownerUserId'])) {
            dealsByOwner.set(deal['ownerUserId'], []);
        }
        dealsByOwner.get(deal['ownerUserId']).push(deal['dealId']);
    });

    // Populate users and assign their deals
    ownersAndDeals['users'].forEach((user) => {
        const userId = user['userId'];
        const userDeals = dealsByOwner.get(userId) || [];

        usersMap.set(userId, {
            ...user,
            deals: userDeals
        });

        // Add users to teams
        user['teamIds'].forEach((teamId) => {
            if (!teamsMap.has(teamId)) {
                teamsMap.set(teamId, []);
            }
            teamsMap.get(teamId).push(usersMap.get(userId));
        });
    });

    // Process each user and determine their deal permissions
    usersMap.forEach((user) => {
        let result = {
            userId: user['userId'],
            viewableDealIds: new Set(),
            editableDealIds: new Set(),
        };

        // Process viewable and editable deals in one pass
        ownersAndDeals['deals'].forEach(deal => {
            result = processDealPermissions(user, deal, result, teamsMap);
        });

        // Convert sets to arrays and push to results
        results.push({
            userId: result.userId,
            viewableDealIds: Array.from(result.viewableDealIds),
            editableDealIds: Array.from(result.editableDealIds),
        });
    });

    return results;
}

// Combined function to process both view and edit permissions
function processDealPermissions(user, deal, result, teamsMap) {
    // Viewable deals
    if (user['viewPermissionLevel'] === "ALL" ||
        (user['viewPermissionLevel'] === "OWNED_ONLY" && deal['ownerUserId'] === user['userId']) ||
        (user['viewPermissionLevel'] === "OWNED_OR_TEAM" && (
            deal['ownerUserId'] === user['userId'] || isTeamOwned(user, deal, teamsMap)))) {
        result.viewableDealIds.add(deal['dealId']);
    }

    // Editable deals
    if (user['editPermissionLevel'] === "ALL" ||
        (user['editPermissionLevel'] === "OWNED_ONLY" && deal['ownerUserId'] === user['userId']) ||
        (user['editPermissionLevel'] === "OWNED_OR_TEAM" && (
            deal['ownerUserId'] === user['userId'] || isTeamOwned(user, deal, teamsMap)))) {
        result.editableDealIds.add(deal['dealId']);
    }

    return result;
}

// Check if a deal is owned by a user in the same team
function isTeamOwned(user, deal, teamsMap) {
    return user['teamIds'].some(teamId => {
        return teamsMap.has(teamId) && teamsMap.get(teamId).some(teamUser => teamUser['deals'].includes(deal['dealId']));
    });
}

async function main() {
    try {
        const ownersAndDeals = await fetchOwnersAndDeals();
        const updatedResults = processOwnersAndDeals(ownersAndDeals);
        await sendUpdatedDeals(updatedResults);
    } catch (error) {
        console.error('Failed to complete the report process:', error);
    }
}

main();
