function checkGoogleMapsLoaded() {
    if (typeof google === "undefined" || !google.maps) {
        console.error("❌ Błąd: Google Maps API nie jest załadowane!");
        return false;
    }
    return true;
}
let checkMapsLoaded = setInterval(() => {
    if (typeof google !== "undefined" && google.maps) {
        console.log("✅ Google Maps API załadowane.");
        clearInterval(checkMapsLoaded); // Zatrzymujemy sprawdzanie
        initMap(); // Dopiero teraz inicjalizujemy mapę
    }
}, 100); // Sprawdzamy co 100ms, aż API będzie dostępne

document.addEventListener("DOMContentLoaded", function () {
    if (!checkGoogleMapsLoaded()) return; 

    // Pobieranie elementów formularza
    let pickupInput = document.getElementById("pickup");
    let deliveryInput = document.getElementById("delivery");
    let countryInput = document.getElementById("country");
    let vatRateInput = document.getElementById("vat-rate");
    let stopsContainer = document.getElementById("stops-container");
    let distanceResult = document.getElementById("distance-result");
    let companySelect = document.getElementById("company");
    let vehicleSelect = document.getElementById("vehicle");
    let routeInput = document.getElementById("route");

    // Sprawdzenie, czy wszystkie elementy istnieją
    if (!pickupInput || !deliveryInput || !countryInput || !vatRateInput || !companySelect || !vehicleSelect) {
        console.error("❌ Nie znaleziono jednego z wymaganych elementów formularza!");
        return;
    }

    console.log("✅ Skrypt JS załadowany poprawnie!");

    // ✅ Inicjalizacja autouzupełniania dla adresów
    function initAutocomplete(input) {
        if (!checkGoogleMapsLoaded()) return;

        let autocomplete = new google.maps.places.Autocomplete(input);
        autocomplete.addListener("place_changed", function () {
            let place = autocomplete.getPlace();
            if (!place.address_components) return;
            input.setAttribute("data-place", JSON.stringify(place));
        });
    }

    // 📌 Wywołanie funkcji dla pól formularza
    initAutocomplete(pickupInput);
    initAutocomplete(deliveryInput);

    // ✅ Obsługa zmiany firmy - wybór samochodów
    const vehicles = {
        grand: ["WGM 1642G", "FZ 5217S", "FZ 0291S", "FZ 0292S", "FZ 0293S", "FZ 0294S", "FZ 0523S", "FZ 0612S"],
        graal_wit: ["FZ3909R", "WGM2833F", "FZ8606R", "TK326AV", "TKI4674K", "FZ1936S"]
    };

    companySelect.addEventListener("change", function () {
        console.log("Firma zmieniona!");
        vehicleSelect.innerHTML = "<option value=''>-- Wybierz samochód --</option>";

        if (this.value && vehicles[this.value]) {
            vehicles[this.value].forEach(vehicle => {
                let option = document.createElement("option");
                option.value = vehicle;
                option.textContent = vehicle;
                vehicleSelect.appendChild(option);
            });
        }

        vehicleSelect.disabled = false;
    });

});

// ✅ Funkcja sprawdzająca, czy Google Maps API jest załadowane
function checkGoogleMapsLoaded() {
    if (typeof google === "undefined" || !google.maps) {
        console.error("❌ Google Maps API nie zostało załadowane!");
        return false;
    }
    return true;
}

    function addAutocompleteToField(field) {
        new google.maps.places.Autocomplete(field);
    }

    // 🛑 Automatyczne uzupełnianie kraju rozładunku i VAT
let autocompleteDelivery = new google.maps.places.Autocomplete(deliveryInput);
autocompleteDelivery.addListener("place_changed", function () {
    let place = autocompleteDelivery.getPlace();
    if (!place || !place.address_components) {
        console.error("❌ Błąd: `place` jest niezdefiniowane.");
        return;
    }

    let country = "Nieznany";

    if (place && place.address_components) {
        place.address_components.forEach(component => {
            if (component.types.includes("country")) {
                let countryName = component.long_name;
                let countryShort = component.short_name;
                country = countrySymbols[countryShort] || countrySymbols[countryName] || countryName;
            }
        });
    }

    countryInput.value = country;
    console.log(`🌍 Kraj rozładunku: ${country}`);
});

// 📌 Funkcja powinna być ZANIM zostanie użyta w `updateRoute()`
function getPostalCode(input) {
    if (!input) return "";
    let placeData = input.getAttribute("data-place");
    if (!placeData) return "";

    let place = JSON.parse(placeData);
    if (!place || !place.address_components) return "";

    let postalCode = "";
    place.address_components.forEach(component => {
        if (component.types.includes("postal_code")) {
            postalCode = component.long_name;
        }
    });

    return postalCode;
}

// 📌 Teraz można jej użyć w updateRoute()
function updateRoute() {
    let pickupCode = getPostalCode(document.getElementById("pickup"));
    let deliveryCode = getPostalCode(document.getElementById("delivery"));

    console.log("🚛 Trasa wygenerowana:", pickupCode, deliveryCode);
}


