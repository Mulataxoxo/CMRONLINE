function loadGoogleMapsAPI() {
    if (typeof google !== "undefined" && google.maps) {
        console.log("✅ Google Maps API już załadowane.");
        initMap();
        return;
    }

    console.log("⏳ Ładowanie Google Maps API...");
    
    let script = document.createElement("script");
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBQfbB1-KewAmrPcoPXq4aYNsQggT1iPHY&libraries=places&callback=initMap";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

// 🔹 1. GLOBALNE ZMIENNE
let map;
let directionsService;
let directionsRenderer;
let previousToPickupLine = null; // 🔥 Dodaj tę linię

// 🔹 2. FUNKCJA `initMap()` – Tworzenie mapy
function initMap() {
    let mapDiv = document.getElementById("map");

    if (!mapDiv) {
        console.error("❌ Błąd: Brak elementu `#map` w HTML!");
        return;
    }

    if (typeof google === "undefined" || !google.maps) {
        console.error("❌ Google Maps API nie jest jeszcze gotowe.");
        return;
    }

    map = new google.maps.Map(mapDiv, {
        zoom: 6,
        center: { lat: 52.2297, lng: 21.0122 },
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        draggable: true // 🔹 Teraz linia trasy jest edytowalna!
    });

    // 🔹 Nasłuchiwanie na zmiany w trasie
    google.maps.event.addListener(directionsRenderer, "directions_changed", function () {
        recalculateDistance();
    });

    console.log("✅ Mapa załadowana poprawnie.");
}
window.initMap = initMap; // SPRAWDZAMY, CZY FUNKCJA `initMap()` JEST DOSTĘPNA GLOBALNIE

// 🔹 2.1. AUTOUZUPEŁNIANIE DLA URZĄDZEŃ MOBILNYCH
function fixAutocompleteOnTouch(input) {
    input.addEventListener("focus", function () {
        let event = new Event("keydown", { bubbles: true, cancelable: true });
        event.keyCode = 40; // Symulujemy strzałkę w dół, aby otworzyć listę
        input.dispatchEvent(event);
    });
}

// 🔹 3. INICJALIZACJA SKRYPTU PO ZAŁADOWANIU STRONY
document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ Dokument załadowany!");

    loadGoogleMapsAPI(); // 🔥 Teraz API ładuje się asynchronicznie

    waitForGoogleMaps(() => {
        initMap();
        
        let pickupInput = document.getElementById("pickup");
        let deliveryInput = document.getElementById("delivery");
        let previousDeliveryInput = document.getElementById("previous-delivery");
        let stopsContainer = document.getElementById("stops-container");

        if (pickupInput) initAutocomplete(pickupInput);
        if (deliveryInput) initAutocomplete(deliveryInput);
        if (previousDeliveryInput) initAutocomplete(previousDeliveryInput);

        if (deliveryInput) {
            deliveryInput.addEventListener("blur", function () {
                setCountryFromAddress();
                updateRoute();
            });
        }

        if (pickupInput) {
            pickupInput.addEventListener("blur", function () {
                updateRoute();
                drawPreviousToPickupLine();
            });
        }

        if (stopsContainer) {
            stopsContainer.addEventListener("input", updateRoute);
        }

        if (previousDeliveryInput) {
            previousDeliveryInput.addEventListener("blur", function () {
                drawPreviousToPickupLine();
                calculateRoute();
            });
        }

        document.getElementById("calculate-distance").addEventListener("click", calculateRoute);
        document.getElementById("add-stop").addEventListener("click", addStop);
        document.getElementById("transport-form").addEventListener("submit", function (event) {
            event.preventDefault();
            console.log("📩 Formularz wysłany!");
        });

        document.getElementById("add-route-button").addEventListener("click", function () {
            updateTable();
            document.getElementById("transport-form").reset();
        });

        // 🔥 Ustawienie autouzupełniania dla dynamicznie dodawanych przystanków
        stopsContainer.addEventListener("DOMNodeInserted", function (event) {
            if (event.target && event.target.querySelector(".stop-input")) {
                initAutocomplete(event.target.querySelector(".stop-input"));
            }
        });
        
    });
});

