# 🎌 Anime Tracker — Backend

The backend of Anime Tracker, a REST API built with Node.js and Express that handles authentication, anime data, and user lists.

> 🔗 Frontend repository: [anime-tracker-frontend](https://github.com/your-username/anime-tracker-frontend)

## 🛠️ Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT (jsonwebtoken) for authentication
- bcrypt for password hashing
- Joi for data validation
- [Jikan API](https://jikan.moe/) — unofficial MyAnimeList REST API

## 📡 API Endpoints

### Auth

| Method | Route       | Description                   |
| ------ | ----------- | ----------------------------- |
| POST   | `/register` | Register a new user           |
| POST   | `/login`    | Login and receive a JWT token |

### Anime (protected — requires JWT token)

| Method | Route         | Description                           |
| ------ | ------------- | ------------------------------------- |
| GET    | `/animes`     | Get all animes for the logged in user |
| POST   | `/animes`     | Add a new anime to the user's list    |
| PUT    | `/animes/:id` | Update anime status or rating         |
| DELETE | `/animes/:id` | Delete an anime from the user's list  |

### Search

| Method | Route            | Description                          |
| ------ | ---------------- | ------------------------------------ |
| GET    | `/search?q=name` | Search anime by name using Jikan API |

## 🚀 Getting Started

### Prerequisites

- Node.js installed
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/anime-tracker-backend.git
cd anime-tracker-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a `.env` file

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

> ⚠️ Never commit your `.env` file to GitHub. Make sure it's in your `.gitignore`.

### 4. Start the server

```bash
node server.js
```

Server runs on [http://localhost:5000](http://localhost:5000)

## 🔐 Authentication

Protected routes require a JWT token in the request header:

```
Authorization: Bearer your_token_here
```

The token is returned from `/register` and `/login` and expires in 7 days.

## 👨‍💻 Author

Made with ❤️ from Lima, Peru 🇵🇪  
First full stack project — Software Engineering student.