// 🔹 Lista prefiksów krajów
const countrySymbols = {
    "Austria": "AT", "Belgia": "BE", "Bułgaria": "BG", "Chorwacja": "HR",
    "Cypr": "CY", "Czechy": "CZ", "Dania": "DK", "Estonia": "EE",
    "Finlandia": "FI", "Francja": "FR", "Grecja": "GR", "Hiszpania": "ES",
    "Holandia": "NL", "Irlandia": "IE", "Litwa": "LT", "Luksemburg": "LU",
    "Łotwa": "LV", "Malta": "MT", "Niemcy": "DE", "Polska": "PL",
    "Portugalia": "PT", "Rumunia": "RO", "Słowacja": "SK", "Słowenia": "SI",
    "Szwecja": "SE", "Węgry": "HU", "Włochy": "IT", "Norwegia": "NO",
    "Szwajcaria": "CH", "Wielka Brytania": "UK", "Turcja": "TR",
    "Albania": "AL", "Andora": "AD", "Armenia": "AM", "Azerbejdżan": "AZ",
    "Bośnia i Hercegowina": "BA", "Czarnogóra": "ME", "Gruzja": "GE",
    "Islandia": "IS", "Kosowo": "XK", "Liechtenstein": "LI",
    "Macedonia Północna": "MK", "Mołdawia": "MD", "Monako": "MC",
    "San Marino": "SM", "Serbia": "RS", "Ukraina": "UA", "Watykan": "VA",
    "Białoruś": "BY", "Rosja": "RU"
};



        if (place.address_components) {
            for (let component of place.address_components) {
                if (component.types.includes("country")) {
                    country = component.long_name;
                    break;
                }
            }
        }

        countryInput.value = country;

        // 🔄 Uzupełnianie VAT na podstawie kraju
        const vatRates = {
            "Austria": "23%", "Belgia": "23%", "Bułgaria": "23%", "Francja": "23%",
            "Niemcy": "23%", "Polska": "23%", "Włochy": "23%", "Norwegia": "0%",
            "Szwajcaria": "0%", "Wielka Brytania": "0%", "Turcja": "0%"
        };

        vatRateInput.value = vatRates[country] || "Nieznana";
   
    // ➕ Dodawanie przystanku
    document.getElementById("add-stop").addEventListener("click", function () {
        let stopDiv = document.createElement("div");
        stopDiv.classList.add("stop-container");
    
        let stopInput = document.createElement("input");
        stopInput.type = "text";
        stopInput.name = "stop";
        stopInput.classList.add("stop-input");
        stopInput.placeholder = "Wpisz przystanek";
    
        let removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.classList.add("delete-stop");
        removeButton.innerHTML = "🗑";
        removeButton.addEventListener("click", function () {
            stopDiv.remove();
            updateRoute(); // 📌 Aktualizacja trasy po dodaniu przystanku
        });
    
        stopDiv.appendChild(stopInput);
        stopDiv.appendChild(removeButton);
        stopsContainer.appendChild(stopDiv);
    
        initAutocomplete(stopInput); // 📌 Dodanie autouzupełniania dla nowych przystanków
    });

    // 🔄 Obliczanie odległości
document.getElementById("calculate-distance").addEventListener("click", function () {
    console.log("🛣️ Rozpoczęto obliczanie dystansu...");
    updateRoute(); // 📌 Teraz zawsze generuje trasę!

    // 🛑 PRZENOSIMY `return` DO TEJ FUNKCJI!
    if (!pickupInput.value || !deliveryInput.value) {
        alert("❗ Podaj adres załadunku i rozładunku.");
        return; // ✅ Teraz jest poprawnie!
    }

    let stops = document.querySelectorAll(".stop-input");
    let waypoints = [];

    stops.forEach(stop => {
        if (stop.value.trim() !== "") {
            waypoints.push({ location: stop.value, stopover: true });
        }
    });

});
        let service = new google.maps.DirectionsService();
let tollRoadsElement = document.getElementById("toll-roads");
let avoidTolls = tollRoadsElement ? !tollRoadsElement.checked : false;