// 🔹 4. AUTOUZUPEŁNIANIE ADRESÓW Z GOOGLE PLACES API (OGRANICZONE DO EUROPY)
function initAutocomplete(input) {
    if (!checkGoogleMapsLoaded()) {
        console.warn(`⏳ Czekam na Google Maps API dla: ${input.id}`);
        setTimeout(() => initAutocomplete(input), 1000); // Powtarzamy co 1 sek.
        return;
    }

    let autocomplete = new google.maps.places.Autocomplete(input, {
        types: ["geocode"], // Pomaga filtrować wyniki do adresów
    });

    autocomplete.addListener("place_changed", function () {
        let place = autocomplete.getPlace();
        if (!place || !place.address_components) {
            console.warn(`⚠️ Nie udało się pobrać szczegółów miejsca dla: ${input.id}`);
            return;
        }

        let country = getCountryFromPlace(place);
        
        // 🔥 Ograniczamy tylko do krajów europejskich
        if (!isEuropeanCountry(country)) {
            console.warn(`🚫 Wybrany kraj (${country}) nie znajduje się w Europie.`);
            alert("🌍 Wybierz adres w Europie!");
            input.value = ""; // Czyścimy pole
            return;
        }

        input.setAttribute("data-place", JSON.stringify(place));
        console.log(`✅ Dane miejsca zapisane dla: ${input.id}, Kraj: ${country}`);

        // 🔥 Jeśli użytkownik wybierze miejsce w `delivery`, aktualizujemy trasę!
        if (input.id === "delivery") {
            setCountryFromAddress();
            updateRoute();
        }
    });

    console.log(`🔹 Autouzupełnianie aktywowane dla: ${input.id}`);

    // 🔥 Naprawa problemu z autouzupełnianiem na ekranach dotykowych
    fixAutocompleteOnTouch(input);
}

// 🔹 Pobiera kraj z obiektu `place`
function getCountryFromPlace(place) {
    for (let component of place.address_components) {
        if (component.types.includes("country")) {
            return component.short_name; // Zwraca kod kraju (np. "PL" dla Polski)
        }
    }
    return null;
}

// 🔹 Sprawdza, czy kraj należy do Europy
function isEuropeanCountry(countryCode) {
    const europeanCountries = [
        "AT", "BE", "BG", "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", 
        "GB", "GR", "HR", "HU", "IE", "IS", "IT", "LI", "LT", "LU", "LV", "MC", 
        "MT", "NL", "NO", "PL", "PT", "RO", "SE", "SI", "SK", "SM", "VA"
    ];
    return europeanCountries.includes(countryCode);
}


// 🔹 5. SPRAWDZANIE, CZY GOOGLE MAPS API JEST ZAŁADOWANE
function checkGoogleMapsLoaded() {
    if (typeof google === "undefined" || !google.maps) {
        console.error("❌ Google Maps API nie zostało załadowane!");
        return false;
    }
    return true;
}

// 🔹 6. AUTOMATYCZNE UZUPEŁNIANIE KRAJU ROZŁADUNKU I VAT
const vatRates = {
    "Austria": "23%", "Belgia": "23%", "Bułgaria": "23%", "Francja": "23%",
    "Niemcy": "23%", "Polska": "23%", "Włochy": "23%", "Norwegia": "0%",
    "Szwajcaria": "0%", "Wielka Brytania": "0%", "Turcja": "0%"
};

function setCountryFromAddress() {
    let deliveryInput = document.getElementById("delivery");
    let countryInput = document.getElementById("country");

    if (!deliveryInput || !countryInput) return;

    let placeData = deliveryInput.getAttribute("data-place");
    if (!placeData) return;

    let place = JSON.parse(placeData);
    let country = "Nieznany";

    if (place && place.address_components) {
        place.address_components.forEach(component => {
            if (component.types.includes("country")) {
                country = component.long_name;
            }
        });
    }

    countryInput.value = country;
    console.log(`🌍 Kraj rozładunku: ${country}`);

    setVatRate();
}
// 🔹 9. DODAWANIE PRZYSTANKÓW
function addStop() {
    let stopsContainer = document.getElementById("stops-container");

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
        updateRoute(); // Aktualizacja trasy po usunięciu przystanku
    });

    stopDiv.appendChild(stopInput);
    stopDiv.appendChild(removeButton);
    stopsContainer.appendChild(stopDiv);

    initAutocomplete(stopInput); // Autouzupełnianie dla nowo dodanego przystanku
}

