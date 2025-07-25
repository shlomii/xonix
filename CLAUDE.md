### **Project: Xonix Monetization**

*   **Objective**: To develop, deploy, and monetize a web-based version of the game Xonix, with the primary goal of achieving a positive, albeit small, return on investment (ROI).
*   **Core Game**: A single-player game where the user controls a marker to fill in areas of a board while avoiding enemies. Completing a percentage of the board advances the player to the next level, which introduces more enemies.
*   **Monetization Strategy**: Implement in-game advertising as the simplest and fastest method to generate revenue.

---

### **Task List**

**Phase 1: MVP Development & Initial Deployment**

*   **Task 1.1: Basic Game Scaffolding**
    *   [ ] Set up the game board, player character, and basic rendering loop.
*   **Task 1.2: Core Gameplay Mechanics**
    *   [ ] Implement player movement controls.
    *   [ ] Develop the area-filling ("drawing") logic.
    *   [ ] Implement the logic for claiming a filled area.
*   **Task 1.3: Enemy Implementation**
    *   [ ] Create enemies with basic, predictable movement patterns.
    *   [ ] Implement collision detection (player vs. enemy, player vs. own trail).
*   **Task 1.4: Game Loop & Progression**
    *   [ ] Implement scoring based on the area filled.
    *   [ ] Create the level system: track the percentage of the board filled to trigger level completion.
    *   [ ] Add logic to increase the number of enemies with each new level.
    *   [ ] Implement a "Game Over" state and a way to restart.
*   **Task 1.5: UI/UX**
    *   [ ] Display essential information: Score, Lives, Current Level, and area filled percentage.
    *   [ ] Create a simple start screen and a game-over screen.
*   **Task 1.6: Automated Deployment (Current Step)**
    *   [X] **Clarify repository details and deployment expectations.**
    *   [ ] **Create `.gitlab-ci.yml` to set up automated deployment to GitLab Pages.**

**Phase 2: Monetization Integration**

*   **Task 2.1: Ad Network Setup**
    *   [ ] Research and choose a suitable ad network for web games (e.g., Google AdSense for games).
    *   [ ] Create an account and set up the necessary ad units.
*   **Task 2.2: Ad Implementation**
    *   [ ] Integrate the ad network's SDK into the project.
    *   [ ] Add a non-intrusive banner ad that is visible during gameplay.
    *   [ ] Implement an interstitial (full-page) ad to be shown between levels or upon game over.
*   **Task 2.3: Compliance**
    *   [ ] Create and link to a simple Privacy Policy page, as required by most ad networks.

**Phase 3: Analytics & Optimization**

*   **Task 3.1: Basic Analytics**
    *   [ ] Integrate a lightweight analytics tool (like Google Analytics) to track player engagement.
*   **Task 3.2: Key Metric Tracking**
    *   [ ] Track essential data: daily active users, session length, levels reached, and ad impressions.
*   **Task 3.3: Iteration**
    *   [ ] Monitor the data to ensure the game is engaging and the ads are performing as expected. Make small adjustments as needed to improve the player experience and revenue.

