// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AIHungerGames {
    address constant ASYNC_DELIVERY = 0x5A16214fF555848411544b005f7Ac063742f39F6;
    address constant LLM_PRECOMPILE = 0x0000000000000000000000000000000000000802;

    uint256 public entryFee = 0.001 ether;
    address public warden; // Owner
    
    struct Player {
        address wallet;
        string currentPrompt;
        bool isAlive;
        string eliminationReason;
    }

    Player[] public players;
    mapping(address => bool) public hasJoined;
    
    bool public gameStarted;
    uint256 public day;
    uint256 public jackpot;

    event PlayerJoined(address player);
    event GameStarted(uint256 initialJackpot);
    event PromptSubmitted(address player, string prompt);
    event JudgmentRequested(uint256 day);
    event PlayerEliminated(address player, string reason);
    event GameWon(address winner, uint256 prize);

    constructor() {
        warden = msg.sender;
        day = 1;
    }

    function joinGame() external payable {
        require(!gameStarted, "Game already started");
        require(msg.value == entryFee, "Incorrect entry fee");
        require(!hasJoined[msg.sender], "Already joined");

        players.push(Player({
            wallet: msg.sender,
            currentPrompt: "",
            isAlive: true,
            eliminationReason: ""
        }));
        hasJoined[msg.sender] = true;
        jackpot += msg.value;

        emit PlayerJoined(msg.sender);
    }

    function startGame() external {
        require(msg.sender == warden, "Only Warden");
        require(players.length > 0, "Need at least 1 player to test");
        gameStarted = true;
        emit GameStarted(jackpot);
    }

    function submitPrompt(string memory _prompt) external {
        require(gameStarted, "Game not started");
        bool found = false;
        
        for (uint i = 0; i < players.length; i++) {
            if (players[i].wallet == msg.sender && players[i].isAlive) {
                players[i].currentPrompt = _prompt;
                found = true;
                break;
            }
        }
        require(found, "Player not found or dead");
        emit PromptSubmitted(msg.sender, _prompt);
    }

    function requestJudgment(bytes memory llmInput) external {
        require(msg.sender == warden, "Only Warden");
        require(gameStarted, "Game not started");
        
        // In a real implementation, we would construct a prompt with all living players and their submitted text
        // and send it via the LLM_PRECOMPILE.
        (bool success, ) = LLM_PRECOMPILE.call(llmInput);
        require(success, "Failed to call LLM");
        
        emit JudgmentRequested(day);
    }

    function onJudgmentReceived(address eliminatedPlayer, string memory reason) external {
        // Enforce that only the AI Warden Node.js bot can execute judgment
        require(msg.sender == warden, "Only Warden can execute judgment");
        
        uint aliveCount = 0;
        address lastAlive;

        for (uint i = 0; i < players.length; i++) {
            if (players[i].wallet == eliminatedPlayer && players[i].isAlive) {
                players[i].isAlive = false;
                players[i].eliminationReason = reason;
                hasJoined[eliminatedPlayer] = false; // Allow to play again
                emit PlayerEliminated(eliminatedPlayer, reason);
            }
            if (players[i].isAlive) {
                aliveCount++;
                lastAlive = players[i].wallet;
                players[i].currentPrompt = ""; // Reset for next day
            }
        }

        day++;

        if (aliveCount <= 1) {
            gameStarted = false;
            day = 1; // Reset day for next game
            if (aliveCount == 1) {
                payable(lastAlive).transfer(jackpot);
                hasJoined[lastAlive] = false; // Allow winner to play again
                emit GameWon(lastAlive, jackpot);
            }
            jackpot = 0;
        }
    }
    
    function getAllPlayers() external view returns (Player[] memory) {
        return players;
    }
}