function setVatRate() {
    let countryInput = document.getElementById("country");
    let vatRateInput = document.getElementById("vat-rate");

    if (!countryInput || !vatRateInput) return;

    let country = countryInput.value;
    vatRateInput.value = vatRates[country] || "Nieznana";
}

// 🔹 7. WYBÓR FIRMY I NUMERY AUT
const vehicles = {
    grand: [
        "FZ5217S", "FZ0291S", "FZ0292S", "FZ0293S", "FZ0294S", "FZ0523S", 
        "FZ0613S", "FZ3609S", "FZ4346S", "FZ4308S", "FZ4317S", "FZ4405S", 
        "FZ9892S", "FZ0413T", "FZ0569T", "FZ0570T", "FZ0739T", "FZ0740U", 
        "FZ5474U", "SR3687T", "FZ8190U"
    ],
    graal_wit: [
        "FZ3909R", "WGM2833F", "FZ8606R", "TK326AV", "TKI4674K", "FZ1936S", 
        "FZ2014S", "WPR8501P", "WPR8502P", "WPR8503P", "WPR8504P", "FZ0295S", 
        "FZ0296S", "FZ3611S", "FZ3648S", "FZ3631S", "FZ4404S", "FZ9893S", 
        "FZ0414T", "FZ0691T", "FZ0692T", "FZ0693T", "FZ0464U", "FZ0035R", 
        "FZ3621V", "SR8402T"
    ]
};

document.addEventListener("DOMContentLoaded", function () {
    let companySelect = document.getElementById("company");
    let vehicleSelect = document.getElementById("vehicle");

    if (companySelect && vehicleSelect) {
        companySelect.addEventListener("change", function () {
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
    }
});

// 🔹 8. LICZENIE TRASY Z PRZYSTANKAMI (Z UWZGLĘDNIENIEM POPRZEDNIEGO ROZŁADUNKU)
function calculateRoute() {
    if (!map || !directionsService || !directionsRenderer) {
        console.error("❌ Błąd: Mapa nie została jeszcze zainicjalizowana!");
        return;
    }

    let previousDeliveryInput = document.getElementById("previous-delivery");
    let pickupInput = document.getElementById("pickup");
    let deliveryInput = document.getElementById("delivery");
    let distanceResult = document.getElementById("distance-result");
    let mapLinkInput = document.getElementById("map-link"); // 🔹 Pobieramy pole do wyświetlania linku

    let previousDeliveryAddress = previousDeliveryInput ? previousDeliveryInput.value.trim() : "";
    let pickupAddress = pickupInput.value.trim();
    let deliveryAddress = deliveryInput.value.trim();

    if (!pickupAddress || !deliveryAddress) {
        alert("❗ Podaj adres załadunku i rozładunku.");
        return;
    }

    let waypoints = [];
    document.querySelectorAll(".stop-input").forEach(input => {
        if (input.value.trim() !== "") {
            waypoints.push({
                location: input.value.trim(),
                stopover: true
            });
        }
    });

    let tollRoadsElement = document.getElementById("toll-roads");
    let avoidTolls = tollRoadsElement ? !tollRoadsElement.checked : true;
    let avoidFerries = true;

    // 🔥 Jeśli użytkownik podał poprzedni rozładunek, ustawiamy go jako punkt startowy
    let startAddress = previousDeliveryAddress ? previousDeliveryAddress : pickupAddress;

    let request = {
        origin: startAddress, // Uwzględnia poprzedni rozładunek, jeśli podany
        destination: deliveryAddress,
        waypoints: waypoints,
        travelMode: "DRIVING",
        avoidTolls: avoidTolls,
        avoidFerries: avoidFerries
    };

    directionsService.route(request, function (result, status) {
        if (status === "OK") {
            directionsRenderer.setDirections(result);

            let totalDistance = result.routes[0].legs.reduce((acc, leg) => acc + leg.distance.value, 0);
            distanceResult.innerText = `Łączny dystans: ${(totalDistance /
                1000).toFixed(1)} km`;
                // 🔹 GENEROWANIE LINKU DO TRASY W GOOGLE MAPS
            let mapsURL = `https://www.google.com/maps/dir/${encodeURIComponent(startAddress)}`;
            waypoints.forEach(wp => {
                mapsURL += `/${encodeURIComponent(wp.location)}`;
            });
            mapsURL += `/${encodeURIComponent(deliveryAddress)}`;

            mapLinkInput.value = mapsURL; // 🔥 Wyświetlenie linku w polu
        } else {
            distanceResult.innerText = `Błąd: ${status}`;
            console.error(`❌ Błąd Google Maps: ${status}`);
        }
    });
}
// PODŚWIETLANIE POPRZEDNIEGO ODCINKA TRASY
function drawPreviousToPickupLine() {
    let previousDeliveryInput = document.getElementById("previous-delivery");
    let pickupInput = document.getElementById("pickup");

    let previousAddress = previousDeliveryInput ? previousDeliveryInput.value.trim() : "";
    let pickupAddress = pickupInput.value.trim();

    if (!previousAddress || !pickupAddress) {
        if (previousToPickupLine) {
            previousToPickupLine.setMap(null); // Usuwamy starą linię, jeśli nie ma adresu
            previousToPickupLine = null;
        }
        return;
    }

    let geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ address: previousAddress }, function (prevResults, prevStatus) {
        if (prevStatus !== "OK") {
            console.error("❌ Nie można znaleźć lokalizacji poprzedniego rozładunku:", prevStatus);
            return;
        }
        
        geocoder.geocode({ address: pickupAddress }, function (pickupResults, pickupStatus) {
            if (pickupStatus !== "OK") {
                console.error("❌ Nie można znaleźć lokalizacji załadunku:", pickupStatus);
                return;
            }
            
            let previousLocation = prevResults[0].geometry.location;
            let pickupLocation = pickupResults[0].geometry.location;

            if (previousToPickupLine) {
                previousToPickupLine.setMap(null); // Usunięcie starej linii
            }

            previousToPickupLine = new google.maps.Polyline({
                path: [previousLocation, pickupLocation],
                geodesic: true,
                strokeColor: "#FF69B4", // Różowy kolor
                strokeOpacity: 1.0,
                strokeWeight: 4
            });

            previousToPickupLine.setMap(map);
        });
    });
}

