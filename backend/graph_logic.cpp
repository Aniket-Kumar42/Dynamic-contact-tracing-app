#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <queue>
#include <set>
#include <fstream>
#include "json.hpp" // For JSON parsing (header-only library)

using namespace std;
using json = nlohmann::json;

// User node structure
struct User {
    string id;
    string name;
    int age;
    string location;
    string status; // healthy, infected, exposed
    vector<string> contacts;
};

// Load users from users.json
void load_users(unordered_map<string, User>& users) {
    ifstream fin("users.json");
    if (!fin) return;
    json j;
    fin >> j;
    for (auto& el : j.items()) {
        User u;
        u.id = el.key();
        u.name = el.value()["name"];
        u.age = el.value()["age"];
        u.location = el.value().value("location", "");
        u.status = el.value()["status"];
        u.contacts = el.value()["contacts"].get<vector<string>>();
        users[u.id] = u;
    }
}

// Save users to users.json
void save_users(const unordered_map<string, User>& users) {
    json j;
    for (const auto& [id, u] : users) {
        j[id] = {
            {"name", u.name},
            {"age", u.age},
            {"location", u.location},
            {"status", u.status},
            {"contacts", u.contacts}
        };
    }
    ofstream fout("users.json");
    fout << j.dump(2);
}

// Load messages from messages.json
void load_messages(unordered_map<string, vector<string>>& messages) {
    ifstream fin("messages.json");
    if (!fin) return;
    json j;
    fin >> j;
    for (auto& el : j.items()) {
        messages[el.key()] = el.value().get<vector<string>>();
    }
}

// Save messages to messages.json
void save_messages(const unordered_map<string, vector<string>>& messages) {
    json j;
    for (const auto& [id, msgs] : messages) {
        j[id] = msgs;
    }
    ofstream fout("messages.json");
    fout << j.dump(2);
}

// Add user
json add_user(json req, unordered_map<string, User>& users) {
    string id = req["id"];
    if (users.count(id)) return {{"status", "error"}, {"msg", "User exists"}};
    User u;
    u.id = id;
    u.name = req["name"];
    u.age = req["age"];
    u.location = req.value("location", "");
    u.status = "healthy";
    users[id] = u;
    save_users(users);
    return {{"status", "ok"}};
}

// Login user
json login(json req, unordered_map<string, User>& users) {
    string id = req["id"];
    if (!users.count(id)) return {{"status", "error"}, {"msg", "User not found"}};
    return {{"status", "ok"}};
}

// Add contact
json add_contact(json req, unordered_map<string, User>& users) {
    string id = req["id"];
    vector<string> contacts = req["contacts"];
    if (!users.count(id)) return {{"status", "error"}, {"msg", "User not found"}};
    for (const auto& cid : contacts) {
        if (!users.count(cid)) continue;
        // Check if contact already exists to prevent duplicates
        if (find(users[id].contacts.begin(), users[id].contacts.end(), cid) == users[id].contacts.end()) {
            users[id].contacts.push_back(cid);
        }
        if (find(users[cid].contacts.begin(), users[cid].contacts.end(), id) == users[cid].contacts.end()) {
            users[cid].contacts.push_back(id);
        }
    }
    save_users(users);
    return {{"status", "ok"}};
}

// Remove contact
json remove_contact(json req, unordered_map<string, User>& users) {
    string id = req["id"];
    vector<string> contacts = req["contacts"];
    if (!users.count(id)) return {{"status", "error"}, {"msg", "User not found"}};
    
    for (const auto& cid : contacts) {
        if (!users.count(cid)) continue;
        
        // Remove contact from user's list
        users[id].contacts.erase(
            remove(users[id].contacts.begin(), users[id].contacts.end(), cid),
            users[id].contacts.end()
        );
        
        // Remove user from contact's list
        users[cid].contacts.erase(
            remove(users[cid].contacts.begin(), users[cid].contacts.end(), id),
            users[cid].contacts.end()
        );
    }
    
    save_users(users);
    return {{"status", "ok"}};
}

// Mark infected and propagate exposure
json mark_infected(json req, unordered_map<string, User>& users) {
    string id = req["id"];
    if (!users.count(id)) return {{"status", "error"}, {"msg", "User not found"}};
    users[id].status = "infected";
    // Only mark direct contacts as exposed (level 1)
    for (const auto& cid : users[id].contacts) {
        if (users.count(cid)) {
            users[cid].status = "exposed";
        }
    }
    save_users(users);
    return {{"status", "ok"}};
}

