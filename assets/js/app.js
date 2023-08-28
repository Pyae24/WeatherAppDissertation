
var API_KEY = "d212b178a6379b52aaeef739baa2bede";

// -- On load --
$(document).ready(function(){
    // If geolocation is not supported, hide the geolocaion icon
    if (!navigator.geolocation){
        $('#geolocation').hide();
    }
    // Get default city
    var city;
    if (document.location.hash){
        // Get city from hash
        city = document.location.hash.substr(1);
    }
    else {
        // Default city
        city = "Yangon";
    }
    // Get and display current date
    date = moment();
    for (var i = 0; i < 5; i++){
        // Display date
        day = $("#meteo-day-" + (i+1));
        day.find(".name").text(date.format("dddd"));
        day.find(".date").text(date.format("DD/MM"));
        // Go to the next day
        date = date.add(1, 'days')
    }
    // Loading...
    loading = $('#search-loading');
    loading.attr('class', 'loading inload');
    // Get and update meteo
    getMeteoByCity(city, function (data, error) {
        if (error == null) {
            displayMeteo(data);
        }
        else {
            meteoTitle = $('#meteo-title span');
            meteoTitle.html('City <span class="text-muted">' + city + '</span> not found');
        }
        // Stop loader
        setTimeout(function () {
            loading.attr('class', 'loading')
        }, 500);
    });
});


// -- Core --
$("#meteo-form").submit(function (event) {
    // Loading...
    loading = $('#search-loading');
    loading.attr('class', 'loading inload');
    // Get and update meteo
    var city = event.currentTarget[0].value;
    getMeteoByCity(city, function (data, error){
        if (error == null) {
            displayMeteo(data);
        }
        else {
            meteoTitle = $('#meteo-title span');
            meteoTitle.html('City <span class="text-muted">' + city + '</span> not found');
        }
        // Stop loader
        setTimeout(function () {
            loading.attr('class', 'loading')
        }, 500);
    });
    // Don't refresh the page
    return false;
});

$("#geolocation").click(function (event) {
    navigator.geolocation.getCurrentPosition(function (position) {
        // Loading...
        loading = $('#search-loading');
        loading.attr('class', 'loading inload');
        // Get latitude and longitude
        var lat = position.coords.latitude
        var lon = position.coords.longitude
        // Get and update meteo
        getMeteoByCoordinates(lat, lon, function (data, error) {
            if (error == null) {
                displayMeteo(data);
            }
            else {
                meteoTitle = $('#meteo-title span');
                meteoTitle.html('Can\'t  get meteo for your position');
            }
            // Stop loader
            setTimeout(function () {
                loading.attr('class', 'loading')
            }, 500);
        });
    });
});

function getMeteoByCity(city, callback){
    $.ajax({
        url: "https://api.openweathermap.org/data/2.5/forecast?q=" + city + "&APPID=" + API_KEY,
        success: function(data){
            callback(data, null);
        },
        error: function(req, status, error){
            callback(null, error);
        }
    });
}

function getMeteoByCoordinates(lat, lon, callback){
    $.ajax({
        url: "https://api.openweathermap.org/data/2.5/forecast?lat=" + lat + "&lon=" + lon + "&APPID=" + API_KEY,
        success: function(data){
            callback(data, null);
        },
        error: function(req, status, error){
            callback(null, error);
        }
    });
}

function displaySunriseSunset(lat, long){
    date = moment();
    for (var i = 0; i < 5; i++) {
        // Get sunrise and sunset
        var times = SunCalc.getTimes(date, lat, long);
        var sunrise = pad(times.sunrise.getHours(), 2) + ':' + pad(times.sunrise.getMinutes(), 2);
        var sunset = pad(times.sunset.getHours(), 2) + ':' + pad(times.sunset.getMinutes(), 2);
        // Display sunrise and sunset
        day = $("#meteo-day-" + (i + 1));
        day.find('.meteo-sunrise .meteo-block-data').text(sunrise);
        day.find('.meteo-sunset .meteo-block-data').text(sunset);
        // Go to the next day
        date = date.add(1, 'days')
    }

}

function displayMeteo(data){
    // Update Google Map URL
    googleMapCity = "https://www.google.fr/maps/place/" + data.city.coord.lat + "," + data.city.coord.lon;
    $('#meteo-title span').html('Weather in <a href="' + googleMapCity + '" class="text-muted meteo-city" target="_blank">' + data.city.name + ', ' + data.city.country + '</a>');
    var dailyPopValues = [];
    // Update meteo for each day
    var tempMoyenne = 0;
    for (var i = 0; i < 5; i++) {
        var dayStartIndex = i * 8;
        var dayEndIndex = dayStartIndex + 8;
        var dayPopSum = 0;

        for (var j = dayStartIndex; j < dayEndIndex; j++) {
            dayPopSum += data.list[j].pop;
        }

        var averagePop = (dayPopSum / 8) * 100;
        dailyPopValues.push(averagePop);
    }

    for (var i = 0; i < 5; i++) {
        var meteo = data.list[i * 8];

        var day = $("#meteo-day-" + (i + 1));
        var icon = day.find(".meteo-temperature .wi");
        var temperature = day.find(".meteo-temperature .data");
        var pop = day.find(".meteo-humidity .meteo-block-data");
        var wind = day.find(".meteo-wind .meteo-block-data");
        var sunrise = day.find(".meteo-sunrise .meteo-block-data");
        var sunset = day.find(".meteo-sunset .meteo-block-data");

        var code = meteo.weather[0].id;
        icon.attr('class', 'wi wi-owm-' + code);
        temperature.text(toCelsius(meteo.main.temp) + "°C");
        pop.text(dailyPopValues[i].toFixed(2) + "%");
        wind.text(meteo.wind.speed + " km/h");
        tempMoyenne += meteo.main.temp;
    }
    displaySunriseSunset(data.city.coord.lat, data.city.coord.lon);
    // Get custom gradient according to the temperature
    tempMoyenne = toCelsius(tempMoyenne / 3);
    var hue1 = 30 + 240 * (30 - tempMoyenne) / 60;
    var hue2 = hue1 + 30;
    rgb1 = 'rgb(' + hslToRgb(hue1 / 360, 0.6, 0.5).join(',') + ')';
    rgb2 = 'rgb(' + hslToRgb(hue2 / 360, 0.6, 0.5).join(',') + ')';
    $('body').css('background', 'linear-gradient(' + rgb1 + ',' + rgb2 + ')');
}