// 🔹 9. PRZELICZANIE DYSTANSU PO ZMIANIE TRASY
function recalculateDistance() {
    let distanceResult = document.getElementById("distance-result");
    let directions = directionsRenderer.getDirections();

    if (!directions || !directions.routes || directions.routes.length === 0) {
        distanceResult.innerText = "Błąd: Nie można przeliczyć dystansu.";
        return;
    }

    let totalDistance = directions.routes[0].legs.reduce((acc, leg) => acc + leg.distance.value, 0);
    distanceResult.innerText = `Łączny dystans: ${(totalDistance / 1000).toFixed(1)} km`;

    console.log(`🔄 Trasa zmodyfikowana. Nowy dystans: ${(totalDistance / 1000).toFixed(1)} km`);
}
// 🔹 10. AKTUALIZACJA POLA "TRASA" Z KODAMI POCZTOWYMI I KRAJAMI
function updateRoute() {
    let pickupInput = document.getElementById("pickup");
    let deliveryInput = document.getElementById("delivery");
    let routeInput = document.getElementById("route");
    let truckTypeSwitch = document.getElementById("truck-type"); // 🔥 Pobieramy stan przełącznika

    if (!pickupInput || !deliveryInput || !routeInput) return;
    if (!pickupInput.value.trim() || !deliveryInput.value.trim()) {
        console.warn("⚠️ Nie można zaktualizować trasy - brak danych.");
        return;
    }

    let pickupCode = getPostalCode(pickupInput);
    let deliveryCode = getPostalCode(deliveryInput);

    let stopsCodes = Array.from(document.querySelectorAll(".stop-input"))
        .map(stop => getPostalCode(stop))
        .filter(code => code !== "");

        if (truckTypeSwitch.checked) {
            // 🔹 TRYB EUROPEJEC (DOMYŚLNY)

    let fullRoute = [pickupCode, ...stopsCodes, deliveryCode].join("-");
    routeInput.value = fullRoute;

} else {
    // 🔹 TRYB MEBLOWY (SPECJALNE FORMATOWANIE)
if (stopsCodes.length > 0) {
    let firstStop = stopsCodes[0]; // 🔥 Pierwszy przystanek
    let firstStopPrefix = firstStop.substring(0, 2); // Prefiks kraju
    let firstStopPostal = firstStop.match(/\d{2}/); // Pierwsze dwie cyfry kodu pocztowego

    let formattedStops = `${firstStopPrefix}${firstStopPostal ? firstStopPostal[0] : "00"}*${stopsCodes.length}`;
    let fullRoute = `${pickupCode}-${formattedStops}-${deliveryCode}`;

    routeInput.value = fullRoute;
} else {
    // 🔹 Jeśli brak przystanków → standardowy format
    routeInput.value = `${pickupCode}-${deliveryCode}`;
}

}

console.log("🚛 Trasa wygenerowana:", routeInput.value);
}
// 🔹 11. POBIERANIE KODU POCZTOWEGO I KRAJU
function getPostalCode(input) {
    if (!input) return "";
    
    let placeData = input.getAttribute("data-place");
    if (!placeData) {
        console.warn(`⚠️ Brak danych miejsca dla: ${input.id}`);
        return "";
    }

    let place = JSON.parse(placeData);
    if (!place || !place.address_components) {
        console.warn(`⚠️ Brak komponentów adresu dla: ${input.id}`);
        return "";
    }

    let postalCode = "";
    let countryPrefix = "";

    place.address_components.forEach(component => {
        if (component.types.includes("postal_code")) {
            postalCode = component.long_name;
        }
        if (component.types.includes("country")) {
            countryPrefix = countrySymbols[component.short_name] || component.short_name;
        }
    });

    if (!postalCode || !countryPrefix) {
        console.warn(`⚠️ Nie udało się pobrać kodu pocztowego lub kraju dla: ${input.id}`);
        return "";
    }

    console.log(`📌 Pobrano dla ${input.id}: ${countryPrefix}${postalCode}`);
    return countryPrefix + postalCode;
}

