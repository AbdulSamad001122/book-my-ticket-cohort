import fs from "fs";
import { pool } from "./index.mjs";

const setupDatabase = async () => {
    try {
        const sql = fs.readFileSync("init.sql", "utf-8");
        console.log("Executing init.sql...");
        await pool.query(sql);
        console.log("Database tables created successfully!");
    } catch (err) {
        console.error("Error creating tables:", err);
    } finally {
        process.exit();
    }
};

setupDatabase();
