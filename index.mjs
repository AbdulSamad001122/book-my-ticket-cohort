//  CREATE TABLE seats (
//      id SERIAL PRIMARY KEY,
//      name VARCHAR(255),
//      isbooked INT DEFAULT 0
//  );
// INSERT INTO seats (isbooked)
// SELECT 0 FROM generate_series(1, 20);

import express from "express";
import pg from "pg";
import { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";
import ApiResponse from "./src/common/utils/Api-response.js";
import authRoutes from "./src/module/auth/auth.routes.js";
import authenticate from "./src/module/auth/auth.middleware.js";
import ErroToJson from "./src/common/middleware/beautifyError.middleware.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const port = process.env.PORT;

// Equivalent to mongoose connection
// Pool is nothing but group of connections
// If you pick one connection out of the pool and release it
// the pooler will keep that connection open for sometime to other clients to reuse
const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };

export const pool = new pg.Pool({
  ...poolConfig,
  max: 20,
  connectionTimeoutMillis: 0,
  idleTimeoutMillis: 0,
});

const app = express();

app.use(cors());
app.use(express.json()); 
app.use(cookieParser());

// Apply our authentication routes
app.use("/api/auth", authRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", uptime: process.uptime(), timestamp: new Date() });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/src/page/auth/login.html");
});

app.get("/register", (req, res) => {
  res.sendFile(__dirname + "/src/page/auth/register.html");
});





//get all seats
app.get("/seats", authenticate, async (req, res) => {
  const result = await pool.query("select * from seats"); // equivalent to Seats.find() in mongoose
  ApiResponse.ok(res, "Seats fetched successfully", result.rows);
});

//book a seat give the seatId and your name

app.put("/:id", authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    const name = req.user.username; // Grab perfectly valid username from the JWT middleware payload
    // payment integration should be here
    // verify payment
    const conn = await pool.connect(); // pick a connection from the pool
    //begin transaction
    // KEEP THE TRANSACTION AS SMALL AS POSSIBLE
    await conn.query("BEGIN");
    //getting the row to make sure it is not booked
    /// $1 is a variable which we are passing in the array as the second parameter of query function,
    // Why do we use $1? -> this is to avoid SQL INJECTION
    // (If you do ${id} directly in the query string,
    // then it can be manipulated by the user to execute malicious SQL code)
    const sql = "SELECT * FROM seats where id = $1 and isbooked = 0 FOR UPDATE";
    const result = await conn.query(sql, [id]);

    //if no rows found then the operation should fail can't book
    // This shows we Do not have the current seat available for booking
    if (result.rowCount === 0) {
      res.send({ error: "Seat already booked" });
      return;
    }
    //if we get the row, we are safe to update
    const sqlU = "update seats set isbooked = 1, name = $2 where id = $1";
    const updateResult = await conn.query(sqlU, [id, name]); // Again to avoid SQL INJECTION we are using $1 and $2 as placeholders

    //end transaction by committing
    await conn.query("COMMIT");
    conn.release(); // release the connection back to the pool
    res.send({ success: true, username: name }); // Return username to frontend
  } catch (ex) {
    console.log(ex);
    res.send(500);
  }
});

// IMPORTANT: Global Error Handler must be the LAST middleware!
app.use(ErroToJson);

app.listen(port, () => console.log("Server starting on port: " + port));
