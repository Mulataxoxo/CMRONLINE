require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const XLSX = require("xlsx");
const fs = require("fs");
const multer = require("multer");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Konfiguracja przesyłania plików
const upload = multer({ storage: multer.memoryStorage() });

// Ścieżka do pliku Excel
const FILE_PATH = "C:\\Users\\opacz\\OneDrive\\SERWISY,ZJAZDY,WINIETY GRAAL WIT- GRAND\\PINK CMR SOLUTIONS.xlsm";
const SHEET_NAME = "LISTA TRASEK"; 

console.log("📁 Ścieżka do pliku Excel:", FILE_PATH);

// Endpoint do zapisu formularza w Excelu
app.post("/submit", upload.fields([{ name: "cmr-photo" }, { name: "hotel-invoice" }]), async (req, res) => {
    try {
        if (!fs.existsSync(FILE_PATH)) {
            return res.status(500).json({ error: "❌ Plik Excel nie istnieje!" });
        }

        let workbook = XLSX.readFile(FILE_PATH);
        let worksheet = workbook.Sheets[SHEET_NAME];

        let formData = JSON.parse(req.body.formData);
        console.log("📊 Dane otrzymane z formularza:", formData);

        let existingData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        existingData.push([
            formData.vehicle, formData.pickupDate, formData.pickup, formData.deliveryDate, 
            formData.delivery, formData.distance
        ]);

        let newWorksheet = XLSX.utils.aoa_to_sheet(existingData);
        workbook.Sheets[SHEET_NAME] = newWorksheet;
        XLSX.writeFile(workbook, FILE_PATH);

        res.status(201).json({ message: "✅ Formularz zapisany w Excelu!" });
    } catch (error) {
        console.error("❌ Błąd zapisu do Excela:", error);
        res.status(500).json({ error: "Błąd zapisu do Excela", details: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serwer działa na http://localhost:${PORT}`));
