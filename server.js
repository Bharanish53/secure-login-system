const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: "securekey",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.static("public"));

const db = mysql.createConnection({
  host: mysql.railway.internal,
  user: root,
  password: ODSSQOjkpdFRdPFSdLemiraSloVzwkVA,
  database: railway,
  port: 3306
});

db.connect((err) => {
  if (err) {
    console.log("Database Connection Failed");
  } else {
    console.log("Database Connected");
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.send("All fields are required");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query =
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";

    db.execute(query, [username, email, hashedPassword], (err) => {
      if (err) {
        console.log(err);
        return res.send("Registration Failed");
      }

      res.send("User Registered Successfully");
    });
  } catch (error) {
    console.log(error);
    res.send("Error");
  }
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const query = "SELECT * FROM users WHERE username = ?";

  db.execute(query, [username], async (err, results) => {
    if (err) {
      return res.send("Database Error");
    }

    if (results.length === 0) {
      return res.send("User Not Found");
    }

    const user = results[0];

    const match = await bcrypt.compare(password, user.password);

    if (match) {
      req.session.user = user.username;
      res.send("Login Successful");
    } else {
      res.send("Invalid Password");
    }
  });
});

app.get("/dashboard", (req, res) => {
  if (req.session.user) {
    res.send(`
      <h1>Welcome ${req.session.user}</h1>
      <a href="/logout">Logout</a>
    `);
  } else {
    res.send("Please Login First");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.send("Logged Out Successfully");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
