* {
    box-sizing: border-box;
}

body {
    margin: 0;
    font-family: Arial, sans-serif;
    background: #f2f5f8;
}

.auth-container {
    width: 100%;
    max-width: 450px;
    margin: 50px auto;
    padding: 20px;
    text-align: center;
}

.auth-container h1 {
    margin-bottom: 5px;
}

.auth-container > p {
    color: #666;
    margin-bottom: 25px;
}

.auth-box {
    background: white;
    padding: 25px;
    border-radius: 10px;
    box-shadow: 0 3px 15px rgba(0, 0, 0, 0.1);
}

.auth-box h2 {
    margin-top: 10px;
}

.auth-box input {
    width: 100%;
    padding: 12px;
    margin: 8px 0;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 15px;
}

.auth-box button {
    width: 100%;
    padding: 12px;
    margin-top: 10px;
    border: none;
    border-radius: 6px;
    background: #1f5eff;
    color: white;
    font-size: 16px;
    cursor: pointer;
}

.auth-box button:hover {
    opacity: 0.9;
}

.auth-box p {
    min-height: 20px;
    font-size: 14px;
}

.auth-box hr {
    margin: 30px 0;
    border: none;
    border-top: 1px solid #ddd;
}

#registerMessage,
#loginMessage {
    color: #333;
}