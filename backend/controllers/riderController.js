import Rider from "../models/rider.js";
import { isAdmin } from "./userController.js";

async function getNextRiderId() {
  const lastRider = await Rider.findOne({ riderId: /^BYNRD\d+$/ })
    .sort({ riderId: -1 })
    .select("riderId");
  const lastNumber = lastRider?.riderId
    ? parseInt(lastRider.riderId.replace("BYNRD", ""), 10)
    : 0;
  return "BYNRD" + String(lastNumber + 1).padStart(5, "0");
}

/* -------------------- ADD RIDER -------------------- */
export async function addRider(req, res) {
  if (!isAdmin(req)) {
    return res
      .status(403)
      .json({ message: "You are not authorized to add riders" });
  }

  try {
    const newRiderId = await getNextRiderId();

    // Check if rider already exists
    const existing = await Rider.findOne({ riderId: newRiderId });
    if (existing) {
      return res.status(400).json({ message: "Rider Id already exists" });
    }

    // ✅ Validate Name (letters and spaces only, no digits or symbols)
    const name = String(req.body.Name || "").trim();
    if (!name || !/^[A-Za-z\s]+$/.test(name)) {
      return res.status(400).json({
        message: "Name must contain only letters and spaces (no numbers or symbols)",
      });
    }

    // ✅ Validate Email (must be a valid Gmail address)
    const email = String(req.body.email || "").trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Email must be a valid Gmail address (e.g., test@gmail.com)",
      });
    }

    // ✅ Validate Phone Number
    const phone = String(req.body.contactNo || "").trim();
    if (!/^\d{10}$/.test(phone)) {
      return res
        .status(400)
        .json({ message: "Phone number must be exactly 10 digits" });
    }

    // Create new Rider
    const rider = new Rider({
      riderId: newRiderId,
      email,
      Name: name,
      contactNo: phone,
      vehicleType: req.body.vehicleType,
      status: Boolean(req.body.status),
    });

    await rider.save();
    res.json({ message: "Rider added successfully", rider, riderId: newRiderId });
  } catch (err) {
    console.error("Add Rider Error:", err);
    res
      .status(500)
      .json({ message: "Failed to add rider", error: err.message });
  }
}

/* -------------------- GET ALL RIDERS -------------------- */
export async function getRiders(req, res) {
  if (!isAdmin(req)) {
    return res
      .status(403)
      .json({ message: "You are not authorized to view riders" });
  }

  try {
    const riders = await Rider.find();
    res.json(riders);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch riders", error: err.message });
  }
}

/* -------------------- UPDATE RIDER -------------------- */
export async function updateRider(req, res) {
  if (!isAdmin(req)) {
    return res
      .status(403)
      .json({ message: "You are not authorized to update riders" });
  }

  try {
    const riderId = req.params.riderId;

    // ✅ Validate Name again on update
    if (req.body.Name && !/^[A-Za-z\s]+$/.test(req.body.Name.trim())) {
      return res.status(400).json({
        message: "Name must contain only letters and spaces (no numbers or symbols)",
      });
    }

    // ✅ Validate Email format if provided
    if (req.body.email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (!emailRegex.test(req.body.email.trim())) {
        return res.status(400).json({
          message: "Email must be a valid Gmail address (e.g., test@gmail.com)",
        });
      }
    }

    // ✅ Validate Phone format
    if (req.body.contactNo) {
      const phone = String(req.body.contactNo || "").trim();
      if (!/^\d{10}$/.test(phone)) {
        return res
          .status(400)
          .json({ message: "Phone number must be exactly 10 digits" });
      }
    }

    await Rider.updateOne({ riderId }, req.body);
    res.json({ message: "Rider updated successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update rider", error: err.message });
  }
}

/* -------------------- DELETE RIDER -------------------- */
export async function deleteRider(req, res) {
  if (!isAdmin(req)) {
    return res
      .status(403)
      .json({ message: "You are not authorized to delete riders" });
  }

  try {
    const riderId = req.params.riderId;
    await Rider.deleteOne({ riderId });

    res.json({ message: "Rider deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete rider", error: err.message });
  }
}