// Unmark infected and revert exposure
json unmark_infected(json req, unordered_map<string, User>& users) {
    string id = req["id"];
    if (!users.count(id)) return {{"status", "error"}, {"msg", "User not found"}};
    users[id].status = "healthy";
    
    // Revert exposed status for direct contacts (only if they don't have other infected contacts)
    for (const auto& cid : users[id].contacts) {
        if (users.count(cid) && users[cid].status == "exposed") {
            // Check if this contact has any other infected contacts
            bool hasOtherInfectedContacts = false;
            for (const auto& otherContact : users[cid].contacts) {
                if (otherContact != id && users.count(otherContact) && users[otherContact].status == "infected") {
                    hasOtherInfectedContacts = true;
                    break;
                }
            }
            // Only revert to healthy if no other infected contacts
            if (!hasOtherInfectedContacts) {
                users[cid].status = "healthy";
            }
        }
    }
    save_users(users);
    return {{"status", "ok"}};
}

// Send infection alert to contacts
json send_infection_alert(json req, unordered_map<string, User>& users) {
    string id = req["id"];
    if (!users.count(id)) return {{"status", "error"}, {"msg", "User not found"}};
    
    unordered_map<string, vector<string>> messages;
    load_messages(messages);
    
    string alert_msg = "⚠️ ALERT: " + users[id].name + " (" + id + ") has been marked as INFECTED. You have been in direct contact with this person. Please monitor your health and consider getting tested.";
    
    // Send message to all contacts
    for (const auto& cid : users[id].contacts) {
        if (users.count(cid)) {
            if (!messages.count(cid)) {
                messages[cid] = vector<string>();
            }
            messages[cid].push_back(alert_msg);
        }
    }
    
    save_messages(messages);
    return {{"status", "ok"}, {"alerted", users[id].contacts}};
}

// Get messages for a user
json get_messages(json req, unordered_map<string, User>& users) {
    string id = req["id"];
    if (!users.count(id)) return {{"status", "error"}, {"msg", "User not found"}};
    
    unordered_map<string, vector<string>> messages;
    load_messages(messages);
    
    if (!messages.count(id) || messages[id].empty()) {
        return {{"status", "ok"}, {"messages", vector<string>()}};
    }
    
    return {{"status", "ok"}, {"messages", messages[id]}};
}

// Get exposure graph (up to level 2)
json get_exposure_graph(json req, unordered_map<string, User>& users) {
    string id = req["id"];
    if (!users.count(id)) return {{"status", "error"}, {"msg", "User not found"}};
    json graph;
    queue<pair<string, int>> q;
    set<string> visited;
    q.push({id, 0});
    visited.insert(id);
    while (!q.empty()) {
        auto [uid, level] = q.front(); q.pop();
        if (level > 2) continue;
        graph[uid] = {
            {"name", users[uid].name},
            {"status", users[uid].status},
            {"contacts", users[uid].contacts}
        };
        for (const auto& cid : users[uid].contacts) {
            if (!visited.count(cid)) {
                q.push({cid, level + 1});
                visited.insert(cid);
            }
        }
    }
    return {{"status", "ok"}, {"graph", graph}};
}

int main(int argc, char* argv[]) {
    string input;
    getline(cin, input);
    json request = json::parse(input);
    unordered_map<string, User> users;
    load_users(users);
    string command = request["command"];
    json response;
    if (command == "add_user") response = add_user(request, users);
    else if (command == "login") response = login(request, users);
    else if (command == "add_contact") response = add_contact(request, users);
    else if (command == "remove_contact") response = remove_contact(request, users);
    else if (command == "mark_infected") response = mark_infected(request, users);
    else if (command == "unmark_infected") response = unmark_infected(request, users);
    else if (command == "send_infection_alert") response = send_infection_alert(request, users);
    else if (command == "get_messages") response = get_messages(request, users);
    else if (command == "get_exposure_graph") response = get_exposure_graph(request, users);
    else response = {{"status", "error"}, {"msg", "Unknown command"}};
    cout << response.dump() << endl;
    return 0;
}
