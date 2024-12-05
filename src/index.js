import {fetchOwnersAndDeals, sendUpdatedDeals} from "./api.js";

// Function to process the owners and deals data
function processOwnersAndDeals(ownersAndDeals) {
    const users = [];
    const teams = [];
    const results = [];

    //Add all deals owned by each user to the user object
    ownersAndDeals['users'].forEach((user) => {
        ownersAndDeals['deals'].forEach((deal) => {
            if (deal['ownerUserId'] === user['userId']) {
                const userId = user['userId'];
                if (!users[userId]) {
                    users[userId] = {
                        ...user,
                        deals: [deal['dealId']],
                    }
                }else {
                    users[userId].deals.push(deal['dealId']);
                }
            }
        });
    });

    // Add all users to their respective teams
    users.forEach(user => {
        user['teamIds'].forEach((teamId) => {
            if (!teams[teamId]) {
                teams[teamId] = [user];
            } else {
                teams[teamId].push(user);
            }
        });
    })

    //set up the results object
    users.forEach((user) => {
        let result = {
            userId: user['userId'],
            viewableDealIds: [],
            editableDealIds: [],
        }

        //Go through every deal and check if the user has permission to view/edit
        ownersAndDeals['deals'].forEach((deal) => {
            result = addViewableDeals(user, deal, result, teams);
            result = addEditabledDeals(user, deal, result, teams);
        });

        //Remove duplicates
        const viewPermissionLevel = new Set(result['viewableDealIds']);
        const editPermissionLevel = new Set(result['editableDealIds']);
        result = {
            userId: result['userId'],
            viewableDealIds: [...viewPermissionLevel],
            editableDealIds: [...editPermissionLevel],
        }
        results.push(result);
    });
    return results;
}

function addViewableDeals(user, deal, result, teams){
    //Add viewable deals
    if (user['viewPermissionLevel'] === "ALL") {
        result['viewableDealIds'].push(deal['dealId']);
    } else if (user['viewPermissionLevel'] === "OWNED_ONLY") {
        if (deal['ownerUserId'] === user['userId']) {
            result['viewableDealIds'].push(deal['dealId']);
        }
    } else if (user['viewPermissionLevel'] === "OWNED_OR_TEAM") {
        if (deal['ownerUserId'] === user['userId']) {
            result['viewableDealIds'].push(deal['dealId']);
        }
        //Go through the users team and add deals that someone on their team owns
        user['teamIds'].forEach((teamId) => {
            teams[teamId].forEach((teamUser) => {
                result['viewableDealIds'].push(...teamUser['deals']);
            })
        });
    }
    return result;
}

function addEditabledDeals (user, deal, result, teams){
    if (user['editPermissionLevel'] === "ALL") {
        result['editableDealIds'].push(deal['dealId']);
    } else if (user['editPermissionLevel'] === "OWNED_ONLY") {
        if (deal['ownerUserId'] === user['userId']) {
            result['editableDealIds'].push(deal['dealId']);
        }
        //if anyone is reading this, this is was where I got stuck for awhile. The following else
        //got nested at in this else if statement. This didn't cause any issues with the practice data
        //because none of the edit permission levels are set to "OWNED_OR_TEAM". I had to adjust the
        //practice data to finally figure this out.
    } else if (user['editPermissionLevel'] === "OWNED_OR_TEAM") {
        if (deal['ownerUserId'] === user['userId']) {
            result['editableDealIds'].push(deal['dealId']);
        }
        //Go through the users team and add deals that someone on their teams owns
        user['teamIds'].forEach((teamId) => {
            teams[teamId].forEach((teamUser) => {
                result['editableDealIds'].push(...teamUser['deals']);
            })
        })
    }
    return result;
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
