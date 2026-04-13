import { pool } from "./index.mjs";

const resetSeats = async () => {
    try {
        console.log("Resetting all seats...");
        await pool.query("UPDATE seats SET name = NULL, isbooked = 0;");
        console.log("Seats successfully reset! Everyone can book again.");
    } catch (err) {
        console.error("Error resetting seats:", err);
    } finally {
        process.exit();
    }
};

resetSeats();