const countrySymbols = {
    "PL": "PL", "DE": "DE", "FR": "FR", "ES": "ES", "IT": "IT",
    "GB": "UK", "NL": "NL", "BE": "BE", "AT": "AT", "CH": "CH",
    "DK": "DK", "SE": "SE", "NO": "NO", "FI": "FI", "CZ": "CZ",
    "SK": "SK", "HU": "HU", "LT": "LT", "LV": "LV", "EE": "EE",
    "PT": "PT", "GR": "GR", "RO": "RO", "BG": "BG", "IE": "IE"
};
// 🔹 12. AKTUALIZACJA TABELI PO KLIKNIĘCIU PRZYCISKU
function updateTable() {
    let vehicle = document.getElementById("vehicle").value || "";
    let pickupDate = document.getElementById("pickup-date").value || "";
    let deliveryDate = document.getElementById("delivery-date").value || "";
    let pickupAddress = document.getElementById("pickup").value || "";
    let deliveryAddress = document.getElementById("delivery").value || "";
    let route = document.getElementById("route").value || "";
    let plannedKm = document.getElementById("distance-result").innerText.replace("Łączny dystans: ", "").replace(" km", "") || "";
    let country = document.getElementById("country").value || "";
    let pickupTime = document.getElementById("pickup-time").value || ""; // NOWE POLE
    let deliveryTime = document.getElementById("delivery-time").value || ""; // NOWE POLE
    let mapLink = document.getElementById("map-link").value || "Brak linku"; // NOWE POLE

    // 🔹 Pobranie trybu meblowego
    let truckTypeSwitch = document.getElementById("truck-type");

    // 🔹 Pobranie nazwy plików załączników (tylko dla trybu europejskiego)
    let cmrPhoto = document.getElementById("cmr-photo").files.length > 0 ? document.getElementById("cmr-photo").files[0].name : "";
    let hotelInvoice = document.getElementById("hotel-invoice").files.length > 0 ? document.getElementById("hotel-invoice").files[0].name : "";

    // 🔹 Pobranie linku do trasy, jeśli jest tryb meblowy
    let routeLink = "Brak linku";
    if (!truckTypeSwitch.checked) { // Tryb meblowy
        let pickup = encodeURIComponent(pickupAddress);
        let delivery = encodeURIComponent(deliveryAddress);
        let stops = Array.from(document.querySelectorAll(".stop-input"))
            .map(input => encodeURIComponent(input.value.trim()))
            .filter(stop => stop !== "");

        let mapsURL = `https://www.google.com/maps/dir/${pickup}`;
        stops.forEach(stop => {
            mapsURL += `/${stop}`;
        });
        mapsURL += `/${delivery}`;

        routeLink = mapsURL;
    }

    console.log("🔗 Link do trasy:", routeLink); // Sprawdzenie w konsoli


     // 🔹 Formatowanie daty do "DD-MM / DD-MM"
let formattedDate = "";
if (pickupDate && deliveryDate) {
    let pickupFormatted = pickupDate.split("-").reverse().slice(0, 2).join("-"); // YYYY-MM-DD → DD-MM
    let deliveryFormatted = deliveryDate.split("-").reverse().slice(0, 2).join("-");
    formattedDate = `${pickupFormatted} / ${deliveryFormatted}`;
}

let tbody = document.querySelector("#data-table tbody");

// 🔹 Sprawdzenie, czy istnieje ostatni wiersz i pobranie danych
let lastRow = tbody.lastElementChild;
let lastDeliveryAddress = "";

if (lastRow && lastRow.cells.length > 1) { 
    lastDeliveryAddress = lastRow.cells[7].textContent.trim(); // Pobiera adres rozładunku z ostatniego wiersza
}

// 🔥 Ustawienie poprzedniego rozładunku ZAWSZE na ostatni wpis z tabeli
document.getElementById("previous-delivery").value = lastDeliveryAddress;

// 🔹 Tworzymy nowy wiersz
let row = document.createElement("tr");

// 🔹 Tworzymy przycisk "Usuń trasę"
let deleteButton = document.createElement("button");
deleteButton.textContent = "🗑 Usuń";
deleteButton.classList.add("delete-button");
deleteButton.addEventListener("click", function () {
    row.remove(); // 🔥 Usuwa tylko ten jeden wiersz
});

row.innerHTML = `
    <td>${vehicle}</td>
    <td>${formattedDate}</td>
    <td>${route}</td>
    <td>${pickupDate}</td>
    <td>${pickupAddress}</td>
    <td>${pickupTime}</td> <!-- NOWA KOLUMNA -->
    <td>${deliveryDate}</td>
    <td>${deliveryAddress}</td>
    <td>${deliveryTime}</td> <!-- NOWA KOLUMNA -->
    <td><a href="${mapLink}" target="_blank">🔗 Trasa</a></td> <!-- NOWA KOLUMNA -->
    <td></td> <!-- Nr zlecenia (puste) -->
    <td></td> <!-- ZLECENIE PDF (puste) -->
    <td>${plannedKm}</td>
    <td></td> <!-- KWOTA ZLECENIA (puste) -->
    <td></td> <!-- Stawka (puste) -->
    <td></td> <!-- Hotele (puste) -->
    <td>${hotelInvoice}</td> <!-- FAKTURA ZA HOTEL -->
    <td></td> <!-- Różnica (puste) -->
    <td></td> <!-- Opłaty za drogi (puste) -->
    <td></td> <!-- Paliwo (puste) -->
    <td></td> <!-- Faktura (puste) -->
    <td></td> <!-- DATA WYSTAWIENIA (puste) -->
    <td></td> <!-- FAKTURA PDF (puste) -->
    <td>${cmrPhoto}</td> <!-- DOKUMENTY CMR -->
    <td>${country}</td>
`;

// 🔥 RESETUJEMY WSZYSTKIE INNE POLA PO DODANIU WIERSZA
document.getElementById("vehicle").value = "";
document.getElementById("pickup-date").value = "";
document.getElementById("delivery-date").value = "";
document.getElementById("pickup").value = "";
document.getElementById("delivery").value = "";
document.getElementById("route").value = "";
document.getElementById("pickup-time").value = "";
document.getElementById("delivery-time").value = "";
document.getElementById("map-link").value = "";
document.getElementById("country").value = "";

// ❌ USUWAMY RESETOWANIE "Poprzedniego Rozładunku" po zmianie pojazdu!

    // 🔹 Dodajemy przycisk "Usuń" do wiersza
    let deleteCell = document.createElement("td");
    deleteCell.appendChild(deleteButton);
    row.prepend(deleteCell);

// 🔥 Dodajemy nowy wiersz do tabeli (bez usuwania poprzednich)
tbody.appendChild(row);
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ Dokument w pełni załadowany!");

    let addRouteButton = document.getElementById("add-route-button"); // ZAMIANA
    let copyButton = document.getElementById("copy-button");
    let removeDuplicatesButton = document.getElementById("usun-duplikaty-button"); // Nowy przycisk


    if (addRouteButton) { // ZAMIANA
        addRouteButton.addEventListener("click", function () { // ZAMIANA
            updateRoute(); // Najpierw aktualizuje trasę
            updateTable(); // Potem dodaje nowy wiersz do tabeli
        });
    } else {
        console.error("❌ Błąd: Nie znaleziono przycisku `add-route-button`!"); // ZAMIANA
    }

    if (copyButton) {
        copyButton.addEventListener("click", function () {
            let rows = document.querySelectorAll("#data-table tbody tr"); // Pobiera wszystkie wiersze w tabeli
            let copiedText = "";

            if (rows.length === 0) {
                alert("⚠️ Brak danych do skopiowania!");
                return;
            }

            rows.forEach(row => {
                let rowText = Array.from(row.children)
    .slice(1) // Pomija pierwszą kolumnę ("Usuń")
    .map(cell => cell.textContent.trim()) // Pobiera tylko tekst
    .join("\t"); // Format TSV (Tab-separated values)
                copiedText += rowText + "\n";
            });

            navigator.clipboard.writeText(copiedText).then(() => {
                alert("📋 Wszystkie trasy skopiowane do schowka!");
            });
        });
    } else {
        console.error("❌ Błąd: Nie znaleziono przycisku `copy-button`!");
    }

    // 🔥 NOWY OBSŁUGIWANY PRZYCISK "USUŃ DUPLIKATY"
    if (removeDuplicatesButton) {
        removeDuplicatesButton.addEventListener("click", function () {
            removeDuplicates();
        });
    } else {
        console.error("❌ Błąd: Nie znaleziono przycisku `usun-duplikaty-button`!");
    }
});

