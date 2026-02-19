# Netflix Clone with TMDB & MySQL

## How to Run the Application

You need to run the **Backend** and **Frontend** in two separate terminals.

### 1. Start the Backend (Server)
1.  Open a terminal.
2.  Navigate to the project folder:
    ```bash
    cd "c:\Users\Dell\Desktop\MySQL database"
    ```
3.  Start the server:
    ```bash
    node index.js
    ```
    *You should see "Server running on port 3000" and "Connected to MySQL database".*

### 2. Start the Frontend (Client)
1.  Open a **new** terminal.
2.  Navigate to the client folder:
    ```bash
    cd "c:\Users\Dell\Desktop\MySQL database\client"
    ```
3.  Start the React app:
    ```bash
    npm run dev
    ```
4.  Open the link shown (usually `http://localhost:5173`) in your browser.

## Features
- **Login/Signup**: Split-screen design with MySQL integration.
- **Home Screen**: Netflix-like UI fetching data from TMDB.
- **Movies**: Trending, Top Rated, and Genre-based rows.