let request = {
    origin: pickupInput.value,
    destination: deliveryInput.value,
    waypoints: waypoints && waypoints.length > 0 ? waypoints : [],
    travelMode: "DRIVING",
    avoidTolls: avoidTolls
};


        service.route(request, function (result, status) {
            console.log("🔎 API Status:", status);
        
            if (status === "OK") {
                let totalDistance = 0;
                if (result.routes && result.routes.length > 0) {
                    result.routes[0].legs.forEach(leg => {
                        totalDistance += leg.distance.value;
                    });
                    totalDistance = (totalDistance / 1000).toFixed(1);
                    distanceResult.innerText = `Łączny dystans: ${totalDistance} km`;
                } else {
                    distanceResult.innerText = "Błąd: brak dostępnej trasy.";
                    console.error("❌ Błąd: brak wyników w odpowiedzi API.");
                }
            } else {
                let errorMessage = {
                    "ZERO_RESULTS": "Brak trasy dla podanych lokalizacji.",
                    "NOT_FOUND": "Jedna z lokalizacji nie została odnaleziona.",
                    "OVER_QUERY_LIMIT": "Przekroczono limit zapytań do API.",
                    "REQUEST_DENIED": "Żądanie zostało odrzucone.",
                    "INVALID_REQUEST": "Nieprawidłowe zapytanie.",
                    "UNKNOWN_ERROR": "Wystąpił nieznany błąd. Spróbuj ponownie."
                }[status] || `Nieznany błąd: ${status}`;
        
                distanceResult.innerText = errorMessage;
                console.error(`❌ Błąd Google Maps: ${errorMessage}`);
            }
        });

        let map;
        let directionsService;
        let directionsRenderer;
        
        // ✅ Wyznaczanie trasy
        function calculateRoute() {
            if (!directionsService || !directionsRenderer) {
                console.error("❌ Błąd: Mapa nie została jeszcze zainicjalizowana!");
                return;
            }
        
            let pickupAddress = pickupInput.value.trim();
            let deliveryAddress = deliveryInput.value.trim();
            let waypoints = [];
        
            document.querySelectorAll(".stop-input").forEach(input => {
                if (input.value.trim() !== "") {
                    waypoints.push({
                        location: input.value.trim(),
                        stopover: true
                    });
                }
            });
        
            if (!pickupAddress || !deliveryAddress) {
                alert("⚠️ Podaj adresy załadunku i rozładunku.");
                return;
            }
        
            let tollRoadsElement = document.getElementById("toll-roads");
            let avoidTolls = tollRoadsElement ? !tollRoadsElement.checked : false;
        
            let request = {
                origin: pickupAddress,
                destination: deliveryAddress,
                waypoints: waypoints,
                travelMode: "DRIVING",
                avoidTolls: avoidTolls
            };
        
            directionsService.route(request, function (result, status) {
                if (status === "OK") {
                    directionsRenderer.setDirections(result);
        
                    let totalDistance = 0;
                    result.routes[0].legs.forEach(leg => {
                        totalDistance += leg.distance.value;
                    });
        
                    totalDistance = (totalDistance / 1000).toFixed(1);
                    distanceResult.innerText = `Łączny dystans: ${totalDistance} km`;
        
                    console.log(`✅ Obliczony dystans: ${totalDistance} km`);
                } else {
                    let errors = {
                        "ZERO_RESULTS": "Brak trasy.",
                        "NOT_FOUND": "Jedna z lokalizacji nie została odnaleziona.",
                        "OVER_QUERY_LIMIT": "Przekroczono limit zapytań.",
                        "REQUEST_DENIED": "Żądanie odrzucone.",
                        "INVALID_REQUEST": "Nieprawidłowe zapytanie.",
                        "UNKNOWN_ERROR": "Nieznany błąd."
                    };
        
                    let errorMessage = errors[status] || `Nieznany błąd: ${status}`;
                    distanceResult.innerText = errorMessage;
                    console.error(`❌ Błąd Google Maps: ${errorMessage}`);
                }
            });
        }
        // 🔹 2. FUNKCJA `initMap()` – Powinna być umieszczona tutaj!
function initMap() {
    let mapDiv = document.getElementById("map");

    // 🔹 Jeśli `#map` nie istnieje, to nie próbujemy tworzyć mapy
    if (!mapDiv) {
        console.error("❌ Błąd: Brak elementu `#map` w HTML!");
        return;
        // 🔹 Jeśli Google Maps API nie jest jeszcze gotowe, to nie wykonujemy kodu
    if (typeof google === "undefined" || !google.maps) {
        console.error("❌ Google Maps API nie jest jeszcze gotowe.");
        return;
    }
       
        function updateRoute() {
            let pickupCode = getPostalCode(pickupInput);
            let deliveryCode = getPostalCode(deliveryInput);
            let stopsCodes = Array.from(document.querySelectorAll(".stop-input"))
                .map(stop => getPostalCode(stop))
                .filter(code => code !== "");
        
            let fullRoute = [pickupCode, ...stopsCodes, deliveryCode].join(" - ");
            routeInput.value = fullRoute;
        
            console.log("🚛 Trasa wygenerowana:", fullRoute);
        }}
        // 📌 Nasłuchiwanie na załadowanie strony
window.addEventListener("load", initMap);
document.getElementById("calculate-distance").addEventListener("click", calculateRoute);
pickupInput.addEventListener("blur", updateRoute);
deliveryInput.addEventListener("blur", updateRoute);
stopsContainer.addEventListener("input", updateRoute);
    }


    
 // 🚀 TUTAJ POPRAWNE ZAMKNIĘCIE `DOMContentLoaded`