window.initMap = initMap;

// 🔹 Ostrzeżenie przed odświeżeniem strony lub zamknięciem karty
window.addEventListener("beforeunload", function (event) {
    event.preventDefault(); // Standardowe zachowanie przeglądarki
    event.returnValue = "Czy na pewno chcesz odświeżyć stronę? Wszystkie utworzone trasy zostaną usunięte.";
});
// 🔹 Ukrywanie ekranu ładowania
function hideLoadingScreen() {
    let loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
        loadingScreen.style.display = "none";
    }
}
// 14 🔹 OBSŁUGA PRZEŁĄCZNIKA TRYBU (Europejec / Meblowy)
document.addEventListener("DOMContentLoaded", function () {
    let truckTypeSwitch = document.getElementById("truck-type");
    let truckTypeLabel = document.getElementById("truck-type-label");

    // 🔥 Sprawdza ostatnie zapisane ustawienie w localStorage
    let savedMode = localStorage.getItem("truckTypeMode");
    if (savedMode === "europejec") {
        truckTypeSwitch.checked = true;
        truckTypeLabel.textContent = "Europejec";
    } else {
        truckTypeSwitch.checked = false;
        truckTypeLabel.textContent = "Meblowy";
    }

    // 🔥 Zmienia tekst i zapisuje wybór po kliknięciu przełącznika
    truckTypeSwitch.addEventListener("change", function () {
        if (this.checked) {
            truckTypeLabel.textContent = "Europejec";
            localStorage.setItem("truckTypeMode", "europejec");
        } else {
            truckTypeLabel.textContent = "Meblowy";
            localStorage.setItem("truckTypeMode", "meblowy");
        }
    });
});
// 15.🔹 Sprawdza, czy Google Maps API jest załadowane
function waitForGoogleMaps(callback, retries = 5) {
    let attempts = 0;

    function check() {
        if (typeof google !== "undefined" && google.maps) {
            console.log("✅ Google Maps API gotowe!");
            hideLoadingScreen(); // 🔥 Ukrywa ekran ładowania
            callback();
        } else {
            attempts++;
            if (attempts < retries) {
                console.warn(`⏳ Google Maps API niegotowe. Próba ${attempts}/${retries}...`);
                setTimeout(check, 2000); // Sprawdza co 2 sekundy
            } else {
                console.error("❌ Google Maps API NIE załadowało się! Próbuję ponownie...");
                reloadGoogleMaps(); // 🔄 Przeładowuje API
                setTimeout(() => waitForGoogleMaps(callback, retries), 5000); // 🔁 Kolejna próba za 5 sekund
            }
        }
    }
    check();
}
document.addEventListener("DOMContentLoaded", function () {
    let shareButton = document.getElementById("share-route-button");

    if (shareButton) {
        shareButton.addEventListener("click", function () {
            let pickup = document.getElementById("pickup").value.trim();
            let delivery = document.getElementById("delivery").value.trim();
            let stops = Array.from(document.querySelectorAll(".stop-input"))
                .map(input => input.value.trim())
                .filter(stop => stop !== "");

            let distanceText = document.getElementById("distance-result").innerText || "Brak danych";
            let distanceValue = distanceText.replace("Łączny dystans: ", "").replace(" km", "").trim();

            if (!pickup || !delivery) {
                alert("❗ Podaj adres załadunku i rozładunku przed udostępnieniem.");
                return;
            }

            // Tworzymy adres URL do Google Maps
            let mapsURL = `https://www.google.com/maps/dir/${encodeURIComponent(pickup)}`;
            stops.forEach(stop => {
                mapsURL += `/${encodeURIComponent(stop)}`;
            });
            mapsURL += `/${encodeURIComponent(delivery)}`;

            // Tworzymy pełny link do udostępnienia z dystansem
            let shareText = `📍 Trasa: ${pickup} ➝ ${stops.join(" ➝ ")} ➝ ${delivery}\n🚛 Dystans: ${distanceValue} km\n🔗 Mapa: ${mapsURL}`;

            // Kopiowanie linku do schowka
            navigator.clipboard.writeText(shareText).then(() => {
                alert("📍 Link do trasy został skopiowany do schowka:\n" + shareText);
            }).catch(err => {
                console.error("❌ Błąd podczas kopiowania linku:", err);
                alert("❌ Nie udało się skopiować linku.");
            });

            // Otwórz mapę w nowej karcie
            window.open(mapsURL, "_blank");
        });
    }
});


// 16.🔹 Funkcja ponownego ładowania Google Maps API
function reloadGoogleMaps() {
    console.warn("🔄 Ponowne ładowanie Google Maps API...");
    let oldScript = document.querySelector("script[src*='maps.googleapis']");
    if (oldScript) oldScript.remove();

    let newScript = document.createElement("script");
    newScript.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBQfbB1-KewAmrPcoPXq4aYNsQggT1iPHY&libraries=places&callback=initMap";
    newScript.async = true;
    newScript.defer = true;
    document.head.appendChild(newScript);
}

// 17. 🔹 FUNKCJA USUWANIA DUPLIKATÓW
function removeDuplicates() {
    let table = document.getElementById("data-table");
    let rows = Array.from(table.querySelectorAll("tbody tr"));

    let uniqueRows = new Set(); // Zestaw do przechowywania unikalnych wpisów

    rows.forEach(row => {
        let rowData = Array.from(row.children)
            .slice(1) // Pomijamy pierwszą kolumnę ("Usuń")
            .map(cell => cell.textContent.trim()) // Pobieramy zawartość każdej komórki
            .join("|"); // Tworzymy unikalny identyfikator wiersza

        if (uniqueRows.has(rowData)) {
            row.remove(); // Jeśli wpis już istnieje, usuwamy duplikat
        } else {
            uniqueRows.add(rowData); // Jeśli nowy wpis, dodajemy do zestawu
        }
    });

    alert("✅ Duplikaty zostały usunięte!");
}

// 🔹 Inicjalizacja mapy z systemem powtarzania
waitForGoogleMaps(initMap);